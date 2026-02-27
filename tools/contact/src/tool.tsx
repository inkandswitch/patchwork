export const plugins = [
  {
    type: "patchwork:datatype",
    id: "contact",
    name: "Contact",
    icon: "User",
    importPath: "./mount-datatype.js",
  },
  {
    type: "patchwork:tool",
    id: "contact",
    name: "Contact Viewer",
    supportedDatatypes: ["contact"],
    importPath: "./mount-contact.js",
  },
  {
    type: "patchwork:tool",
    id: "contact-avatar",
    name: "Contact Avatar",
    supportedDatatypes: ["contact"],
    importPath: "./mount-avatar.js",
  },
  {
    type: "patchwork:tool",
    id: "contact-inline",
    name: "Inline Contact Avatar",
    supportedDatatypes: ["contact"],
    importPath: "./mount-inline.js",
  },
];
