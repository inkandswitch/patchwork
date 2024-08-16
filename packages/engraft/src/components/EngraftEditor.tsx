import {
  getDocState,
  ifLoaded,
  LoadingError,
  parallelMap,
  throwIfMissing,
  useDocReactive,
} from "@/doc-reactive";
import { useRootFolderDocWithChildren } from "@/explorer/account";
import { useHandleDef } from "@/hooks/useHandleDef";
import { FolderDocWithMetadata } from "@/packages/folder/hooks/useFolderDocWithChildren";
import { Button } from "@/shadcn/ui/button";
import { EditorProps } from "@/tools";
import {
  AutomergeUrl,
  isValidAutomergeUrl,
  parseAutomergeUrl,
  updateText,
} from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { makeFancyContext } from "@engraft/fancy-setup";
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
import { EngraftDoc } from "../datatype";
import {
  applyUpdateAsChangeToObject,
  removeUndefineds,
} from "../engraft-automerge";

const context = makeFancyContext();

function getDocName(
  url: AutomergeUrl,
  rootFolderDocWithChildren: FolderDocWithMetadata | undefined
): string {
  const docLink = rootFolderDocWithChildren?.flatDocLinks.find(
    (link) => link.url === url
  );
  const automergeId = parseAutomergeUrl(url).documentId;
  return docLink?.name || automergeId;
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

  const rootFolderDocWithChildren = useRootFolderDocWithChildren();

  const repo = useRepo();
  const varBindings = ifLoaded(
    useDocReactive(
      useCallback(() => {
        if (!doc) {
          return {};
        }
        const outputPs: EngraftPromise<ToolOutput>[] = parallelMap(
          doc.inputUrls,
          (url) => {
            const docState = getDocState<unknown>(url, repo);
            throwIfMissing(docState);
            return docState instanceof LoadingError
              ? EngraftPromise.unresolved()
              : EngraftPromise.resolve({ value: docState });
          }
        );

        let varBindings: { [id: string]: VarBinding } = {};
        for (const [i, url] of doc.inputUrls.entries()) {
          const automergeId = parseAutomergeUrl(url).documentId;
          // TODO: underscore hack oh no
          const id = `IDautomerge${automergeId.replace(/\d/g, "_")}000000`;
          varBindings[id] = {
            var_: {
              id,
              label: getDocName(url, rootFolderDocWithChildren),
            },
            outputP: outputPs[i],
          };
        }
        return varBindings;
      }, [doc, repo, rootFolderDocWithChildren])
    )
  );

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
  const programIsEmpty = isEqual(program, context.makeSlotWithCode(""));

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
                  {getDocName(depUrl, rootFolderDocWithChildren)}
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
                  {getDocName(doc.outputUrl, rootFolderDocWithChildren)}
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
          context={context}
        />
        {programIsEmpty && <span className="pl-4">↑ start here!</span>}
      </div>
    </div>
  );
};
