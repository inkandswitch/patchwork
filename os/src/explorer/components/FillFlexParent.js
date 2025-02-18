import { jsx as _jsx } from "react/jsx-runtime";
// This is a helper component copied from the react-arborist library.
// It provides a width/height value for filling a flex layout parent.
// These values can then be passed down to a child component.
import React from "react";
import useResizeObserver from "use-resize-observer";
function mergeRefs(...refs) {
    return (instance) => {
        refs.forEach((ref) => {
            if (typeof ref === "function") {
                ref(instance);
            }
            else if (ref != null) {
                ref.current = instance;
            }
        });
    };
}
const style = {
    flex: 1,
    width: "100%",
    height: "100%",
    minHeight: 0,
    minWidth: 0,
};
export const FillFlexParent = React.forwardRef(function FillFlexParent(props, forwardRef) {
    const { ref, width, height } = useResizeObserver();
    return (_jsx("div", { style: style, ref: mergeRefs(ref, forwardRef), children: width && height ? props.children({ width, height }) : null }));
});
