import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";
import "./styles.css";

export const plugins = [
  {
    type: "patchwork:datatype",
    id: "contact",
    name: "Contact",
    icon: "User",
    async load() {
      const { ContactDataType } = await import("./datatype");
      return ContactDataType;
    },
  },
  {
    type: "patchwork:tool",
    id: "contact",
    name: "Contact Viewer",
    supportedDataTypes: ["contact"],
    async load(): Promise<ToolImplementation> {
      const { createRoot } = await import( "react-dom/client");
      const { RepoContext } = await import( "@automerge/automerge-repo-react-hooks");
      const { ContactViewer } = await import("./components/ContactViewer");
      return (handle, element) => {
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
    supportedDataTypes: ["contact"],
    async load(): Promise<ToolImplementation> {
      const { createRoot } = await import( "react-dom/client");
      const { RepoContext } = await import( "@automerge/automerge-repo-react-hooks");
      const { ContactAvatar } = await import("./components/ContactAvatar");
      return (handle, element) => {
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
    supportedDataTypes: ["contact"],
    async load(): Promise<ToolImplementation> {
      const { createRoot } = await import( "react-dom/client");
      const { RepoContext } = await import( "@automerge/automerge-repo-react-hooks");
      const { InlineContactAvatar } = await import("./components/InlineContactAvatar");
      return (handle, element) => {
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
