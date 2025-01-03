import { HTMLAttributes, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface IframeProps extends HTMLAttributes<HTMLIFrameElement> {
  children: ReactNode;
  setIframe?: (iframe: HTMLIFrameElement | null) => void;
}

export const Iframe = ({
  children,
  setIframe,
  ...iframeProps
}: IframeProps) => {
  const [iframe, _setIframe] = useState<HTMLIFrameElement | null>(null);
  const [mountNode, setMountNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (setIframe) {
      console.log("setting iframe", iframe);
      setIframe(iframe);
    }
  }, [iframe]);

  useEffect(() => {
    if (iframe) {
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc) {
        const node = iframeDoc.createElement("div");
        iframeDoc.body.appendChild(node);
        setMountNode(node);
      }
    }
  }, [iframe]);

  useEffect(() => {
    // read mousemove events from the iframe and dispatch them on the
    // parent so the react-mosaic divider works (must match logic in
    // https://github.com/nomcopter/react-mosaic/blob/master/src/Split.tsx#L62)
    if (iframe) {
      function onMouseMove(e: MouseEvent) {
        const rect = iframe!.getBoundingClientRect();
        document.dispatchEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
            clientX: e.clientX + rect.left,
            clientY: e.clientY + rect.top,
          })
        );
      }
      iframe.contentWindow?.addEventListener("mousemove", onMouseMove);
      return () => {
        iframe.contentWindow?.removeEventListener("mousemove", onMouseMove);
      };
    }
  }, [iframe]);

  return (
    // eslint-disable-next-line jsx-a11y/iframe-has-title
    <iframe ref={_setIframe} {...iframeProps}>
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
};
