import { SideBySideProps } from "@patchwork/sdk/versionControl";
import { DocEditor } from "./DocEditor";

export const SideBySide = <T, V>(props: SideBySideProps<T, V>) => {
  // special side-by-side view for tldraw with scroll linking
  // todo: add back once modules is gone
  /* if (props.tool.id === "tldraw") {
    return <TLDrawSideBySide {...props} />;
  }*/

  const { mainDocUrl } = props;

  return (
    <div className="flex h-full w-full">
      <div className="h-full flex-1 overflow-auto bg-gray-200">
        {
          <DocEditor
            {...props}
            docUrl={mainDocUrl}
            // note: we don't want to pass in docheads here, the doc heads in the parent
            // should not affect the heads we show for main
            annotations={[]}
            annotationGroups={[]}
          />
        }
      </div>
      <div className="h-full flex-1 overflow-auto">
        {<DocEditor {...props} />}
      </div>
    </div>
  );
};
