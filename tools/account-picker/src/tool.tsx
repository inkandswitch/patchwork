export const plugins = [
  {
    type: "patchwork:tool",
    id: "account-picker",
    name: "Account Picker",
    supportedDatatypes: ["account"],
    importPath: "./dist/mount.js",
  },
];
