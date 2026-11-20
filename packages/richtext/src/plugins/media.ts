// Audio and video as blocks: a source, an optional title (a caption) and, for video, a poster
// picture. The static view and the editor both use the browser's own controls. The files come from
// the app: an address typed in the block, or the upload flow (`attachment.ts`).
//
// Markdown: `[title](src "audio")` and `[title](src "video poster=...")`, see `attachment.ts`.

import { definePlugin } from "../core/plugin";
import type { RichNode } from "../core/types";
import { el, safeUrl } from "../core/view";
import { kindLinkReader, kindTitle, nameFromSrc, textAttr, writeKindLink } from "./attachment";

interface MediaData {
  src: string;
  title: string | undefined;
  poster: string | undefined;
}

const readMedia = (node: RichNode): MediaData | undefined => {
  const src = textAttr(node.attrs?.["src"]);
  if (!src) return undefined;
  return {
    src,
    title: textAttr(node.attrs?.["title"]),
    poster: textAttr(node.attrs?.["poster"]),
  };
};

function mediaRule(tag: "audio" | "video") {
  return {
    markdown: (
      node: RichNode,
      w: { escape(text: string): string; escapeUrl(url: string): string },
    ) => {
      const data = readMedia(node);
      if (!data) return "";
      return writeKindLink(
        data.title ?? nameFromSrc(data.src),
        data.src,
        kindTitle(tag, tag === "video" ? { poster: data.poster } : {}),
        w.escape,
        w.escapeUrl,
      );
    },
    text: (node: RichNode) => {
      const data = readMedia(node);
      return data ? (data.title ?? nameFromSrc(data.src)) : "";
    },
    render: (node: RichNode) => {
      const data = readMedia(node);
      const src = safeUrl(data?.src);
      if (!data || !src) return [];
      const poster = tag === "video" ? safeUrl(data.poster, "image") : undefined;
      return [
        el("figure", { class: "fg-rt-media", "data-media": tag }, [
          el(tag, {
            src,
            controls: true,
            preload: tag === "video" ? "metadata" : "none",
            ...(data.title ? { title: data.title } : {}),
            ...(poster ? { poster } : {}),
          }),
          ...(data.title ? [el("figcaption", undefined, [data.title])] : []),
        ]),
      ];
    },
  };
}

export const audio = definePlugin({
  id: "audio",
  name: "Audio",
  description: "A sound with the browser's controls and an optional caption.",
  nodes: { audio: mediaRule("audio") },
  blocks: [
    {
      id: "audio",
      label: "Audio",
      keywords: ["sound", "music", "podcast", "mp3", "recording"],
      icon: "music",
      group: "insert",
    },
  ],
  markdown: { blocks: [kindLinkReader] },
});

export const video = definePlugin({
  id: "video",
  name: "Video",
  description: "A video with the browser's controls, an optional caption and a poster picture.",
  nodes: { video: mediaRule("video") },
  blocks: [
    {
      id: "video",
      label: "Video",
      keywords: ["movie", "clip", "mp4", "film", "recording"],
      icon: "video-02",
      group: "insert",
    },
  ],
  markdown: { blocks: [kindLinkReader] },
});
