const DB_Model_Sites = require("../db/Model_Site");
const axios = require("axios");
const { parse } = require("node-html-parser");
// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;

const getAllSites = async (req, res) => {
  try {
    const sites = await DB_Model_Sites.find({});
    res.status(200).json({ sites });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getAllSitesUrls = async (req, res) => {
  try {
    const sites = await DB_Model_Sites.find({}, "_id url");
    res.status(200).json({ sites });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createSite = async (req, res) => {
  try {
    // fetch and parse
    const html = await axios.get(req.body.url);
    // console.log(html.status);
    // console.log(html.data);
    const dom = parse(html.data);
    const [subdirsName, subDirs] = await crawler(dom, req.body.url);
    subDirs.unshift(html.data);

    const site = await DB_Model_Sites.create({
      url: req.body.url,
      html: subDirs,
      subdirsname: subdirsName,
    });
    res.status(201).json({ site });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const crawler = async (dom, url) => {
  const subdirs = dom.querySelectorAll("a");
  let subdirHTMLArr = [];
  let subdirsName = ["/"];
  for (let node of subdirs) {
    try {
      // makes the relative paths, absolute
      const subdirname = node.getAttribute("href").startsWith("/")
        ? node.getAttribute("href").endsWith("/")
          ? url + node.getAttribute("href").slice(1)
          : url + node.getAttribute("href")
        : node.getAttribute("href");
      let html = await axios.get(subdirname);

      // let html = await axios.get(node.getAttribute("href"));
      subdirHTMLArr.push(html.data);
      subdirsName.push(subdirname);
      // keep only the relative path
      // subdirsName.push(
      //   url.endsWith("/") ? subdirname.slice(url.length - 1) : subdirname.slice(url.length)
      // );
    } catch (error) {
      if (
        error.message != "Cannot read property 'replace' of null" ||
        !(error instanceof TypeError)
      ) {
        // console.log("Print error that is not just invalid URL");
        // TODO to check more
        throw error;
      }
    }
  }

  return [subdirsName, subdirHTMLArr];
};

const getSite = async (req, res) => {
  try {
    const site = await DB_Model_Sites.findOne({ _id: req.params.id });
    if (!site) {
      return res.status(404).json({ msg: `No site with id: ${req.params.id}` });
    }
    res.status(200).json({ site });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const updateSite = async (req, res) => {
  try {
    const site = await DB_Model_Sites.findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!site) {
      return res.status(404).json({ msg: `No site with id: ${req.params.id}` });
    }
    res.status(200).json({ site });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const deleteSite = async (req, res) => {
  try {
    const site = await DB_Model_Sites.findOneAndDelete({ _id: req.params.id });
    if (!site) {
      return res.status(404).json({ msg: `No site with id: ${req.params.id}` });
    }
    res.status(200).json({ site });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  getAllSites,
  getAllSitesUrls,
  createSite,
  getSite,
  updateSite,
  deleteSite,
};
