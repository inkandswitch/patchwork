import { type DataTypeImplementation } from "@patchwork/plugins";
import { type AutomergeUrl } from "@automerge/automerge-repo";

// SCHEMA

export interface AnonymousContactDoc {
  type: "anonymous";
  color?: string; // HSL color string for user presence indicators
}

export interface RegisteredContactDoc {
  type: "registered";
  name: string;
  avatarUrl?: AutomergeUrl;
  color?: string; // HSL color string for user presence indicators
}

export type ContactDoc = AnonymousContactDoc | RegisteredContactDoc;

// FUNCTIONS

export const init = (doc: ContactDoc) => {
  Object.assign(doc, {
    type: "anonymous",
  } as ContactDoc);
};

const getTitle = (doc: ContactDoc) => {
  if (doc.type === "registered") {
    return doc.name;
  }
  return "Anonymous";
};

const setTitle = (doc: ContactDoc, title: string) => {
  if (doc.type === "registered") {
    doc.name = title;
  }
};

export const ContactDataType: DataTypeImplementation<ContactDoc> = {
  init,
  getTitle,
  setTitle,
};
