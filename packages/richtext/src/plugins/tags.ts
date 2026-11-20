// Tags: a reference of the kind `tag`, an inline `#tag` chip. Core half: Markdown
// (`[label](ref:tag:id)`, the references plugin's convention), plain text (`#label`) and the static
// view. The app provides the candidates and may let the writer create a tag from what was typed.

import { definePlugin } from "../core/plugin";
import type { Reference } from "../core/references";
import { el, safeUrl } from "../core/view";
import { decorateKind, referenceAttrs } from "./references-kit";

export interface TagsCoreOptions {
  /** Where a tag leads in the static view (`/tags/${ref.id}`); without it, a chip. */
  href?: (ref: Reference) => string | undefined;
}

/** The core half of the tags plugin. */
export function tagsPlugin(options: TagsCoreOptions = {}) {
  return definePlugin({
    id: "tags",
    name: "Tags",
    description: "Inline tags, typed with `#`.",
    requires: ["references"],
    decorate: decorateKind("tag", {
      text: (ref) => `#${ref.label}`,
      render: (ref) => {
        const href = safeUrl(options.href?.(ref));
        return [
          el(
            href ? "a" : "span",
            {
              class: "fg-rt-mention fg-rt-tag",
              ...(href ? { href } : {}),
              ...referenceAttrs(ref),
            },
            [`#${ref.label}`],
          ),
        ];
      },
    }),
  });
}

export const tags = tagsPlugin();
