export * from "./plugins";
// TODO: deprecate these
export * from "./datatypes.js";
export * from "./tools.js";
export * from "./importMethods";
export * from "./exportMethods";

export {
  Account,
  type AccountDoc,
  type ContactDoc,
  type RegisteredContactDoc,
  getAccount,
  automergeUrlToAccountToken,
  accountTokenToAutomergeUrl,
} from "./account.js";
export * from "./modules";
