import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@patchwork/sdk/ui";
export const NoDocumentSelected = ({ addNewDoc, }) => {
    return (_jsx("div", { className: "flex items-center justify-center h-full text-gray-500", children: _jsxs("div", { children: [_jsx("p", { className: "text-center cursor-default select-none mb-4", children: "No document selected" }), _jsxs(Button, { onClick: () => addNewDoc({ type: "essay" }), variant: "outline", children: ["Create new document", _jsx("span", { className: "ml-2", children: "(\u23CE)" })] })] }) }));
};
