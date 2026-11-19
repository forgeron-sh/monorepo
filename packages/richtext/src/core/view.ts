// The static view's vocabulary: the tree a document renders to (`ViewNode`), a helper to build it,
// and the URL check every renderer shares. No ProseMirror, no React, no DOM.

export type ViewAttrs = Record<string, string | number | boolean | undefined>;

export interface ViewElement {
  tag: string;
  attrs?: ViewAttrs;
  children?: ViewNode[];
}

/** A text string or an element. */
export type ViewNode = string | ViewElement;

/** An element of the static tree. */
export const el = (tag: string, attrs?: ViewAttrs, children?: ViewNode[]): ViewElement => ({
  tag,
  ...(attrs ? { attrs } : {}),
  ...(children ? { children } : {}),
});

/** Only schemes that cannot run code: anything else loses its URL. */
export function safeUrl(url: unknown, kind: "link" | "image" = "link"): string | undefined {
  if (typeof url !== "string") return undefined;
  const value = url.trim();
  if (!value) return undefined;
  if (value.startsWith("//") || value.includes("\\")) return undefined;
  if (/^(\/|#|\.\/|\.\.\/)/.test(value)) return value;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value)?.[1]?.toLowerCase();
  if (!scheme) return /^[^:]*$/.test(value) ? value : undefined;
  if (kind === "image") {
    if (scheme === "http" || scheme === "https") return value;
    return /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(value) ? value : undefined;
  }
  return ["http", "https", "mailto", "tel"].includes(scheme) ? value : undefined;
}

/** `example.com` becomes `https://example.com`; a scheme that can run code gives `undefined`. */
export function normalizeLink(input: string): string | undefined {
  const value = input.trim();
  if (!value) return undefined;
  const withScheme = /^([a-z][a-z0-9+.-]*:|\/|#)/i.test(value) ? value : `https://${value}`;
  return safeUrl(withScheme);
}

/** A string attribute, whatever the stored type. */
export const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v : v == null ? undefined : String(v);
