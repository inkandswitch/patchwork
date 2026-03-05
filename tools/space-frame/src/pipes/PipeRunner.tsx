import { createEffect, onCleanup } from "solid-js";
import type { Repo, DocHandle } from "@automerge/automerge-repo";
import type { SpaceLayout, Pipe, SpaceItem } from "../layout/types";
import { runTransformChain } from "./transforms/registry";
import type { PatchworkPreviewElement } from "../elements/patchwork-preview";
import type { PatchworkViewElement } from "@inkandswitch/patchwork-elements";

// Side-effect: register all built-in transforms
import "./transforms/latex-to-html";
import "./transforms/passthrough";

type Props = {
  layout: SpaceLayout;
  rootElement: HTMLElement;
  repo: Repo;
};

type ActivePipe = {
  pipeId: string;
  cleanup: () => void;
};

export function PipeRunner(props: Props) {
  let activePipes: ActivePipe[] = [];

  function getAllPipes(layout: SpaceLayout): Pipe[] {
    const pipes = [...layout.pipes];
    function collectFromItems(items: SpaceItem[]) {
      for (const item of items) {
        if (item.content.type === "group") {
          pipes.push(...item.content.pipes);
          collectFromItems(item.content.children);
        }
      }
    }
    collectFromItems(layout.items);
    return pipes;
  }

  function findSpaceElement(spaceId: string): HTMLElement | null {
    return (
      props.rootElement.querySelector(`[data-space-id="${spaceId}"]`) ??
      document.querySelector(`[data-space-id="${spaceId}"]`)
    );
  }

  function getSourceDocHandle(
    spaceEl: HTMLElement
  ): { handle: DocHandle<any>; view: PatchworkViewElement } | null {
    const view = spaceEl.querySelector("patchwork-view") as PatchworkViewElement | null;
    if (!view?.docUrl || !view?.repo) return null;

    const handle = view.repo.find(view.docUrl);
    if (!handle) return null;

    return { handle, view };
  }

  function getTargetPreview(
    spaceEl: HTMLElement
  ): PatchworkPreviewElement | null {
    return spaceEl.querySelector("patchwork-preview") as PatchworkPreviewElement | null;
  }

  async function executePipe(pipe: Pipe) {
    if (pipe.transforms.length === 0) return null;

    const sourceEl = findSpaceElement(pipe.from);
    const targetEl = findSpaceElement(pipe.to);
    if (!sourceEl || !targetEl) return null;

    const source = getSourceDocHandle(sourceEl);
    const target = getTargetPreview(targetEl);
    if (!source || !target) return null;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    async function runPipe() {
      try {
        const doc = source!.handle.doc();
        if (!doc) return;

        const types = pipe.transforms.map((t) => t.type);
        const result = await runTransformChain(types, doc);
        if (result !== null && target) {
          target.value = result;
        }
      } catch (e) {
        console.error(`Pipe ${pipe.id} execution error:`, e);
      }
    }

    const onChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runPipe, 300);
    };

    source.handle.on("change", onChange);

    // Run immediately on setup
    await runPipe();

    return () => {
      source.handle.off("change", onChange);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }

  createEffect(() => {
    // Clean up old pipes
    for (const ap of activePipes) {
      ap.cleanup();
    }
    activePipes = [];

    const pipes = getAllPipes(props.layout);
    if (pipes.length === 0) return;

    // Delay slightly to let the DOM settle after layout changes
    const timer = setTimeout(async () => {
      for (const pipe of pipes) {
        const cleanup = await executePipe(pipe);
        if (cleanup) {
          activePipes.push({ pipeId: pipe.id, cleanup });
        }
      }
    }, 100);

    onCleanup(() => {
      clearTimeout(timer);
      for (const ap of activePipes) {
        ap.cleanup();
      }
      activePipes = [];
    });
  });

  return null;
}
