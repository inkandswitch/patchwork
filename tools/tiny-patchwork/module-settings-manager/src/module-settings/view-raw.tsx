import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { OpenDocumentEventDetail } from "@inkandswitch/patchwork-elements";

function createOpenEvent(detail: OpenDocumentEventDetail) {
  const openEvent = new CustomEvent("patchwork:open-document", {
    detail,
    bubbles: true,
    composed: true,
  });
  return openEvent;
}

interface ViewRawProps {
  url: AutomergeUrl;
  class?: string;
}

export function ViewRaw(props: ViewRawProps) {
  return (
    <button
      class={props.class || "view-raw-button"}
      onClick={(e) => {
        e.currentTarget.dispatchEvent(
          createOpenEvent({ url: props.url, toolId: "raw" })
        );
      }}
      title="View Raw"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}
