// Pages: a reference of the kind `page`, a link to another page of the app, typed with `[[`. Core
// half: how it reads in Markdown (`[Label](ref:page:id)`, the references plugin's convention), in
// plain text and in the static view, where an app-given `href` turns the chip into a link. The app
// provides the search and the address of a page; the editor knows no page.

import { definePlugin } from "../core/plugin";
import type { Reference } from "../core/references";
import { el, safeUrl } from "../core/view";
import { decorateKind, referenceAttrs } from "./references-kit";

export interface PagesCoreOptions {
  /**
   * The address of the page a reference points at, for the static view (`/pages/${ref.id}`). A
   * reference without an address, or with one that is not safe (`javascript:`), stays a chip.
   */
  href?: (ref: Reference) => string | undefined;
}

/** The core half of the pages plugin, for an app that gives an `href`. */
export function pagesPlugin(options: PagesCoreOptions = {}) {
  return definePlugin({
    id: "pages",
    name: "Pages",
    description: "Links to other pages of the app, typed with `[[`.",
    requires: ["references"],
    decorate: decorateKind("page", {
      text: (ref) => ref.label,
      render: (ref, fallback) => {
        const href = safeUrl(options.href?.(ref));
        if (!href) return fallback();
        return [
          el("a", { class: "fg-rt-mention fg-rt-page", href, ...referenceAttrs(ref) }, [ref.label]),
        ];
      },
    }),
  });
}

/** Pages without an address: chips in the static view. */
export const pages = pagesPlugin();
