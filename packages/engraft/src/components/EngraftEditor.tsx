import { useRootFolderDocWithMetadata } from "@patchwork/sdk";
import { useHandleDef } from "@patchwork/sdk/hooks/useHandleDef";
import { FolderDocWithMetadata } from "@patchwork/folder/hooks/fetchFolderDocWithMetadata";
import { Button } from "@patchwork/sdk/ui/button";
import { EditorProps } from "@patchwork/sdk";
import {
  AutomergeUrl,
  isValidAutomergeUrl,
  parseAutomergeUrl,
  updateText,
} from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import {
  EngraftPromise,
  PromiseState,
  ToolOutput,
  ToolProgram,
  ToolWithView,
  Updater,
  VarBinding,
} from "@engraft/hostkit";
import { isEqual, isObject } from "lodash";
import { useCallback } from "react";
import { engraftContext, EngraftDoc } from "../datatype";
import {
  applyUpdateAsChangeToObject,
  removeUndefineds,
} from "../engraft-automerge";
import {
  getDocState,
  fetchMap,
  useAsyncComputed,
} from "@patchwork/sdk/async-signals";
import { DocPath } from "../../../folder/src/datatype";

function getDocName(
  url: AutomergeUrl,
  rootFolderDocWithChildren: FolderDocWithMetadata | undefined
): string {
  const docPath = rootFolderDocWithChildren?.flatDocPaths.find(
    (docPath) => DocPath.toLink(docPath).url === url
  );
  if (docPath) {
    return DocPath.toLink(docPath).name;
  } else {
    return parseAutomergeUrl(url).documentId;
  }
}

export function findAutomergeUrl(str: string): AutomergeUrl | null {
  const idMatches = str.matchAll(/([a-zA-Z0-9]{27,28})/g);
  for (const idMatch of idMatches) {
    if (idMatch && idMatch[1]) {
      const url = `automerge:${idMatch[1]}`;
      if (isValidAutomergeUrl(url)) {
        return url;
      }
    }
  }
  return null;
}

function replaceObject(obj: any, newObj: any) {
  for (const key in obj) {
    delete obj[key];
  }
  Object.assign(obj, newObj);
}

export const EngraftEditor = (props: EditorProps<unknown, unknown>) => {
  const [doc, changeDoc] = useDocument<EngraftDoc>(props.docUrl);
  const handle = useHandleDef<EngraftDoc>(props.docUrl);

  const rootFolderDocWithMetadata = useRootFolderDocWithMetadata();

  const repo = useRepo();
  const inputUrls = doc?.inputUrls;
  const varBindings = useAsyncComputed(
    useCallback(() => {
      if (!inputUrls) {
        return {};
      }
      const outputPs: EngraftPromise<ToolOutput>[] = fetchMap(
        inputUrls,
        (url) => {
          // TODO: hacky code I think
          const docState = getDocState<unknown>(url, repo).ifPending(
            EngraftPromise.unresolved<ToolOutput>()
          );
          return docState instanceof EngraftPromise
            ? docState
            : EngraftPromise.resolve({ value: docState });
        }
      );

      let varBindings: { [id: string]: VarBinding } = {};
      for (const [i, url] of inputUrls.entries()) {
        const automergeId = parseAutomergeUrl(url).documentId;
        // TODO: underscore hack oh no
        const id = `IDautomerge${automergeId.replace(/\d/g, "_")}000000`;
        varBindings[id] = {
          var_: {
            id,
            label: getDocName(url, rootFolderDocWithMetadata),
          },
          outputP: outputPs[i],
        };
      }
      return varBindings;
    }, [inputUrls, repo, rootFolderDocWithMetadata])
  ).ifPending(undefined).value;

  const updateProgram: Updater<ToolProgram> = useCallback((update) => {
    const doc = handle.docSync();
    if (!doc) {
      throw new Error("Document not found");
    }
    changeDoc((proxy) => {
      const oldProgram = doc.program;
      const newProgram = removeUndefineds(update(oldProgram));
      applyUpdateAsChangeToObject(doc.program, newProgram, proxy.program);
    });
  }, []);

  const onOutputState = useCallback(
    async (outputState: PromiseState<ToolOutput>) => {
      if (outputState.status === "fulfilled") {
        const outputValue = outputState.value.value;
        if (doc?.outputUrl) {
          const handle = repo.find<unknown>(doc.outputUrl);
          await handle.whenReady();
          handle.change((d) => {
            if (typeof outputValue === "function") {
              outputValue(d, { updateText });
            } else if (isObject(outputValue)) {
              replaceObject(d, outputValue);
            } else {
              console.warn(
                "can't set document to non-object value",
                outputValue
              );
            }
          });
        }
      }
    },
    [doc]
  );

  if (!doc || !varBindings) {
    return <div>loading</div>;
  }

  const program = doc.program;
  const programIsEmpty = isEqual(program, engraftContext.makeSlotWithCode(""));

  return (
    <div className="overflow-scroll w-full h-full">
      <div className="p-4 flex flex-col items-start gap-2">
        <div className="flex gap-2 items-start">
          <div className="border rounded-lg p-2 text-gray-600 text-sm flex flex-col gap-2">
            <div className="font-bold flex gap-2 items-center">
              Inputs
              <div className="grow" />
              <Button
                variant="outline"
                className="flex gap-2 w-fit h-6 text-xs px-2"
                onClick={() => {
                  changeDoc((doc) => {
                    let urlStr = prompt("Paste in an Automerge doc URL:");
                    if (!urlStr) {
                      return;
                    }
                    const url = findAutomergeUrl(urlStr);
                    if (!url) {
                      return;
                    }
                    doc.inputUrls.push(url);
                  });
                }}
              >
                Add
              </Button>
            </div>
            <div>
              {doc.inputUrls.map((depUrl, i) => (
                <div
                  key={i}
                  className="hover:line-through cursor-pointer"
                  onClick={() => {
                    changeDoc((proxy) => {
                      proxy.inputUrls.splice(i, 1);
                    });
                  }}
                >
                  {getDocName(depUrl, rootFolderDocWithMetadata)}
                </div>
              ))}
            </div>
          </div>
          <div className="border rounded-lg p-2 text-gray-600 text-sm flex flex-col gap-2">
            <div className="font-bold flex gap-2 items-center">
              Output
              <div className="grow" />
              <Button
                variant="outline"
                className="flex gap-2 w-fit h-6 text-xs px-2"
                onClick={() => {
                  changeDoc((doc) => {
                    let urlStr = prompt("Paste in an Automerge doc URL:");
                    if (!urlStr) {
                      return;
                    }
                    const url = findAutomergeUrl(urlStr);
                    if (!url) {
                      console.warn("can't find automerge url");
                      return;
                    }
                    doc.outputUrl = url;
                  });
                }}
                disabled={doc.outputUrl !== null}
              >
                Add
              </Button>
            </div>
            <div>
              {doc.outputUrl && (
                <div
                  className="hover:line-through cursor-pointer"
                  onClick={() => {
                    changeDoc((proxy) => {
                      proxy.outputUrl = null;
                    });
                  }}
                >
                  {getDocName(doc.outputUrl, rootFolderDocWithMetadata)}
                </div>
              )}
            </div>
          </div>
        </div>
        <ToolWithView
          program={program}
          updateProgram={updateProgram}
          reportOutputState={onOutputState}
          varBindings={varBindings}
          expand={true}
          context={engraftContext}
        />
        {programIsEmpty && <span className="pl-4">↑ start here!</span>}
      </div>
    </div>
  );
};
