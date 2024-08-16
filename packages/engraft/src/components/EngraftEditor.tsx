import { EditorProps } from "@/tools";
import { EngraftDoc } from "../datatype";
import {
  useDocument,
  useDocuments,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import {
  EngraftPromise,
  ToolOutput,
  ToolWithView,
  VarBinding,
} from "@engraft/hostkit";
import { makeFancyContext } from "@engraft/fancy-setup";
import { useCallback, useState } from "react";
import { ToolProgram, Updater } from "@engraft/hostkit";
import { isEqual, isObject } from "lodash";
import { useHandleDef } from "@/hooks/useHandleDef";
import { Button } from "@/shadcn/ui/button";
import {
  getDoc,
  getDocState,
  ifLoaded,
  LoadingError,
  parallelMap,
  throwIfMissing,
  useDocReactive,
} from "@/doc-reactive";
import { parseUrl } from "@/explorer/hooks/useSelectedDocLink";
import {
  AutomergeUrl,
  isValidAutomergeUrl,
  parseAutomergeUrl,
} from "@automerge/automerge-repo";
import { useRootFolderDocWithChildren } from "@/explorer/account";
import { FolderDocWithChildren } from "@/packages/folder";
import { FolderDocWithMetadata } from "@/packages/folder/hooks/useFolderDocWithChildren";

// TODO
const context = makeFancyContext();

const noOp = () => {};
const empty = {};
const initialProgram = context.makeSlotWithCode("");

function applyUpdateAsChangeWithTopLevelSetter<T>(
  oldVal: T,
  newVal: T,
  proxy: T,
  topLevelSetter: (newVal: T) => void
): void {
  if (oldVal === newVal) {
    return;
  } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    applyUpdateAsChangeToArray(oldVal, newVal, proxy as unknown[]);
  } else if (isObject(oldVal) && isObject(newVal)) {
    applyUpdateAsChangeToObject(oldVal, newVal, proxy as object);
  } else {
    // TODO: handle strings with updateText?
    topLevelSetter(newVal);
  }
}

function applyUpdateAsChangeToObject<T extends object>(
  oldVal: T,
  newVal: T,
  proxy: T
): void {
  if (oldVal === newVal) {
    return;
  }
  for (const key in newVal) {
    if (oldVal[key] !== newVal[key]) {
      applyUpdateAsChangeWithTopLevelSetter(
        oldVal[key],
        newVal[key],
        proxy[key],
        (newVal) => {
          proxy[key] = newVal;
        }
      );
    }
  }
  for (const key in oldVal) {
    if (!(key in newVal)) {
      delete oldVal[key];
    }
  }
}

function applyUpdateAsChangeToArray<T>(
  oldVal: readonly T[],
  newVal: readonly T[],
  proxy: T[]
): void {
  if (oldVal === newVal) {
    return;
  }
  // Here's the tough part. We need to diff oldVal & newVal, to
  // identify:
  //
  // 1. Insertion of new elements
  // 2. Deletion of old elements
  // 3. Modification of existing elements
  //
  // The tricky part is doing #3 in the presence of #1 and #2. If we
  // were able to do this, we'd be able to call
  // applyUpdateAsChangeWithTopLevelSetter on each modification.
  //
  // For now, we phone it in hilariously. Just look at length, and
  // infer one of 1/2/3 from that.

  /** It's not purely 1, 2, or 3, so just replace oldVal with newVal
   * in the dumb, crude way. */
  function bailOut() {
    console.warn("Bailing out of array diff!", oldVal, newVal);
    proxy.splice(0, oldVal.length, ...newVal);
  }

  if (oldVal.length < newVal.length) {
    // Case 1: Detect if old array is a subset of the new array
    let additionIndices: number[] = [];
    let iOld = 0,
      iNew = 0;
    while (iOld < oldVal.length && iNew < newVal.length) {
      if (oldVal[iOld] === newVal[iNew]) {
        iOld++;
        iNew++;
      } else {
        // mismatch; assume it's an addition
        additionIndices.push(iNew);
        iNew++;
      }
    }
    // have we exhausted the old array?
    if (iOld === oldVal.length) {
      // the rest of the new array is additions
      while (iNew < newVal.length) {
        additionIndices.push(iNew);
        iNew++;
      }
      // now we make the additions to the old array
      for (const i of additionIndices) {
        proxy.splice(i, 0, newVal[i]);
      }
    } else {
      console.warn(
        `Tried to determine additions, but only accounted for ${iOld} of ${oldVal.length} old elements`
      );
      bailOut();
    }
  } else if (oldVal.length > newVal.length) {
    // Case 2: Detect if new array is a subset of the old array
    let removalIndices: number[] = [];
    let iOld = 0,
      iNew = 0;
    while (iOld < oldVal.length && iNew < newVal.length) {
      if (oldVal[iOld] === newVal[iNew]) {
        iOld++;
        iNew++;
      } else {
        removalIndices.push(iOld);
        iOld++;
      }
    }
    // have we exhausted the new array?
    if (iNew === newVal.length) {
      // the rest of the old array is removals
      while (iOld < oldVal.length) {
        removalIndices.push(iOld);
        iOld++;
      }
      // now we make the removals from the old array (in reverse order)
      removalIndices.reverse();
      for (const i of removalIndices) {
        proxy.splice(i, 1);
      }
    } else {
      console.warn(
        `Tried to determine removals, but only accounted for ${iNew} of ${newVal.length} new elements`
      );
      bailOut();
    }
  } else {
    // oldVal.length === newVal.length
    // Case 3:
    for (let i = 0; i < oldVal.length; i++) {
      applyUpdateAsChangeWithTopLevelSetter(
        oldVal[i],
        newVal[i],
        proxy[i],
        (newVal) => {
          proxy[i] = newVal;
        }
      );
    }
  }
}

// avoid type narrowing lol
function isObjectLol(val: any): boolean {
  return isObject(val);
}

// we pretend this returns T, cuz it's close enough
function removeUndefineds(val: any): any {
  if (Array.isArray(val)) {
    let newVal: any[] = [];
    let changed = false;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === undefined) {
        newVal[i] = null; // meh
        changed = true;
      } else {
        newVal[i] = removeUndefineds(val[i]);
        if (newVal[i] !== val[i]) {
          changed = true;
        }
      }
    }
    return changed ? newVal : val;
  } else if (isObjectLol(val)) {
    let newVal: any = {};
    let changed = false;
    for (const key in val) {
      if (val[key] === undefined) {
        changed = true;
      } else {
        newVal[key] = removeUndefineds(val[key]);
        if (newVal[key] !== val[key]) {
          changed = true;
        }
      }
    }
    return changed ? newVal : val;
  } else {
    return val;
  }
}

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
  const idMatch = str.match(/([a-zA-Z0-9]{28})/);
  if (idMatch && idMatch[1]) {
    const url = `automerge:${idMatch[1]}`;
    if (isValidAutomergeUrl(url)) {
      return url;
    }
  }
  return null;
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

  if (!doc || !varBindings) {
    return <div>loading</div>;
  }

  const program = doc.program;
  const programIsEmpty = isEqual(program, context.makeSlotWithCode(""));

  return (
    <div className="overflow-scroll w-full h-full">
      <div className="p-4 flex flex-col items-start gap-2">
        <ToolWithView
          program={program}
          updateProgram={updateProgram}
          reportOutputState={noOp}
          varBindings={varBindings}
          expand={true}
          context={context}
        />
        {programIsEmpty && <span className="pl-4">↑ start here!</span>}
        <div className="border rounded-lg p-4 text-gray-600 text-sm flex flex-col gap-2">
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
          <Button
            variant="outline"
            className="flex gap-2 w-fit h-8 text-xs px-2"
            onClick={() => {
              changeDoc((doc) => {
                let input = prompt("Paste in an Automerge doc URL:");
                if (!input) {
                  return;
                }
                const url = findAutomergeUrl(input);
                if (!url) {
                  return;
                }
                doc.inputUrls.push(url);
              });
            }}
          >
            Add new input
          </Button>
        </div>
      </div>
    </div>
  );
};
