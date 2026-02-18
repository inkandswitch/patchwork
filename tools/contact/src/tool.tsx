import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";
import "./styles.css";
import { createRoot } from "react-dom/client";

function addStyles(element: HTMLElement, textContent: string) {
  const id = "contact-styles";
  const el = element.querySelector(`#${id}`) ?? document.createElement("style");
  Object.assign(el, { textContent, id });
  element.append(el);
}

async function loadStyles() {
  const url = new URL("./tool.css", import.meta.url);
  return (await fetch(url)).text();
}

export const plugins = [
  {
    type: "patchwork:datatype",
    id: "contact",
    name: "Contact",
    icon: "User",
    async load() {
      const { ContactDatatype } = await import("./datatype");
      return ContactDatatype;
    },
  },
  {
    type: "patchwork:tool",
    id: "contact",
    name: "Contact Viewer",
    supportedDatatypes: ["contact"],
    async load(): Promise<ToolImplementation> {
      const { RepoContext } =
        await import("@automerge/automerge-repo-react-hooks");
      const { ContactViewer } = await import("./components/ContactViewer");
      const css = await loadStyles();
      return (handle, element) => {
        addStyles(document.head, css);
        const root = createRoot(element);
        root.render(
          <RepoContext.Provider value={element.repo}>
            <ContactViewer docUrl={handle.url} />
          </RepoContext.Provider>
        );
        return () => root.unmount();
      };
    },
  },
  {
    type: "patchwork:tool",
    id: "contact-avatar",
    name: "Contact Avatar",
    supportedDatatypes: ["contact"],
    async load(): Promise<ToolImplementation> {
      const { RepoContext } =
        await import("@automerge/automerge-repo-react-hooks");
      const { ContactAvatar } = await import("./components/ContactAvatar");
      const css = await loadStyles();
      return (handle, element) => {
        addStyles(document.head, css);
        const root = createRoot(element);
        root.render(
          <RepoContext.Provider value={element.repo}>
            <ContactAvatar docUrl={handle.url} />
          </RepoContext.Provider>
        );
        return () => root.unmount();
      };
    },
  },
  {
    type: "patchwork:tool",
    id: "contact-inline",
    name: "Inline Contact Avatar",
    supportedDatatypes: ["contact"],
    async load(): Promise<ToolImplementation> {
      const { RepoContext } =
        await import("@automerge/automerge-repo-react-hooks");
      const { InlineContactAvatar } =
        await import("./components/InlineContactAvatar");
      const css = await loadStyles();
      return (handle, element) => {
        addStyles(document.head, css);
        const root = createRoot(element);
        root.render(
          <RepoContext.Provider value={element.repo}>
            <InlineContactAvatar docUrl={handle.url} />
          </RepoContext.Provider>
        );
        return () => root.unmount();
      };
    },
  },
];
