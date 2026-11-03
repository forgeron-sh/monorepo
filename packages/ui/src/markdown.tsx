import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyBlock } from "./copy-block";
import { cx } from "./cx";

// Renders a README. Safe because of what it is built from, not because of a filter on its output:
// react-markdown builds React elements (no `dangerouslySetInnerHTML`), raw HTML is never parsed (no
// `rehype-raw`), and every address goes through `safeHref` or `safeImage` below, which keep only what
// is listed. A README is written by whoever owns the tool: it is shown to every member.

export interface MarkdownProps {
  /** The markdown text. */
  source: string;
  /**
   * The images of the tool's bundle: the path a README writes (`docs/a.png`) to the address that serves
   * it. An image whose path is not a key here (another origin, a `data:` address, a path that climbs
   * out) is not drawn.
   */
  images: Readonly<Record<string, string>>;
  className?: string;
}

const ANCHOR_PREFIX = "md-";

/** An address a link may keep: web, mail, or an anchor inside the README (rewritten to its heading's id). */
export function safeHref(href: string | undefined): { href: string; external: boolean } | null {
  if (!href) return null;
  const value = href.trim();
  if (value.startsWith("#"))
    return value.length > 1
      ? { href: `#${ANCHOR_PREFIX}${value.slice(1)}`, external: false }
      : null;
  // Control characters hide a scheme (`java\tscript:`); a scheme-relative address is another origin.
  if (/[\p{Cc}\s]/u.test(value) || value.startsWith("//")) return null;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value);
  if (!scheme) return null; // a relative path points at a file of the repository: nothing to open here
  const name = scheme[1]!.toLowerCase();
  if (name === "mailto") return { href: value, external: true };
  if (name === "http" || name === "https") {
    try {
      return { href: new URL(value).href, external: true };
    } catch {
      return null;
    }
  }
  return null;
}

/** The address of an image of the bundle, or null: only a relative path that `images` lists. */
export function safeImage(
  src: string | undefined,
  images: Readonly<Record<string, string>>,
): string | null {
  if (!src) return null;
  const value = src.trim();
  if (/[\p{Cc}\s\\?#]/u.test(value) || value.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(value))
    return null;
  const parts: string[] = [];
  for (const part of value.split("/")) {
    let segment: string;
    try {
      segment = decodeURIComponent(part);
    } catch {
      return null;
    }
    if (segment === "" || segment === ".") continue;
    if (segment === ".." || segment.includes("/") || segment.includes("\\")) return null;
    parts.push(segment);
  }
  const key = parts.join("/");
  return Object.hasOwn(images, key) ? images[key]! : null;
}

const textOf = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
};

const slugOf = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");

function buildComponents(images: Readonly<Record<string, string>>): Components {
  const seen = new Map<string, number>();
  const heading =
    (Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") =>
    ({ children }: { children?: ReactNode }) => {
      const base = slugOf(textOf(children)) || "section";
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const id = `${ANCHOR_PREFIX}${count === 0 ? base : `${base}-${count}`}`;
      return (
        <Tag id={id} className="fg-md-heading">
          {children}
          <a href={`#${id}`} className="fg-md-anchor" aria-label={`Link to ${textOf(children)}`}>
            #
          </a>
        </Tag>
      );
    };

  return {
    h1: heading("h1"),
    h2: heading("h2"),
    h3: heading("h3"),
    h4: heading("h4"),
    h5: heading("h5"),
    h6: heading("h6"),
    a: ({ href, children }) => {
      const safe = safeHref(href);
      if (!safe) return <span className="fg-md-nolink">{children}</span>;
      if (!safe.external) return <a href={safe.href}>{children}</a>;
      return (
        <a href={safe.href} target="_blank" rel="noopener noreferrer" className="fg-md-external">
          {children}
          <span className="fg-sr"> (opens in a new tab)</span>
          <span aria-hidden="true" className="fg-md-ext-mark">
            ↗
          </span>
        </a>
      );
    },
    img: ({ src, alt }) => {
      const url = typeof src === "string" ? safeImage(src, images) : null;
      if (!url || !alt?.trim())
        return (
          <span className="fg-md-noimage">
            {!alt?.trim() ? "Image without a description" : `Image not shown: ${alt}`}
          </span>
        );
      return (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="fg-md-img"
        />
      );
    },
    pre: ({ children }) => {
      const code = Children.toArray(children).find(isValidElement) as
        | ReactElement<{ className?: string; children?: ReactNode }>
        | undefined;
      const text = textOf(code?.props.children).replace(/\n$/, "");
      const language = /language-([\w+-]+)/.exec(code?.props.className ?? "")?.[1];
      return <CopyBlock value={text} label={language ?? "Code"} className="fg-md-code" />;
    },
    code: ({ children }) => <code className="fg-md-inline">{children}</code>,
    table: ({ children }) => (
      <div className="fg-md-table" tabIndex={0} role="region" aria-label="Table">
        <table>{children}</table>
      </div>
    ),
    input: ({ checked }) => (
      <input
        type="checkbox"
        checked={!!checked}
        disabled
        readOnly
        aria-label={checked ? "Done" : "Not done"}
      />
    ),
  };
}

/** A README as markdown: headings with anchors, lists, task lists, tables, code with a copy button, links, images of the bundle. */
export function Markdown({ source, images, className }: MarkdownProps) {
  return (
    <div className={cx("fg-md", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={buildComponents(images)}
        // The default transform would let `data:` through on images; ours decide in the components.
        urlTransform={(url) => url}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
