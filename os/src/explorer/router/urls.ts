import { DocLink } from "@/packages/folder";
import {
  AutomergeUrl,
  DocumentId,
  isValidAutomergeUrl,
  stringifyAutomergeUrl,
} from "@automerge/automerge-repo";
import queryString from "query-string";
import { URLParams } from "./types";

// Construct a URL for a given document
export const toUrl = (docLinkOrUrlParams: DocLink | URLParams): string => {
  const documentId = docLinkOrUrlParams.url.split(":")[1];

  // We put a human readable name in the url to make it easier to see what a link is
  let humanReadableName = "";
  if ("name" in docLinkOrUrlParams) {
    humanReadableName += getUrlSafeName(docLinkOrUrlParams.name);
  }
  if ("branchUrl" in docLinkOrUrlParams && docLinkOrUrlParams.branchName) {
    humanReadableName += `-(${getUrlSafeName(docLinkOrUrlParams.branchName)})`;
  }

  const baseUrl =
    humanReadableName.length > 0
      ? `${humanReadableName}--${documentId}`
      : documentId;

  const searchParams = new URLSearchParams();
  searchParams.append("type", docLinkOrUrlParams.type);
  if ("branchUrl" in docLinkOrUrlParams && docLinkOrUrlParams.branchUrl) {
    searchParams.append("branchUrl", docLinkOrUrlParams.branchUrl);
  }
  if (
    "branchScopeUrl" in docLinkOrUrlParams &&
    docLinkOrUrlParams.branchScopeUrl
  ) {
    searchParams.append("branchScopeUrl", docLinkOrUrlParams.branchScopeUrl);
  }

  return `${baseUrl}?${searchParams.toString()}`;
};

// Turn names into a readable url safe string
// - replaces any sequence of alpha numeric characters with a single "-"
// - limits length to 100 characters
export const getUrlSafeName = (value: string) => {
  let urlSafeName = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .slice(0, 100);

  if (urlSafeName.endsWith("-")) {
    urlSafeName = urlSafeName.slice(0, -1);
  }

  if (urlSafeName.startsWith("-")) {
    urlSafeName = urlSafeName.slice(1);
  }

  return urlSafeName;
};

// Parse older URL formats and map them into our newer format
export const parseLegacyUrl = (url: URL): URLParams | null => {
  const possibleAutomergeUrl = url.pathname.slice(1);

  // First handle very old URLs that only had an Automerge URL:
  // /#automerge:12345

  if (isValidAutomergeUrl(possibleAutomergeUrl)) {
    return {
      url: possibleAutomergeUrl,
      type: "essay",
    };
  }

  // Now on to the main logic where we look for URLs of the form:
  // /#docUrl=automerge:12345&docType=essay&branchUrl
  const { docUrl, docType, branchUrl } =
    queryString.parse(possibleAutomergeUrl);

  if (typeof docUrl !== "string" || typeof docType !== "string") {
    return null;
  }

  if (typeof docUrl === "string" && !isValidAutomergeUrl(docUrl)) {
    alert(`Invalid Automerge URL in URL: ${docUrl}`);
    return null;
  }

  if (typeof branchUrl === "string" && !isValidAutomergeUrl(branchUrl)) {
    alert(`Invalid branch in URL: ${branchUrl}`);
    return null;
  }

  return {
    url: docUrl,
    type: docType,
    branchUrl: branchUrl as AutomergeUrl,
  };
};

export const parseUrl = (url: URL): URLParams | null => {
  const match = url.pathname.match(
    /^\/([a-z-A-Z0-9-]+(\([a-zA-Z0-9-]+\))?--)?(?<docId>\w+)$/
  );

  if (!match) {
    return null;
  }

  const { docId } = match.groups!;

  const docUrl = stringifyAutomergeUrl(docId as DocumentId);
  if (!isValidAutomergeUrl(docUrl)) {
    alert(`Invalid doc id in URL: ${docUrl}`);
    return null;
  }

  const datatypeId =
    url.searchParams.get("type") ?? url.searchParams.get("docType"); // use legacy docType as a fallback

  const branchUrl = url.searchParams.get("branchUrl");
  if (branchUrl && !isValidAutomergeUrl(branchUrl)) {
    alert(`Invalid branch in URL: ${branchUrl}`);
    return null;
  }

  const branchScopeUrl = url.searchParams.get("branchScopeUrl");
  if (!branchUrl && branchScopeUrl && !isValidAutomergeUrl(branchScopeUrl)) {
    alert(`Invalid branchScope in URL: ${branchScopeUrl}`);
    return null;
  }

  return {
    url: docUrl,
    type: datatypeId!, // TODO: JAH strict fix
    branchUrl: branchUrl ? (branchUrl as AutomergeUrl) : undefined,
    branchScopeUrl: branchScopeUrl
      ? (branchScopeUrl as AutomergeUrl)
      : undefined,
  };
};
