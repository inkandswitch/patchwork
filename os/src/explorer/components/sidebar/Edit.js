import { jsx as _jsx } from "react/jsx-runtime";
import { DocPathUtils } from "@patchwork/sdk/router";
import { useRef, useEffect } from "react";
export const Edit = ({ node }) => {
    const input = useRef();
    const docPath = node.data.docPath;
    const docLink = DocPathUtils.toLink(docPath);
    useEffect(() => {
        input.current?.focus();
        input.current?.select();
    }, []);
    return (_jsx("input", { ref: input, defaultValue: docLink.name, onBlur: () => node.reset(), onKeyDown: (e) => {
            if (e.key === "Escape")
                node.reset();
            if (e.key === "Enter")
                node.submit(input.current?.value || "");
        } }));
};
