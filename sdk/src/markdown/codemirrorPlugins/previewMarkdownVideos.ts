import {
  WidgetType,
  EditorView,
  ViewPlugin,
  DecorationSet,
  ViewUpdate,
  Decoration,
} from "@codemirror/view";
import { Range, StateEffect, StateField } from "@codemirror/state";
import { DocHandle, DocumentId, Repo } from "@automerge/automerge-repo";
import * as A from "@automerge/automerge";

class Video extends WidgetType {
  constructor(
    protected heads: A.Heads,
    protected url: string,
    protected caption: string
  ) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement("div");
    const video = document.createElement("video");

    video.crossOrigin = "anonymous";
    video.src = this.url;
    video.className = "min-w-0 max-w-full";
    video.controls = true;
    video.onerror = () => {
      video.style.opacity = "0";
    };

    wrapper.append(video);
    wrapper.className = "w-fit border border-gray-200";

    if (this.caption.length > 0) {
      const captionDiv = document.createElement("div");
      captionDiv.append(document.createTextNode(this.caption));
      captionDiv.className = "p-4 bg-gray-100 text-sm font-sans";
      wrapper.append(captionDiv);
    }

    return wrapper;
  }

  eq(other: Video) {
    return (
      other.url === this.url &&
      other.caption === this.caption &&
      A.equals(other.heads, this.heads)
    );
  }

  ignoreEvent() {
    return true;
  }
}

const MARKDOWN_VIDEO_REGEX =
  /<video.*?src="(?<url>.*?)".*?>(?<caption>.*?)<\/video>/gs;

function getVideos(
  heads: A.Heads,
  docHandle: DocumentId | undefined,
  view: EditorView
) {
  const decorations: Range<Decoration>[] = [];

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);

    let match;
    while ((match = MARKDOWN_VIDEO_REGEX.exec(text))) {
      const position = match.index + from;

      const url = match.groups!.url;
      const caption = match.groups!.caption.trim();

      const video = new Video(
        heads,
        url.startsWith("./automerge") ? url : "",
        caption
      );
      const widget = Decoration.widget({
        widget: video,
        side: -1,
      }).range(position);
      decorations.push(widget);
      decorations.push(
        Decoration.mark({
          class:
            "text-gray-500 font-mono text-left text-sm leading-snug inline-block opacity-70 mb-1",
        }).range(position, position + match[0].length)
      );
    }
  }

  return Decoration.set(decorations, true /* = sort decorations */);
}

export const setAssetHeadsEffect = StateEffect.define<A.Heads>();
export const assetsHeadsField = StateField.define<A.Heads>({
  create() {
    return [];
  },
  update(threads, tr) {
    for (const e of tr.effects) {
      if (e.is(setAssetHeadsEffect)) {
        return e.value;
      }
    }
    return threads;
  },
});

export const previewVideosPlugin = (handle: DocHandle<unknown>, repo: Repo) => [
  assetsHeadsField,
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.set([]);
      videos: HTMLVideoElement[] = [];

      constructor(private view: EditorView) {
        this.decorations = getVideos([], undefined, view);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.transactions.some((tr) =>
            tr.effects.some((e) => e.is(setAssetHeadsEffect))
          )
        ) {
          const heads = update.state.field(assetsHeadsField);
          this.decorations = getVideos(heads, handle.documentId, update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  ),
];
