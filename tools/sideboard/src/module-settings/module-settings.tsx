import {
  createSignal,
  For,
  Suspense,
  onCleanup,
  createEffect,
  createResource,
  type Signal,
  type Resource,
  Show,
} from "solid-js";
import html from "solid-js/html";
import { createStore, unwrap, reconcile } from "solid-js/store";
import { makeDocumentProjection } from "@automerge/automerge-repo-solid-primitives";

import {
  getPluginRegistry,
  getLoadedPlugins,
  type Tool,
  getPlugins,
} from "@patchwork/plugins";
import {
  isValidAutomergeUrl,
  type AutomergeUrl,
} from "@automerge/automerge-repo";
import type { ModuleSettingsDoc } from "@patchwork/filesystem";
import type { PatchworkToolProps } from "../types.ts";
import { useTools } from "../sideboard/plugins.ts";
const registry = getPluginRegistry("patchwork:tool");

function swapWithEnd(list: any[], idx: number) {
  const end = list.length - 1;
  [list[idx], list[end]] = [list[end], list[idx]];
}

// https://docs.solidjs.com/reference/basic-reactivity/create-resource#version-140-and-later
// https://github.com/solidjs-community/solid-primitives/blob/main/packages/resource/src/index.ts
function createDeepSignal<T>(): Signal<T | undefined>;
function createDeepSignal<T>(value: T): Signal<T>;
function createDeepSignal<T>(v?: T): Signal<T> {
  const [store, setStore] = createStore([v]);
  return [
    () => store[0],
    (update: T) => (
      setStore(
        0,
        reconcile(
          typeof update === "function" ? update(unwrap(store[0])) : update
        )
      ),
      store[0]
    ),
  ] as Signal<T>;
}

const add = (item: AutomergeUrl) => (doc: ModuleSettingsDoc) => {
  const idx = doc.modules.findIndex((mod) => item == mod);
  if (idx == -1) {
    doc.modules.push(item);
  } else {
    swapWithEnd(doc.modules, idx);
  }
};

const rm = (item: AutomergeUrl) => (doc: ModuleSettingsDoc) => {
  const idx = doc.modules.findIndex((mod) => item == mod);
  if (idx != -1) {
    swapWithEnd(doc.modules, idx);

    doc.modules.pop();
  }
};

export function ModuleSettings(props: PatchworkToolProps<ModuleSettingsDoc>) {
  const tools = useTools();

  const doc = makeDocumentProjection(props.handle);

  const [newUrl, setNewUrl] = createSignal("");

  createEffect(() => {
    const url = newUrl();
    if (isValidAutomergeUrl(url)) {
      setNewUrl("");
      props.handle.change(add(url));
    }
  });

  return (
    <div class="module-settings">
      <input
        type="text"
        value={newUrl()}
        onInput={(event) => setNewUrl(event.target.value)}
        placeholder="automerge:..."
      />
      <div class="module-settings__tools">
        <For each={tools}>
          {(tool) => {
            const installed = () =>
              isValidAutomergeUrl(tool.importUrl) &&
              doc.modules.includes(tool.importUrl as AutomergeUrl);
            return (
              <Suspense>
                <article class="module-settings__tool">
                  <h2>{tool.name}</h2>
                  <p>
                    <code>{tool.importUrl}</code>
                  </p>
                  <Show when={isValidAutomergeUrl(tool.importUrl)}>
                    <label>
                      load at startup?
                      <input
                        type="checkbox"
                        checked={installed()}
                        onInput={() => {
                          const url = tool.importUrl as AutomergeUrl;
                          props.handle.change((doc) => {
                            if (installed()) {
                              add(url)(doc);
                            } else {
                              rm(url)(doc);
                            }
                          });
                        }}
                      />
                    </label>
                  </Show>
                  <h3>supported data types</h3>
                  <ul>
                    <For
                      each={
                        Array.isArray(tool.supportedDataTypes)
                          ? tool.supportedDataTypes
                          : ["*"]
                      }
                    >
                      {(dt) => html`<li>${() => dt}</li>`}
                    </For>
                  </ul>
                </article>
              </Suspense>
            );
          }}
        </For>
      </div>
    </div>
  );
}
