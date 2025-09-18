export * from "./plugins";
// TODO: deprecate these
export * from "./datatypes";
export * from "./plugins/tools";
export * from "./datatypes/importMethods";
export * from "./datatypes/exportMethods";
export { default as start } from "./start";

export {
  Account,
  type AccountDoc,
  type ContactDoc,
  type RegisteredContactDoc,
  getAccount,
  automergeUrlToAccountToken,
  accountTokenToAutomergeUrl,
} from "./account";
export * from "./modules";
