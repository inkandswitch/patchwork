export default {
  init(doc) {
    doc.title = "Terminal";
    doc.shell = null;
    doc.cwd = null;
    doc.scrollback = [];
  },
  getTitle(doc) {
    return doc.title || "Terminal";
  },
  setTitle(doc, title) {
    doc.title = title;
  },
  markCopy(doc) {
    doc.title = "Copy of " + (doc.title || "Terminal");
  },
};
