// An embed: a link shown as a bookmark card, with a title, a description and a picture the app
// found for it (`resolveEmbed`, given to the editor; the package makes no request). The static view
// links only safe addresses.
//
// Markdown: `[title](url "embed description=... image=...")`, see `attachment.ts`.

import { definePlugin, type CorePlugin } from "../core/plugin";
import type { RichNode } from "../core/types";
import { el, safeUrl } from "../core/view";
import {
  attachment,
  kindLinkReader,
  kindTitle,
  textAttr,
  upload,
  writeKindLink,
} from "./attachment";
import { audio, video } from "./media";

/** What the app knows about an address: shown on the card. */
export interface EmbedPreview {
  title?: string;
  description?: string;
  /** A picture (an address) for the card. */
  image?: string;
}

/** Asks the app what an address points at. The package makes no request of its own. */
export type ResolveEmbed = (url: string, signal?: AbortSignal) => Promise<EmbedPreview>;

/** The options of the `embed` plugin, given as `pluginOptions.embed`. */
export interface EmbedOptions {
  resolveEmbed?: ResolveEmbed;
}

interface EmbedData {
  url: string;
  title: string | undefined;
  description: string | undefined;
  image: string | undefined;
}

const readEmbed = (node: RichNode): EmbedData | undefined => {
  const url = textAttr(node.attrs?.["url"]);
  if (!url) return undefined;
  const field = (name: string) => textAttr(node.attrs?.[name]);
  return {
    url,
    title: field("title"),
    description: field("description"),
    image: field("image"),
  };
};

/** The host of an address, to show under a card: `example.com`; the address itself when it has none. */
export function hostOf(url: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(url);
  if (!match) return url;
  return (match[1] as string).replace(/^[^@]*@/, "").replace(/^www\./i, "");
}

export const embed = definePlugin({
  id: "embed",
  name: "Embed",
  description: "A link with a preview: a bookmark card with title, description and picture.",
  nodes: {
    embed: {
      markdown: (node, w) => {
        const data = readEmbed(node);
        if (!data) return "";
        return writeKindLink(
          data.title ?? data.url,
          data.url,
          kindTitle("embed", { description: data.description, image: data.image }),
          w.escape,
          w.escapeUrl,
        );
      },
      text: (node) => {
        const data = readEmbed(node);
        return data ? (data.title ?? data.url) : "";
      },
      render: (node) => {
        const data = readEmbed(node);
        if (!data) return [];
        const href = safeUrl(data.url);
        const image = safeUrl(data.image, "image");
        const body = [
          ...(image
            ? [el("img", { class: "fg-rt-embed-image", src: image, alt: "", loading: "lazy" })]
            : []),
          el("span", { class: "fg-rt-embed-text" }, [
            el("span", { class: "fg-rt-embed-title" }, [data.title ?? data.url]),
            ...(data.description
              ? [el("span", { class: "fg-rt-embed-description" }, [data.description])]
              : []),
            el("span", { class: "fg-rt-embed-host" }, [hostOf(data.url)]),
          ]),
        ];
        // A card with an unsafe address keeps what it says but links nowhere.
        return [
          el("div", { class: "fg-rt-embed" }, [
            href
              ? el(
                  "a",
                  { class: "fg-rt-embed-link", href, rel: "noopener noreferrer", target: "_blank" },
                  body,
                )
              : el("span", { class: "fg-rt-embed-link" }, body),
          ]),
        ];
      },
    },
  },
  blocks: [
    {
      id: "embed",
      label: "Embed",
      keywords: ["link", "bookmark", "url", "preview", "website"],
      icon: "link-04",
      group: "insert",
    },
  ],
  markdown: { blocks: [kindLinkReader] },
});

/** The whole family, as core halves: not part of `fullCorePlugins`, an app opts in. */
export const attachmentsCorePlugins: ReadonlyArray<CorePlugin> = [
  upload,
  attachment,
  audio,
  video,
  embed,
];
