const DB_Model_Sites = require("../../db/Model_Site");
const DB_Model_Analysis = require("../../db/Model_TermAnalysis");
const connectDB = require("../../db/connectDB");
const { parse } = require("node-html-parser");
const model = require("wink-eng-lite-model");
const nlp = require("wink-nlp")(model);
const its = require("wink-nlp/src/its.js");
const as = require("wink-nlp/src/as.js");
// const BM25Vectorizer = require("wink-nlp/utilities/bm25-vectorizer");
// const bm25 = BM25Vectorizer();
var WordPOS = require("wordpos");
var wordpos = new WordPOS();
const similarity = require("wink-nlp/utilities/similarity.js");
const skmeans = require("skmeans");
const silhouetteCoefficient = require("../silhouette_coefficient");
const { breadth } = require("treeverse");
const { writeFileSync, unlinkSync } = require("fs");
const { spawnSync } = require("child_process");
const distinctColors = require("distinct-colors").default;
const clone = require("clone");

// ----

process.on("message", (message) => {
  childTermAnalysis(message.sanitizedId, message.sanitizedUpperNodeLimit, message.sanitizedUpperSubdirNum);
});

// ----

const childTermAnalysis = async (sanitizedId, sanitizedUpperNodeLimit, sanitizedUpperSubdirNum) => {
  try {
    await connectDB(process.env.MONGO_DB_URI);

    const site = await DB_Model_Sites.findById(sanitizedId);

    // in case there are less subdirs than the upper limit
    sanitizedUpperSubdirNum =
      sanitizedUpperSubdirNum > site.subdirsname.length ? site.subdirsname.length : sanitizedUpperSubdirNum;

    let nodesDirArr = []; // each index is a site directory
    // each subdirectory of the site is passed in extractTerms to get back the terms. I am also passing the index of the subdirectory so that I can use it as part of the Id of each node
    let domFromAllSubdirs = [];
    let countId = 0;
    for (let i = 0; i < sanitizedUpperSubdirNum; i++) {
      const dom = parse(site.html[i]);
      domFromAllSubdirs.push(dom);
      nodesDirArr.push(await extractTerms(dom, i, countId));
      countId += nodesDirArr[i].length;
    }

    // bm25
    // const termsPerSubd = nodesDirArr.map((subd) => {
    //   const subdTerms = subd.map((node) => node.terms);
    //   return subdTerms.flat(10).join(" ");
    // });
    // termsPerSubd.forEach((doc) => bm25.learn(nlp.readDoc(doc).tokens().out(its.normal)));
    // const bm25Matrix = termsPerSubd.map((subd) => {
    //   return bm25.vectorOf(nlp.readDoc(subd).tokens().out(its.normal));
    // });
    // const bm25Terms = bm25.out(its.terms);

    // bm25 with nodes
    // let tfidfFunMatrix = [];
    // let tfidfNodesMatrix = [];
    // nodesDirArr.forEach((subd) => {
    //   const tfidf = new TfIdf();
    //   subd.forEach((node) => tfidf.addDocument(node.terms.join(" ")));
    //   tfidfFunMatrix.push(tfidf);
    //   tfidfNodesMatrix.push([]);
    // });
    // nodesDirArr.forEach((subd, index) => {
    //   subd.forEach((node) => {
    //     let sum = 0;
    //     tfidfFunMatrix[index].tfidfs(node.terms.join(" "), function (i, measure) {
    //       // console.log('document #' + i + ' is ' + measure);
    //       // tfidfNodesMatrix[index].push(measure);
    //       sum = sum + measure;
    //     });
    //     tfidfNodesMatrix[index].push(sum);
    //   });
    // });

    // Bow
    // const allDirsTerms = nodesDirArr.map((subd) => {
    //   return subd.map((node) => node.terms);
    // });
    // const allDirsBow = as.bow(allDirsTerms.flat(10));

    // cosine similarity between node and subdir
    // const cosineSimilarityPerSubd = getCosineSimilarityPerSubd(nodesDirArr);

    // [node(terms) x node(terms)] -> clusters
    // cos similarity between all nodes using their terms bows
    console.log("Before getKmeansNodexNode");
    const { maxAllres, clusteredBow } = getKmeansNodexNode(nodesDirArr);
    //
    console.log("Before convertToGspanFormatAndModifyDom");
    const gspanIn = convertToGspanFormatAndModifyDom(domFromAllSubdirs, sanitizedId, maxAllres, site.url);
    console.log("Before pythonGspan");
    const gspanOut = pythonGspan(sanitizedId, sanitizedUpperNodeLimit);

    // domFromAllSubdirs2 is a clone of domFromAllSubdirs that will not have its different nodes stylized depending on their cluster label. It will be used in the gspanOutToDotGraph function to render the frequent trees in html
    const domFromAllSubdirsUnmodified = clone(domFromAllSubdirs);
    // const domFromAllSubdirs2 = structuredClone(domFromAllSubdirs);

    // adds stylization (colored rectangles) to dom elements that belong in a cluster
    stylizedDomElementsByClusterLabel(domFromAllSubdirs, maxAllres);

    console.log("Before gspanOutToDotGraph");
    const dotgraphTrees = gspanOut.graphs
      ? gspanOutToDotGraph(gspanOut, domFromAllSubdirsUnmodified, nodesDirArr)
      : null;
    const newAnalysis = await DB_Model_Analysis.findOneAndUpdate(
      { datasetSiteId: sanitizedId },
      {
        status: `Completed at ${new Date()}. With query parameters uppernodelimit=${sanitizedUpperNodeLimit} and subdirnum=${sanitizedUpperSubdirNum}`,
        analysis: {
          dotgraphTrees,
          gspanOut,
          gspanIn,

          clusteredBow,
          // testcluster: [...testcluster],
          maxAllres,
          subdirsname: site.subdirsname,
          nodes: nodesDirArr,
          backRenderedDoms: domFromAllSubdirs.map((dom) => dom.toString()),
          // allDirsBow,
          // bm25Matrix,
          // bm25Terms,
          // tfidfNodesMatrix,
          // cosineSimilarityPerSubd,
        },
      },
      { new: true, upsert: true }
    );
    console.log("Finito");
    process.exit();
  } catch (error) {
    try {
      const newAnalysis = await DB_Model_Analysis.findOneAndUpdate(
        { datasetSiteId: sanitizedId },
        {
          status: "Error analyzing at " + new Date(),
          analysis: null,
        },
        { new: true, upsert: true }
      );
    } catch (error) {
      console.log("error saving the error in status: " + error.message);
    }
    console.log(error.message);
    process.exit();
  }
};

// ----

const gspanOutToDotGraph = (gspanOut, domFromAllSubdirsUnmodified, nodesDirArr) => {
  // sort based on support
  const dotGraphsTemp = [];
  const dotSupport = [];
  const dotWhere = [];
  const dotOrigins = [];
  const tempList = [];
  for (let i = 0; i < gspanOut.support.length; i++) {
    tempList.push({
      graphs: gspanOut.graphs[i],
      support: gspanOut.support[i],
      where: gspanOut.where[i],
      origins: gspanOut.origins[i],
    });
  }
  tempList.sort((a, b) => {
    return b.support - a.support;
  });
  for (let i = 0; i < gspanOut.support.length; i++) {
    dotGraphsTemp.push(tempList[i].graphs);
    dotSupport.push(tempList[i].support);
    dotWhere.push(tempList[i].where);
    dotOrigins.push(tempList[i].origins);
  }

  //
  // convert to dot format
  const dotgraphs = [];
  const allNodesFromAllSubds = nodesDirArr.flat(10);

  for (let graph of dotGraphsTemp) {
    dotgraphs.push([]);

    for (let line of graph) {
      if (line.startsWith("v")) {
        const nodeLabel = line.split(" ")[2];
        dotgraphs.at(-1).push(`${line.split(" ")[1]} [label="${nodeLabel}"]`);
        // TODO the nodeLabel is the clusterlabel and not the node id so I have to change it
        // dotgraphs
        //   .at(-1)
        //   .push(
        //     `${line.split(" ")[1]} [label="${nodeLabel}${
        //       nodeLabel > -1 ? ":\n" + allNodesFromAllSubds[nodeLabel].terms.join("\n") : ""
        //     }"]`
        //   );
      } else if (line.startsWith("e")) {
        dotgraphs.at(-1).push(`${line.split(" ")[1]} -> ${line.split(" ")[2]}`);
      } else if (line.startsWith("t")) {
        dotgraphs.at(-1).push(`digraph ${line.split(" ")[2]} {`);
      }
    }

    dotgraphs.at(-1).push(`}`);
  }

  //
  // make a temporary nodeLabels array to clean up unecessary data
  const nodeLabels = [];
  for (let i = 0; i < dotgraphs.length; i++) {
    nodeLabels.push(Array.from(dotgraphs[i].join("\n").matchAll(/^\d+ \[label="(-?\d+)/gm), (x) => x[1]));
  }

  // remove dotgraphs that have only -1 labels
  for (let i = 0; i < nodeLabels.length; i++) {
    if (nodeLabels[i].every((x) => x === "-1")) {
      dotgraphs.splice(i, 1);
      dotWhere.splice(i, 1);
      dotSupport.splice(i, 1);
      dotOrigins.splice(i, 1);
      nodeLabels.splice(i, 1);
      i--;
    }
  }

  // sort and filter to be used for later analyzing and cleanup
  for (let i = 0; i < nodeLabels.length; i++) {
    nodeLabels[i].sort();
    nodeLabels[i] = nodeLabels[i].filter((x) => x !== "-1");
  }

  // remove frequent trees that are the same as others but with additional -1 labels. Basically remove unecessary -1 labels
  for (let i = 0; i < nodeLabels.length; i++) {
    for (let j = 0; j < nodeLabels.length; j++) {
      if (i === j) {
        continue;
      }
      if (nodeLabels[j].length > nodeLabels[i].length) {
        continue;
      }
      if (nodeLabels[j].every((x) => nodeLabels[i].includes(x))) {
        dotgraphs.splice(j, 1);
        dotWhere.splice(j, 1);
        dotSupport.splice(j, 1);
        dotOrigins.splice(j, 1);
        nodeLabels.splice(j, 1);
        if (j < i) {
          i--;
        }
        j--;
      }
    }
  }

  // create the html rendering of the frequent trees
  const dotgraphBackRenderedDoms = [];
  for (let i = 0; i < nodeLabels.length; i++) {
    const dom = clone(domFromAllSubdirsUnmodified[dotWhere[i][0]]);
    // dotOrigins.forEach((graph) => {
    //   graph.forEach((subdir) => {
    //     subdir.forEach((origin) => {
    //       origin.forEach((line) => {
    //         dom
    //           .querySelector(`[vertexCounter=${line[0]}]`)
    //           .setAttribute("style", `border-style: solid;border-color: red;border-width: thick;`);
    //         dom
    //           .querySelector(`[vertexCounter=${line[1]}]`)
    //           .setAttribute("style", `border-style: solid;border-color: red;border-width: thick;`);
    //       });
    //     });
    //   });
    // });
    dotOrigins.forEach((graph) => {
      graph[0].forEach((origin) => {
        origin.forEach((line) => {
          dom
            .querySelector(`[vertexCounter=${line[0]}]`)
            .setAttribute("style", `border-style: solid;border-color: red;border-width: thick;`);
          dom
            .querySelector(`[vertexCounter=${line[1]}]`)
            .setAttribute("style", `border-style: solid;border-color: red;border-width: thick;`);
        });
      });
    });

    // ---
    // for (let number of nodeLabels[i]) {
    //   dom
    //     .querySelector(`[customId$=${number}]`)
    //     .setAttribute("style", `border-style: solid;border-color: red;border-width: thick;`);
    // }
    dotgraphBackRenderedDoms.push(dom.toString());
  }

  return { dotgraphs, dotWhere, dotSupport, dotgraphBackRenderedDoms };
};

// ----

const pythonGspan = (sanitizedId, sanitizedUpperNodeLimit) => {
  const pyArgs = [
    "-m",
    "python_lib.gspan_mining",
    "-s",
    "2",
    "-u",
    sanitizedUpperNodeLimit,
    "-w",
    "True",
    "-d",
    "True",
    sanitizedId + "gspanIn.txt",
  ];
  const pyProg = spawnSync("python", pyArgs, { maxBuffer: Infinity });

  // remove file for gspan after finishing
  unlinkSync(sanitizedId + "gspanIn.txt");

  if (pyProg.error) {
    console.log("python error: ", pyProg.error);
    return "Error Executing Tree mining";
  }

  if (pyProg.stderr.toString()) {
    console.log("stderr: ", pyProg.stderr.toString());
    return "stderror executing tree mining";
  }

  const allGraphs = pyProg.stdout.toString().match(/^(t|v|e).+$/gm);
  const where = Array.from(pyProg.stdout.toString().matchAll(/^where: \[(.+)\]$/gm), (x) => x[1].split(", "));
  const support = pyProg.stdout
    .toString()
    .match(/^Support.+$/gm)
    .map((x) => x.split(" ")[1]);
  const allOrigins = pyProg.stdout.toString().match(/^(((s:|o:).+)|-----------------)$/gm);
  allOrigins.pop(); // remove last dashes to make later analyzing easier

  // separate allGraphs into separate arrays of graphs. Different index in array for different graph
  const graphs = [];
  for (let line of allGraphs) {
    if (line.startsWith("v") || line.startsWith("e")) {
      graphs.at(-1).push(line);
    } else if (line.startsWith("t")) {
      if (!line.startsWith("t # -1")) {
        graphs.push([]);
        graphs.at(-1).push(line);
      } else {
        break;
      }
    }
  }

  // separate allOrigins into separate arrays. Each index holds all the origins of that subdirectory
  const origins = [[]];
  let oldSub;
  for (let line of allOrigins) {
    if (line.startsWith("o:")) {
      origins.at(-1).at(-1).at(-1).push(line.split(":")[1].split(" "));
    } else if (line.startsWith("s:")) {
      // new index for every new subdirectory in a graph. make new one for each subdirectory
      if (line.split(":")[1] !== oldSub) {
        origins.at(-1).push([]);
      }
      // new index for every group of every subdirectory of every graph. It's basically a new index for every origin of a frequent tree
      origins.at(-1).at(-1).push([]);
      oldSub = line.split(":")[1];
    } else if (line.startsWith("-----------------")) {
      // new index in the array for each graph
      origins.push([]);
      oldSub = null;
    } else {
      console.log("Unexptected condition. Check it");
    }
  }

  return { graphs, support, where, origins };
};

// ----

const convertToGspanFormatAndModifyDom = (domFromAllSubdirs, sanitizedId, maxAllres, url) => {
  let gspanFormat = [];
  let vertexCounter;
  let i;

  // const getChildren = (node) => node.childNodes;
  const getChildren = (node) => {
    // TODO change if i also search for titles as well as texts
    if (!node.text) {
      return [];
    }
    return node.childNodes;
  };

  const visit = (node) => {
    //
    // if text node is empty then remove it and not show it in gspan format array
    if (node.nodeType !== 1) {
      const hasText = /\S/g.test(node.text);
      if (!hasText) {
        node.parentNode.removeChild(node);
        return;
      }
    }

    let label = node.nodeType === 1 ? node.getAttribute("customId") || "-1" : "-1";
    const kmeansClusterLabel = label === "-1" ? undefined : maxAllres.idxs[label.split(";")[1]];

    // add vertices to gspanFormat array
    gspanFormat[i].push(`v ${vertexCounter} ${kmeansClusterLabel !== undefined ? kmeansClusterLabel : "-1"}`);

    // add a vertex counter so I know that I have iterate it and added it to the gspanFormat array. Check nodeType because textNodes (type=3) don't have attributes
    if (node.nodeType !== 3) {
      node.setAttribute("vertexCounter", vertexCounter);
    }

    // add edges to gspanFormat array
    if (node.tagName !== "BODY") {
      gspanFormat[i].push(`e ${node.parentNode.getAttribute("vertexCounter")} ${vertexCounter} -1`);
    }

    vertexCounter++;
  };

  // loop for every subdir
  for (i = 0; i < domFromAllSubdirs.length; i++) {
    vertexCounter = 0;
    gspanFormat.push([]);
    gspanFormat[i].push("t # " + i);
    const body = domFromAllSubdirs[i].getElementsByTagName("body")[0];

    // when html code is bad it may lead to non body tag. Deprecated check. It now does this check at the scraping stage.
    if (body) {
      breadth({ tree: body, visit, getChildren });
    } else {
      console.log("Unexpected condition");
    }

    // modify dom to make relative css and images, absolute
    cssAndImgToAbsoluteHref(domFromAllSubdirs[i], url);
    gspanFormat[i] = trimTree(gspanFormat[i]);
  }

  gspanFormat[i - 1].push("t # -1");
  writeFileSync(sanitizedId + "gspanIn.txt", gspanFormat.flat(10).join("\n"));
  return gspanFormat;
};

const trimTree = (tree) => {
  // copy tree title that is in the first line
  const newtree = [tree[0]];

  const edges = tree.filter((x) => /e \d+ \d+ -1/.test(x));
  // the index of edgesLabel is the number of the first vertex(the parent) and the value are the children
  const edgesLabeled = [];
  edges.forEach((edge) => {
    const splitted = edge.split(" ");
    if (!edgesLabeled[splitted[1]]) {
      edgesLabeled[splitted[1]] = [splitted[2]];
    } else {
      edgesLabeled[splitted[1]].push(splitted[2]);
    }
  });

  const vertices = tree.filter((x) => /v \d+ -?\d+/.test(x));
  // the index of verticesLabel is the number of the vertex and the value is its label
  const verticesLabeled = [];
  vertices.forEach((vertex) => {
    const splitted = vertex.split(" ");
    verticesLabeled[splitted[1]] = splitted[2];
  });

  // trimming
  for (let i = 1; i < verticesLabeled.length; i++) {
    // if parent is unlabeled(-1)
    if (verticesLabeled[i] === "-1") {
      // if all children are unlabeled then remove this connection
      if (edgesLabeled[i] && edgesLabeled[i].every((x) => verticesLabeled[x] === "-1")) {
        // find parent index
        const parentIndex = edgesLabeled.findIndex((x) => x && x.includes(i.toString()));
        edgesLabeled[parentIndex].push(edgesLabeled[i]);
        // push children of current to parent
        edgesLabeled[parentIndex] = edgesLabeled[parentIndex].flat(10);
        // remove current from parent and the edge and vertice arrays
        edgesLabeled[parentIndex].splice(edgesLabeled[parentIndex].indexOf(i.toString()), 1);
        edgesLabeled[i] = null;
        verticesLabeled[i] = null;
      } else if (!edgesLabeled[i]) {
        // when there are no children and label==-1 from first if
        verticesLabeled[i] = null;
        const parentIndex = edgesLabeled.findIndex((x) => x && x.includes(i.toString()));
        edgesLabeled[parentIndex].splice(edgesLabeled[parentIndex].indexOf(i.toString()), 1);
      }
    }
  }

  // // trim the first node (body) seperately to remove the second level unlabeled nodes
  // if (
  //   verticesLabeled[0] === "-1" &&
  //   edgesLabeled[0] &&
  //   edgesLabeled[0].every((x) => verticesLabeled[x] === "-1")
  // ) {
  //   let grandChildren = [];
  //   for (const childIndex of edgesLabeled[0]) {
  //     if (edgesLabeled[childIndex]) {
  //       grandChildren.push(edgesLabeled[childIndex]);
  //       edgesLabeled[childIndex] = null;
  //     }
  //     verticesLabeled[childIndex] = null;
  //   }
  //   grandChildren = grandChildren.flat(10);
  //   edgesLabeled[0] = grandChildren;
  // }

  // convert to python gspan format
  for (let i = 0; i < verticesLabeled.length; i++) {
    if (verticesLabeled[i] !== null) {
      newtree.push(`v ${i} ${verticesLabeled[i]}`);
    }
  }

  for (let i = 0; i < edgesLabeled.length; i++) {
    if (edgesLabeled[i] !== null && edgesLabeled[i] !== undefined) {
      for (let j = 0; j < edgesLabeled[i].length; j++) {
        newtree.push(`e ${i} ${edgesLabeled[i][j]} -1`);
      }
    }
  }

  return newtree;
  //
};

//
// -----
//

// cos similarity between all nodes using their terms bows
const getKmeansNodexNode = (nodesDirArr) => {
  //
  console.log("first");
  const allNodesFromAllSubds = nodesDirArr.flat(10); // allNodesFromAllSubds: all nodes from all subds in one array
  // let allNodesFromAllSubds = [];
  // nodesDirArr.forEach((subd) => {
  //   subd.forEach((node) => {
  //     allNodesFromAllSubds.push(node);
  //   });
  // });

  console.log("second with length " + allNodesFromAllSubds.length);
  //
  // better efficiency to calculate bows once. Maybe create it in the beginning instead of allNodesFromAllSubds
  // let allNodesFromAllSubdsTermsBow = [];
  // for (let i = 0; i < allNodesFromAllSubds.length; i++) {
  //   allNodesFromAllSubdsTermsBow.push(as.bow(allNodesFromAllSubds[i].terms));
  // }
  // console.log("in getKmeansNodexNode second with", allNodesFromAllSubds.length, "nodes");
  //

  let nodexnode = [];
  for (let i = 0; i < allNodesFromAllSubds.length; i++) {
    nodexnode.push([]);
    console.log("In " + i);
    for (let k = 0; k < i; k++) {
      nodexnode[i].push(nodexnode[k][i]);
    }

    for (let j = i; j < allNodesFromAllSubds.length; j++) {
      nodexnode[i].push(
        similarity.bow.cosine(as.bow(allNodesFromAllSubds[i].terms), as.bow(allNodesFromAllSubds[j].terms))
      );
    }
  }
  console.log("third");
  // ----
  let max = -2;
  let noOfClusters = -2; // number of clusters with max silhouette
  let maxAllres;
  let upperLimit =
    nodexnode[0].length > 6
      ? nodexnode[0].length / 3 > 20
        ? 20
        : nodexnode[0].length / 3
      : nodexnode[0].length; // TODO find better upper limit

  for (let c = 2; c < upperLimit; c++) {
    for (let i = 0; i < 40; i++) {
      console.log("in kmeans at c= " + c + " and repeat at i= " + i);
      // for 10 iterations use the kmpp initialization algorithm
      let res = skmeans(nodexnode, c, i < 10 ? "kmpp" : null, null, costumDistanceFormula);
      // console.log(res);
      let coef = silhouetteCoefficient(nodexnode, res.idxs, costumDistanceFormula);
      // console.log("place", i, "number", coef);
      if (isNaN(coef)) {
        // console.log("NaN", i);
        continue;
      }
      if (coef > max) {
        // console.log("place", i, "number", coef);
        max = coef;
        maxAllres = res;
        noOfClusters = c;
      }
    }
    // console.log("c", c, "inmax", inmax);//-----------
    // console.log(max);
  } // end of choosing number of clusters
  // console.log("noofcluster", noOfClusters, "max", max);//------------
  // console.log("res", maxAllres, "max", max, "clusters", noOfClusters);
  // console.log("max", max, "clusters", noOfClusters);

  // ------
  console.log("before clusteredNodes and clustered Bow");
  let clusteredNodes = [];
  for (let i = 0; i < noOfClusters; i++) {
    clusteredNodes.push([]);
  }
  for (let i = 0; i < maxAllres.idxs.length; i++) {
    clusteredNodes[maxAllres.idxs[i]].push(allNodesFromAllSubds[i].terms);
    clusteredNodes[maxAllres.idxs[i]] = clusteredNodes[maxAllres.idxs[i]].flat(10);
  }

  let clusteredBow = [];
  for (let i = 0; i < noOfClusters; i++) {
    clusteredBow[i] = Object.fromEntries(
      Object.entries(as.bow(clusteredNodes[i])).sort((a, b) => {
        return b[1] - a[1];
      })
    );
  }

  return { maxAllres, clusteredBow };
};

const costumDistanceFormula = (a, b) => {
  let aIndex = a.indexOf(1);
  let bIndex = b.indexOf(1);
  let index;
  // if (bIndex !== -1) {
  //   console.log("BOTH");
  //   console.log("a", a, "aIndex", aIndex);
  //   console.log("b", b, "bIndex", bIndex);
  // }
  index = aIndex !== -1 ? aIndex : bIndex;
  if (aIndex !== -1 && bIndex !== -1) {
    // console.log("out", -(a[bIndex] - 1));
    return -(a[bIndex] - 1); // I substract 1 and use minus in order to change the bias for the kmeans which has zero as best similarity, whereas cosineSimilarity has one for best similarity
  } else {
    // console.log("Inere");
    // console.log("a", a, "aIndex", aIndex);
    // console.log("b", b, "bIndex", bIndex);
    // console.log("out", aIndex !== -1 ? -(b[index] - 1) : -(a[index] - 1));
    return aIndex !== -1 ? -(b[index] - 1) : -(a[index] - 1);
    // return -((a[bIndex] + b[aIndex]) / 2 - 1);
  }
};

// ---

const getCosineSimilarityPerSubd = (nodesDirArr) => {
  let cosineSimilarityPerSubd = [];

  // allNodeTermsPerSubd: each index is a subdirectory which has all the terms of all the nodes of that subdirectory and the terms are flattened and not in groups of their node
  // nodeTermsPerSubd: each index is a subdirectory which has the terms of all the nodes of that subdirectory and the terms are in grouped based on their node
  let allNodeTermsPerSubd = [];
  let nodeTermsPerSubd = [];
  nodesDirArr.forEach((subd) => {
    const TermsInSubd = subd.map((node) => node.terms);
    allNodeTermsPerSubd.push(TermsInSubd.flat(10));
    nodeTermsPerSubd.push(TermsInSubd);
  });

  const allNodeTermsPerSubdBow = allNodeTermsPerSubd.map((subd) => as.bow(subd));
  const nodeTermsPerSubdBow = nodeTermsPerSubd.map((subd) => {
    return subd.map((nodeTerms) => as.bow(nodeTerms));
  });

  for (let i = 0; i < allNodeTermsPerSubdBow.length; i++) {
    let subdCosineSimilarity = [];
    for (let k = 0; k < nodeTermsPerSubdBow.length; k++) {
      for (let j = 0; j < nodeTermsPerSubdBow[k].length; j++) {
        subdCosineSimilarity.push(
          similarity.bow.cosine(nodeTermsPerSubdBow[k][j], allNodeTermsPerSubdBow[i])
        );
      }
    }
    cosineSimilarityPerSubd.push(subdCosineSimilarity);
  }

  return cosineSimilarityPerSubd;
};

// ----

// subdIndex: index of the subdirectory I am analyzing
const extractTerms = async (dom, subdIndex, countId) => {
  // const dom = parse(html);
  const nodeList = dom.querySelectorAll("h1,h2,h3,p,button,a");
  // TODO get titles and not only textContent

  let id = 0;
  let dirNode = [];
  // const domBody = dom.getElementsByTagName("body")[0];

  // for (let node of domBody.childNodes) {}
  for (const node of nodeList) {
    let nodeTerms = [];

    // tokenize the textContent of each node and remove punctuations and stopwords
    const tokens = nlp
      .readDoc(node.text)
      .tokens()
      .filter((t) => t.out(its.type) !== "punctuation" && !t.out(its.stopWordFlag));

    for (let i = 0; i < tokens.length(); i++) {
      let result = await wordpos.lookup(tokens.itemAt(i).out(its.normal));
      let synonyms = result.map((item) => item.synonyms); // TODO maybe get the pos synonyms only and not for all adj,verb,noun,etc?

      // if the word is not found then try the lemma version
      if (synonyms.length === 0) {
        result = await wordpos.lookup(tokens.itemAt(i).out(its.lemma));
        synonyms = result.map((item) => item.synonyms); // TODO maybe get the pos synonyms only and not for all adj,verb,noun,etc?
      }

      // reducing all synonym groups if it's adj, verb, noun, etc
      synonyms = synonyms.flat(10);
      // by using new Set(synonyms) I remove the duplicate synonyms of a single word of a text of a node. The node might have duplicate Terms if two words have the same synonym but a single word can't have the same word as a synonym
      // the reason a single word can have duplicate words as a synonym is because a word can be a verb, noun, adjective and might have the same synonym in those forms
      nodeTerms = [...nodeTerms, ...new Set(synonyms)];
    }

    nodeTerms = nodeTerms.flat(10);

    // TODO it is better to remove the nodes that don't have text instead of the nodes that have text but don't have synonyms like I do here. and maybe use the text as the terms
    // TODO Should I add the tokenized text in the Terms. But make sure to remove the stopwords
    // save only if there are terms
    if (nodeTerms.length !== 0) {
      dirNode.push({
        node: node.tagName,
        id: subdIndex + ":" + id + ";" + countId,
        text: node.textContent,
        terms: nodeTerms,
      }); // -------------------------change what to save from the node

      node.setAttribute("customId", subdIndex + ":" + id + ";" + countId);

      id = id + 1;
      countId = countId + 1;
    }

    //
  }
  return dirNode;

  //
};

// modify dom to make relative css and images, absolute
const cssAndImgToAbsoluteHref = (dom, url) => {
  const css = dom.getElementsByTagName("link"); // TODOTODO check if it works correctly for all relative and absolute hrefs.
  css.forEach((node) => {
    const href = node.getAttribute("href");
    if (href) {
      // && href.startsWith("/")) {
      node.setAttribute("href", new URL(href, url).href);
    }
  });
  const img = dom.getElementsByTagName("img"); // TODOTODO check if it works correctly for all relative and absolute srcs.
  img.forEach((node) => {
    const src = node.getAttribute("src");
    if (src) {
      // && src.startsWith("/")) {
      node.setAttribute("src", new URL(src, url).href);
    }
  });
  //
};

const stylizedDomElementsByClusterLabel = (domFromAllSubdirs, maxAllres) => {
  const palette = distinctColors({ count: maxAllres.k });

  for (let dom of domFromAllSubdirs) {
    const nodes = dom.querySelectorAll("[customId]");
    for (let node of nodes) {
      const kmeansClusterLabel = maxAllres.idxs[node.getAttribute("customId").split(";")[1]];
      node.setAttribute(
        "style",
        `border-style: solid;border-color: ${palette[kmeansClusterLabel].hex()};border-width: thick;`
      );
    }
  }

  // let label = node.nodeType === 1 ? node.getAttribute("customId") || "-1" : "-1";
  // const kmeansClusterLabel = label === "-1" ? undefined : maxAllres.idxs[label.split(";")[1]];
  // // modify dom to display colored border depending on its cluster
  // if (label !== "-1") {
  //   node.setAttribute(
  //     "style",
  //     `border-style: solid;border-color: ${palette[kmeansClusterLabel].hex()};border-width: thick;`
  //   );
  // }
};

// ====================================================================

// const { parentPort } = require("worker_threads");

// // function cpuIntensiveTask(responseTime) {
// //   console.log("cpuIntensiveTask started......");
// //   let startTime = Date.now();
// //   while (Date.now() - startTime < responseTime) {
// //     const kk = 0;
// //   }
// //   console.log("cpuIntensiveTask completed in :" + (Date.now() - startTime) + " ms.");
// //   return Date.now() - startTime;
// // }
// // parentPort.on("message", (message) => {
// //   console.log(message);
// //   if (message.command == "SLEEP") {
// //     setTimeout(() => {
// //       console.log(
// //         "\nTest Child Event-Loop :cpuIntensiveTask in child thread blocks this event in child thread!"
// //       );
// //     }, 1000);
// //     console.log("first");
// //     const result = cpuIntensiveTask(message.responseTime);
// //     console.log("second");
// //     parentPort.postMessage("Completeed in :" + result + " ms.");
// //     console.log("end");
// //     process.exit();
// //   }
// // });

// // -------------------

// function outfun() {
//   let k = 0;
//   console.log("starting cpu-heavy");
//   for (let i = 0; i < 50; i++) {
//     for (let j = 0; j < 99999999; j++) {
//       k++;
//     }
//   }
//   console.log("ended cpu-heavy");
//   return k;
// }

// parentPort.on("message", (message) => {
//   console.log("in worker", message);
//   if (message.command == "SLEEP") {
//     setTimeout(() => {
//       console.log(
//         "\nTest Child Event-Loop :cpuIntensiveTask in child thread blocks this event in child thread!"
//       );
//     }, 20000);
//     console.log("first");
//     const result = outfun();
//     console.log("second");
//     parentPort.postMessage("in worker found :" + result);
//     console.log("end");
//     setTimeout(() => process.exit(), 500);
//     // process.exit();
//   }
// });
