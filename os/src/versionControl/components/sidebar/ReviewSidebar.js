import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@patchwork/sdk/ui";
import React from "react";
import { getAnnotationGroupId } from "@patchwork/sdk/versionControl";
import { AnnotationGroupView } from "@patchwork/sdk/components";
export const ReviewSidebar = React.memo(({ doc, handle, readonly, tool, annotationGroups, selectedAnchors, setSelectedAnnotationGroupId, setHoveredAnnotationGroupId, setCommentState, }) => {
    const editingComment = annotationGroups.some((group) => group.comment?.type === "create" || group.comment?.type === "edit");
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx("div", { className: "bg-gray-50 flex-1 p-2 flex flex-col z-20 m-h-[100%] overflow-y-auto overflow-x-visible", children: annotationGroups.map((annotationGroup, index) => {
                    const id = getAnnotationGroupId(annotationGroup);
                    return (_jsx(AnnotationGroupView, { doc: doc, readonly: readonly, handle: handle, AnnotationsViewComponent: tool.AnnotationsViewComponent, annotationGroup: annotationGroup, setIsHovered: (isHovered) => {
                            setHoveredAnnotationGroupId(isHovered ? id : undefined);
                        }, setIsSelected: (isSelected) => {
                            setSelectedAnnotationGroupId(isSelected ? id : undefined);
                        }, onSelectNext: () => {
                            const nextAnnotation = annotationGroups[index + 1];
                            if (nextAnnotation) {
                                setSelectedAnnotationGroupId(getAnnotationGroupId(nextAnnotation));
                            }
                        }, onSelectPrev: () => {
                            const prevAnnotation = annotationGroups[index - 1];
                            if (prevAnnotation) {
                                setSelectedAnnotationGroupId(getAnnotationGroupId(prevAnnotation));
                            }
                        }, setCommentState: setCommentState, hasNext: index < annotationGroups.length - 1, hasPrev: index > 0, enableScrollSync: true }, id));
                }) }), !readonly && (_jsx("div", { className: "bg-gray-50 z-10 px-2 py-4 flex flex-col gap-3 border-b border-gray-200 ", children: _jsxs(Button, { variant: "outline", disabled: editingComment, onClick: () => {
                        setCommentState({
                            type: "create",
                            target: selectedAnchors.length > 0 ? selectedAnchors : undefined,
                        });
                    }, children: ["Add comment ", selectedAnchors.length > 0 ? "on selection" : "", _jsx("span", { className: "text-gray-400 ml-2 text-xs", children: "(\u2318 + shift + m)" })] }) }))] }));
});
