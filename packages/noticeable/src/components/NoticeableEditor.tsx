import {
  AnyDocumentId,
  DocHandleChangePayload,
} from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { TextFileEditor } from "@patchwork/file/components";
import { EditorProps, useCurrentAccount } from "@patchwork/sdk";
import { asyncComputed, fetchDoc } from "@patchwork/sdk/async-signals";
import { TextAnchor } from "@patchwork/sdk/textAnchors";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { Notebook } from "noticeable";
import { useLayoutEffect, useMemo, useState } from "react";
import { react } from "signia";
import { getContent, NoticeableDoc } from "../datatype";
import { Iframe } from "./Iframe";

// @ts-ignore
import { observe } from "./observe";

export const NoticeableEditor = (props: EditorProps<unknown, unknown>) => {
  const [doc] = useDocument<NoticeableDoc>(props.docUrl);
  const repo = useRepo();

  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);

  const currentAccount = useCurrentAccount();

  const observeDoc = useMemo(
    // first () => is for the useMemo, second is for builtins
    () => () => (id: AnyDocumentId) => {
      return observe((change: (val: any) => void) => {
        const handle = repo.find(id);
        handle.doc().then(change);
        function onChange(ev: DocHandleChangePayload<any>) {
          change(ev.doc);
        }
        handle.on("change", onChange);
        return () => handle.off("change", onChange);
      });
    },
    []
  );

  const observeAsyncComputed = useMemo(
    // first () => is for the useMemo, second is for builtins
    () => () => (cb: () => any) => {
      const signal = asyncComputed(cb);
      return observe((change: (val: any) => void) => {
        const stop = react("", () => {
          const asyncState = signal.value;
          console.log("reacting", asyncState);
          if (asyncState.state === "rejected") {
            throw asyncState.error;
          } else if (asyncState.state === "fulfilled") {
            change(asyncState.value);
          }
        });
        return stop;
      });
    },
    []
  );

  const _fetchDoc = useMemo(
    // first () => is for the useMemo, second is for builtins
    () => () => fetchDoc,
    []
  );

  const builtins = useMemo(() => {
    return {
      win: iframe?.contentWindow,
      repo,
      observeDoc,
      currentAccount,
      observeAsyncComputed,
      fetchDoc: _fetchDoc,
    };
  }, [iframe, repo, observeDoc, currentAccount]);

  // some Observable inputs library adds a style tag to the head of
  // THIS document, and then the iframe can't see it. clearly the
  // iframe thing is not yet a complete solution to anything. idk.
  // here's a hack.
  const [annoyingInputsStyle, setAnnoyingInputsStyle] = useState<
    string | null
  >();
  useLayoutEffect(() => {
    function search(nodeList: NodeList) {
      for (const node of nodeList) {
        if (
          node instanceof HTMLStyleElement &&
          node.className.includes("inputs-")
        ) {
          setAnnoyingInputsStyle(node.textContent);
        }
      }
    }

    // now
    search(document.head.childNodes);

    // & later
    const observer = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        search(mutation.addedNodes);
      }
    });
    observer.observe(document.head, { childList: true });
    return () => observer.disconnect();
  }, []);

  return (
    <Allotment snap={true}>
      <div className="w-full h-full bg-white">
        <TextFileEditor {...(props as EditorProps<TextAnchor, string>)} />
      </div>
      <Iframe className="w-full h-full" setIframe={setIframe}>
        {annoyingInputsStyle && <style>{annoyingInputsStyle}</style>}
        <div id="observablehq-center">
          {iframe && doc && (
            <Notebook code={getContent(doc)} builtins={builtins} />
          )}
        </div>
      </Iframe>
    </Allotment>
  );
};
