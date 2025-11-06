import { useDocHandle, useDocument, } from "@automerge/automerge-repo-react-hooks";
import { PathRef, CONTEXT } from "@patchwork/context";
import { useEffect, useMemo, useRef, useState } from "react";
export function useReactive(reactive) {
    const [value, setValue] = useState(reactive?.value);
    useEffect(() => {
        if (reactive) {
            reactive.on("change", setValue);
        }
    }, [reactive]);
    return value;
}
export function useDocRef(docUrl, params) {
    const docHandle = useDocHandle(docUrl, params);
    return useMemo(() => (docHandle ? new PathRef(docHandle, []) : undefined), [docHandle]);
}
export const useSubcontext = (id) => {
    const [subcontext] = useState(() => CONTEXT.subcontext(id));
    const subcontextRef = useRef(subcontext);
    useEffect(() => () => {
        CONTEXT.remove(subcontextRef.current);
    }, []);
    return subcontext;
};
export const useRefValue = (ref) => {
    const [doc] = useDocument(ref?.docHandle.url);
    return useMemo(() => {
        void doc; // make eslint happy memo should rerun when doc changes
        if (!ref) {
            return undefined;
        }
        return ref.value;
    }, [ref, doc]);
};
