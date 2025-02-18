import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DocEditor } from "./DocEditor";
export const SideBySide = (props) => {
    // special side-by-side view for tldraw with scroll linking
    // todo: add back once modules is gone
    /* if (props.tool.id === "tldraw") {
      return <TLDrawSideBySide {...props} />;
    }*/
    const { mainDocUrl } = props;
    return (_jsxs("div", { className: "flex h-full w-full", children: [_jsx("div", { className: "h-full flex-1 overflow-auto bg-gray-200", children: _jsx(DocEditor, { ...props, docUrl: mainDocUrl, 
                    // note: we don't want to pass in docheads here, the doc heads in the parent
                    // should not affect the heads we show for main
                    docHeads: undefined, annotations: [], annotationGroups: [] }) }), _jsx("div", { className: "h-full flex-1 overflow-auto", children: _jsx(DocEditor, { ...props }) })] }));
};
