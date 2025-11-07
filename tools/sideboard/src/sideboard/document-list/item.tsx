import { ContextMenu } from "@kobalte/core/context-menu";
import {
  createEffect,
  createSignal,
  For,
  Show,
  untrack,
  type JSX,
} from "solid-js";
import { useSupportedToolsForType } from "../plugins.ts";

export default function Item(props: {
  id: string;
  type: string;
  pressed: boolean;
  children: JSX.Element;
  openWith(toolId?: string): void;
  startRenaming(): void;
  remove(): void;
}) {
  const tools = useSupportedToolsForType(props.type);
  const [trigger, setTrigger] = createSignal<HTMLButtonElement>();

  createEffect((prev) => {
    if (props.pressed && !prev) {
      const el = untrack(trigger);
      if (el) {
        // @ts-expect-error this is non-critical, we can add a
        // ponyfill if we so desire
        el?.scrollIntoViewIfNeeded?.();
      }
    }
    return props.pressed;
  });

  return (
    <ContextMenu>
      <ContextMenu.Trigger
        ref={setTrigger}
        as="button"
        class="popmenu__trigger document-list-item"
        role="treeitem"
        aria-pressed={props.pressed}
        onClick={() => props.openWith()}
        onkeydown={(event: KeyboardEvent) => {
          if (
            event.key == "Enter" &&
            event.ctrlKey &&
            !(+event.altKey | +event.shiftKey | +event.metaKey)
          ) {
            if (trigger()) {
              event.preventDefault();
              event.stopImmediatePropagation();
              event.stopPropagation();
              const el = event.target as HTMLButtonElement;
              const box = el.getBoundingClientRect();
              trigger()!.dispatchEvent(
                new MouseEvent("contextmenu", {
                  bubbles: true,
                  clientX: box.x + 10,
                  clientY: box.y + box.height - 10,
                })
              );
            }
          }
        }}
      >
        {props.children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content class="popmenu__content">
          <Show when={tools.length}>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger class="popmenu__sub-trigger">
                Open with...
              </ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.SubContent class="popmenu__sub-content">
                  <For each={tools}>
                    {(tool) => {
                      return (
                        <ContextMenu.Item
                          class="popmenu__item"
                          onSelect={() => props.openWith(tool.id)}
                        >
                          {tool.name}
                        </ContextMenu.Item>
                      );
                    }}
                  </For>
                </ContextMenu.SubContent>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
            <ContextMenu.Item
              class="popmenu__item"
              onSelect={() => props.startRenaming()}
            >
              Rename
            </ContextMenu.Item>
            <ContextMenu.Item
              class="popmenu__item"
              onSelect={() => props.remove()}
            >
              Remove
            </ContextMenu.Item>
          </Show>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu>
  );
}
