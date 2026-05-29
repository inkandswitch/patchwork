/**
 * Markdown → HTML.
 *
 * A baby converter: no native deps, no worker, runs anywhere. Supports ATX
 * headings, bullets, inline code/bold/italic, paragraphs. For richer output,
 * write your own pattern around a real markdown library — the shape is the
 * same: `onAnyChange → read first source → compute → change`.
 */
import type { EdgeHandle } from "@inkandswitch/edge-handles";

export function markdownToHtml(edge: EdgeHandle<string>): () => void {
  return edge.onAnyChange(() => {
    const first = Object.values(edge.source)[0];
    const src = first?.value();
    edge.change(convert(typeof src === "string" ? src : ""));
  });
}

function convert(src: string): string {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let listOpen = false;
  let paraBuf: string[] = [];

  const flushPara = () => {
    if (paraBuf.length === 0) return;
    out.push(`<p>${inline(paraBuf.join(" "))}</p>`);
    paraBuf = [];
  };
  const closeList = () => {
    if (listOpen) {
      out.push("</ul>");
      listOpen = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim() === "") {
      flushPara();
      closeList();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushPara();
      closeList();
      out.push(
        `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`
      );
      continue;
    }
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushPara();
      if (!listOpen) {
        out.push("<ul>");
        listOpen = true;
      }
      out.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }
    paraBuf.push(line);
  }
  flushPara();
  closeList();
  return out.join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  const codeSpans: string[] = [];
  let out = escapeHtml(s).replace(/`([^`]+)`/g, (_m, code) => {
    const ix = codeSpans.push(`<code>${code}</code>`) - 1;
    return `\u0000CODE${ix}\u0000`;
  });
  out = out
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/\u0000CODE(\d+)\u0000/g, (_m, ix) => codeSpans[+ix]);
  return out;
}
