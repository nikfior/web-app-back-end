const loginSuccess = async (req, res) => {
  res.status(200).json({ msg: "Success" });
};

const logoutUser = (req, res) => {
  res.clearCookie("jwttoken");
  res.redirect("/");
};

// const its = require("wink-nlp/src/its.js");
// const model = require("wink-eng-lite-model");
// const { parse } = require("node-html-parser");
const home = async (req, res) => {
  // const puppeteer = require("puppeteer");
  // const browser = await puppeteer.launch({ headless: false });
  // // const page = await browser.newPage();
  // // const page = (await browser.pages())[0];
  // const page = (await browser.pages())[0] || (await browser.newPage());
  // await page.goto("http://demo.microfrontends.com/", { waitUntil: "networkidle0" });
  // await page.setViewport({ width: 1080, height: 1024 });
  // // console.log(await page.content());
  // console.log(page.url());
  // // const element = await page.waitForSelector("h2.sc-gZMcBi");
  // // console.log(await element.evaluate((x) => x.textContent));
  // // page.evaluate((_) => {
  // //   window.scrollBy(0, window.innerHeight);
  // // });
  // // const element = (await page.$$("a"))[1];
  // // let options = { button: "middle" };
  // // // const te = await page.click("a[href='/random']", options);

  // // await element.click(options);
  // // await element.click(options);
  // // const [target] = await Promise.all([
  // //   new Promise((resolve) => browser.once("targetcreated", resolve)),
  // //   element.click(options),
  // // ]);

  // // const newsPage = await target.page();
  // // // await page.keyboard.down("Control");
  // // // await element.click();
  // // // await page.keyboard.up("Control");
  // // // await element.click(options);
  // // console.log(await element.evaluate((x) => x.textContent));
  // // const tabs = await browser.pages();
  // // console.log(await tabs[2].content());

  // // console.log(await page.target());
  // await browser.close();

  // const visit = (x) => {
  //   console.log(x.tag);
  //   return x;
  // };
  // const filter = (x) => {
  //   console.log("filter " + x.tag);
  //   // if (x.tag === 11) {
  //   //   return false;
  //   // }
  //   return true;
  // };
  // const leave = (x, c) => {
  //   console.log("leave " + x.tag);
  // };

  // const { depth, breadth } = require("treeverse");
  // const tree = {
  //   tag: 0,
  //   child: [
  //     { tag: 11, child: [{ tag: 21, child: [{ tag: 31, child: [] }] }] },
  //     { tag: 12, child: [] },
  //     { tag: 13, child: [] },
  //   ],
  // };
  // depth({ tree, visit, getChildren, leave });
  // ---------------test-----------
  // const test = `<!DOCTYPE html><html>
  // <head></head>
  // <body>
  // <div>
  // <a href="example.org" customId="5:6;7"></a>
  // <a href="example.org" customId="5:6;8"></a>
  // </div>
  // </body>
  // </html>`;
  // const { parse } = require("node-html-parser");
  // const output = parse(test).getElementsByTagName("body");
  // console.log(output);
  // const sanitizeHtml = require("sanitize-html");
  // const out = sanitizeHtml(test, { allowedTags: false, allowedAttributes: false });
  // console.log(out);
  // --------------------------
  // const output = parse(test).querySelectorAll("[vertex]");
  // const output = parse(test);
  // console.log("sd");
  // if (!output.text) {
  //   console.log("S");
  // }
  // console.log("out");
  // -----------
  // const distinctColors = require("distinct-colors").default;

  // const palette = distinctColors({ count: 16 });
  // console.log(palette);
  // console.log(process.env);
  // ----------------------
  // const DB_Model_Sites = require("../db/Model_Site");
  // const site = await DB_Model_Sites.findById("6204a5a355c85e13e2f0943f");
  // // const test = `<p><a href="https://www.iana.org/domains/example">More information...</a></p>`;
  // // // const parse = require("html-dom-parser");
  // const { parse } = require("node-html-parser");
  // // const output = parse(site).getElementsByTagName("body")[0];
  // const tt = parse(site.html);
  // console.log("first", tt.getElementsByTagName("h1")[0].textContent);
  // tt.getElementsByTagName("h1")[0].textContent = "NEEWWWW";
  // tt.getElementsByTagName("h1")[0].setAttribute(
  //   "style",
  //   "border-style: solid;border-color: #FFAAFF;border-width: thick;"
  // );
  // console.log("second", tt.getElementsByTagName("h1")[0].textContent);
  // // const te = tt.structure;
  // // console.log(tt.toString());
  // return res.send(tt.toString());

  //-----
  // const { depth, breadth } = require("treeverse");

  // const getChildren = (node) => node.childNodes;
  // const getLabel = (node) => node.tagName;
  // const visit = (node) => {
  //   console.log(node.tagName); //, ":", node.text, "end");
  // };
  // breadth({ tree: output, visit, getChildren });

  // let iterator = new RecursiveIterator(output);
  // output.getElementsByTagName("h1")[0].setAttribute("cid", "somethingnew");
  // console.log(output.getElementsByTagName("p")[0].childNodes.length === 0);
  // console.log(output);

  // res.json({ output });
  // console.log(parse(test).childNodes[0].childNodes);
  // --------------
  // const jsonToDot = require("json-to-dot");

  // const out = jsonToDot({
  //   foo: ["bar", "buzz"],
  //   bar: ["foo"],
  //   norf: ["worble", "buzz"],
  //   worf: ["worble"],
  //   fizz: ["buzz"],
  // });
  // // console.log(out);
  // var fromDot = require("ngraph.fromdot");
  // var twoEdgesGraph = fromDot("digraph G { a -> b }");
  // console.log(twoEdgesGraph.fire());
  // console.log(twoEdgesGraph.getNodesCount());
  // console.log(twoEdgesGraph.on());
  // console.log(twoEdgesGraph.off());
  // --------------
  // const { Worker } = require("worker_threads");
  // function callWorkerThread() {
  //   const worker = new Worker("./controllers/workers/worker_termAnalysis.js");
  //   // Set worker thread event handlers
  //   worker.on("message", (result) => {
  //     console.log(`Outcome in Parent Thread : ${result}`);

  //   });

  //   worker.on("exit", (code) => {
  //     console.log(`worker exited with code ${code}`);
  //   });
  //   // Post message to the worker thread.
  //   worker.postMessage({ command: "SLEEP" });
  // }
  // callWorkerThread();
  // setTimeout(() => {
  //   console.log(
  //     "\nTest Parent Event-Loop :cpuIntensiveTask in child thread does not block this event in parent thread!"
  //   );
  // }, 1000);

  // ---------------------

  // console.log(req.query);
  // const a = `<a class="top-level" href="/en/products" onclick="ga('send', 'event', 'Mega Menu', 'Products', 'Products');">Products</a>`;
  // const dom = parse(a);
  // var natural = require("natural");
  // var TfIdf = natural.TfIdf;
  // var tfidf = new TfIdf();
  // const sub = dom.querySelector("a");
  // console.log(sub.toString());
  // -----
  // const similarity = require("wink-nlp/utilities/similarity.js");
  // const model = require("wink-eng-lite-model");
  // const its = require("wink-nlp/src/its.js");
  // const as = require("wink-nlp/src/as.js");
  // const temp = as.bow(["Johann", "tree", "Sebastian", "Bach", "symphony", "Bach", "tree"]);
  // console.log(temp);
  // const nlp = require("wink-nlp")(model);
  // const BM25Vectorizer = require("wink-nlp/utilities/bm25-vectorizer");
  // const bm25 = BM25Vectorizer();
  // const text = "Hello are World🌎! How are bach you symphony?";
  // const text = "Johann Sebastian symphony tree Running being it an";
  // const text = "This being fawgsgaa merrrasfawe(44) is. of running extraterrestrial origin trees";
  // const text = "IANA-managed Reserved Domains";
  // const corpus = ["Bach", "J Bach", "Johann S Bach", "Johann Sebastian Bach symphony"];
  // tfidf.addDocument("Bach");
  // tfidf.addDocument("J Bach");
  // tfidf.addDocument("Johann S Bach");
  // tfidf.addDocument("Johann Sebastian Bach symphony");
  // const text1 = "Johann Sebastian Bach symphony bach";
  // const textar = ["Johann", "Sebastian", "Bach", "symphony", "Bach"];
  // const as = require("wink-nlp/src/as.js");
  // console.log(as.bow(textar).Bach);
  // const doc = nlp.readDoc(text);
  // const doc1 = nlp.readDoc(text1);
  // const t = ["this", "is", "an", "example"];
  // const doc2 = nlp.readDoc(text2.join(" "));
  // console.log(doc.tokens().out(its.type, as.freqTable));
  // console.log(its.normal(textar));
  // console.log("empty", doc.tokens().out());
  // console.log("as.freqtable", doc.tokens().out(its.type, as.freqTable));
  // console.log(doc.tokens().out());
  // const tokens = doc
  //   .tokens()
  //   .filter((t) => t.out(its.type) !== "punctuation" && !t.out(its.stopWordFlag));
  // console.log(tokens.itemAt(3).out(its.lemma));
  // console.log(tokens.out());
  // console.log(tokens.out(its.normal));
  // console.log(tokens.out(its.lemma));
  // console.log(
  //   doc
  //     .tokens()
  //     .filter((t) => t.out(its.type) !== "punctuation" && !t.out(its.stopWordFlag))
  //     .out()
  // );
  // console.log(doc.entities().out());
  // console.log(doc.tokens().out(its.lemma));
  // console.log(doc.tokens().out(its.type));
  // console.log(doc.tokens().out(its.stopWordFlag));
  // console.log(doc.tokens().itemAt(2).out(its.stopWordFlag));
  // ---------------
  // const { parse } = require("node-html-parser");
  // const dom = parse(
  //   `<a title="this is title" rel="nofollow" class="icon" aria-label="Σύνδεση" href="/sign_in">Σύνδεση</a>`
  // );
  // const nodeList = dom.querySelectorAll("h1,h2,h3,p,button,a");
  // console.log(nodeList.length);
  // console.log(nodeList[0].getAttribute("title"));
  // ------
  // console.log(doc1.tokens().out(its.normal, as.bow));
  // const bow1 = doc.tokens().out(its.normal, as.bow);
  // const bow2 = doc.tokens().out(its.normal, as.bow);
  // console.log(similarity.bow.cosine(bow1, bow2));
  // console.log(similarity.bow.cosine({}, { tree: 1 }));
  // const as = require("wink-nlp/src/as.js");
  // const nlputils = require("wink-nlp-utils");
  // const start = Date.now();
  // for (let i = 0; i < 10000; i++) {
  //   for (let j = 0; j < 20000; j++) {
  //     const temp = as.bow(["Johann", "tree", "Sebastian", "Bach", "symphony", "Bach", "tree"]);
  //   }
  // }
  // console.log("execution time", Date.now() - start);
  // -------
  // var WordPOS = require("wordpos");
  // var wordpos = new WordPOS();
  // let result = await wordpos.lookup("run");
  // // console.log(result);
  // let synonyms = result.map((item) => item.synonyms);
  // console.log(synonyms);
  // --------
  // console.log(nlp.readDoc("protocols protocol").tokens().out(its.lemma, as.bow));
  // console.log(nlp.readDoc("running").tokens().out(its.lemma));
  // console.log(nlputils.tokens.removeWords(["tree", "forst", "forest", "tree", "haha", "you"]));
  // console.log(similarity.bow.cosine({ tree: 1 }, { tree: 1, forest: 0 }));
  // console.log(similarity.bow.cosine({ tree: 1, forest: 2 }, { forest: 1 }));

  // const tok = doc.tokens().out();
  // corpus.forEach((doc) => bm25.learn(nlp.readDoc(doc).tokens().out(its.normal)));
  // console.log(bm25.vectorOf(nlp.readDoc("Johann S").tokens().out(its.normal)));
  // console.log(bm25.out());
  // console.log(nlp.readDoc("Johann Bach symphony").tokens().out(its.normal));
  // console.log(bm25.out(its.terms));
  // console.log(bm25.vectorOf(["j", "bach"]));
  // console.log(bm25.vectorOf(["johann"]));
  // console.log(bm25.vectorOf(["symphony"]));
  // console.log(bm25.out(its.modelJSON));
  // console.log("text", tok);
  // tfidf.tfidfs("bach symphony", function (i, measure) {
  //   console.log("document #" + i + " is " + measure);
  // });
  // console.log("text2", tok2);
  // console.log("bow", as.bow(tok));
  // console.log("freqtable", as.freqTable(tok));
  // console.log("type", its.value(tok));
  // res.json(JSON.parse(bm25.out(its.modelJSON)));

  // const DB_Model_Sites = require("../db/Model_Site");
  // const sites = await DB_Model_Sites.find({ _id: "62bb47e18040613b715c98f4" });
  // const q = 4;
  // try {
  //   const a = await DB_Model_Sites.findOneAndUpdate(
  //     { _id: "62bb47e18040613b715c98f4" },
  //     { html: sites[0].html },
  //     {
  //       new: true,
  //       runValidators: true,
  //     }
  //   );
  //   const q = 4;
  // } catch (error) {
  //   console.log(error.message);
  // }
  res.send("HomePage");
};

module.exports = {
  loginSuccess,
  logoutUser,
  home,
};
