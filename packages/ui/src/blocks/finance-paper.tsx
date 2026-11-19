// A printable sheet: A4 or Letter with its margins, a header and a footer that repeat on every
// printed page, page breaks, and the parts of a business document (title block, parties, meta
// table). On screen it is a sheet that fits its container; printed it is the document, nothing else.

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cx } from "../cx";

export const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
} as const;

export type PaperSize = keyof typeof PAPER_SIZES;

/** The size of a sheet in millimetres, turned for landscape. */
export function paperSize(size: PaperSize, landscape = false) {
  const { width, height } = PAPER_SIZES[size];
  return landscape ? { width: height, height: width } : { width, height };
}

export interface PaperProps {
  size?: PaperSize;
  landscape?: boolean;
  /** A CSS length: `20mm`, `0.75in`. Default 18mm. */
  margin?: string;
  /** Repeated at the top of every printed page. */
  header?: ReactNode;
  /** Repeated at the bottom of every printed page. */
  footer?: ReactNode;
  /**
   * `fit` (default): the sheet shrinks to its container on screen, never grows. A number sets the
   * zoom. Printing is always 1.
   */
  zoom?: "fit" | number;
  /** Lines on screen where a page ends. Default `true`. */
  guides?: boolean;
  /** Writes the `@page` rule for the size and margin. Default `true`; one Paper per document. */
  pageRule?: boolean;
  /** Names the sheet. Default "Document". */
  label?: string;
  className?: string;
  children: ReactNode;
}

/** The sheet of a document, laid out in millimetres, with print styles. */
export function Paper({
  size = "A4",
  landscape = false,
  margin = "18mm",
  header,
  footer,
  zoom = "fit",
  guides = true,
  pageRule = true,
  label = "Document",
  className,
  children,
}: PaperProps) {
  const { width, height } = paperSize(size, landscape);
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el || zoom !== "fit" || typeof ResizeObserver === "undefined") return;
    const px = (width * 96) / 25.4;
    const measure = () => setFit(Math.min(1, el.clientWidth / px) || 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [zoom, width]);
  const scale = zoom === "fit" ? fit : zoom;
  const style = {
    "--fg-paper-w": `${width}mm`,
    "--fg-paper-h": `${height}mm`,
    "--fg-paper-m": margin,
    zoom: scale,
  } as CSSProperties;
  return (
    <div className={cx("fg-paper-frame", className)} ref={box}>
      {pageRule ? (
        <style>{`@media print{@page{size:${width}mm ${height}mm;margin:${margin}}}`}</style>
      ) : null}
      <article
        className={cx("fg-paper", guides && "fg-paper-guides")}
        style={style}
        aria-label={label}
      >
        {header ? <header className="fg-paper-head">{header}</header> : null}
        <div className="fg-paper-body">{children}</div>
        {footer ? <footer className="fg-paper-foot">{footer}</footer> : null}
      </article>
    </div>
  );
}

/** Ends the page here when printed; nothing on screen but a dashed rule. */
export function PageBreak() {
  return <div className="fg-paper-break" role="separator" aria-hidden="true" />;
}

export interface DocumentHeaderProps {
  /** `Invoice`, `Quote`, `Purchase order`. */
  title: ReactNode;
  /** The number: `INV-2026-0042`, in mono. */
  number?: ReactNode;
  /** A status or a note beside the title: a badge, `Draft`. */
  status?: ReactNode;
  /** The sender's mark: a logo, a name. */
  brand?: ReactNode;
  className?: string;
}

/** The top of a document: the mark of the sender on one side, the title and number on the other. */
export function DocumentHeader({ title, number, status, brand, className }: DocumentHeaderProps) {
  return (
    <div className={cx("fg-paper-dochead", className)}>
      <div className="fg-paper-brand">{brand}</div>
      <div className="fg-paper-title">
        <h1>{title}</h1>
        {number ? <p className="fg-paper-number">{number}</p> : null}
        {status ? <div className="fg-paper-status">{status}</div> : null}
      </div>
    </div>
  );
}

export interface PartyBlockProps {
  /** `From`, `Bill to`, `Ship to`. */
  label: string;
  name: ReactNode;
  /** The lines of the address, then tax ids and contacts. */
  lines?: ReadonlyArray<ReactNode>;
  className?: string;
}

/** A party of the document: who it is from, who it is for. */
export function PartyBlock({ label, name, lines = [], className }: PartyBlockProps) {
  return (
    <section className={cx("fg-paper-party", className)} aria-label={label}>
      <h2 className="fg-paper-eyebrow">{label}</h2>
      <p className="fg-paper-name">{name}</p>
      {lines.map((line, i) => (
        <p key={i} className="fg-paper-line">
          {line}
        </p>
      ))}
    </section>
  );
}

export interface MetaTableProps {
  rows: ReadonlyArray<{ label: string; value: ReactNode }>;
  /** Names the table. Default "Details". */
  label?: string;
  className?: string;
}

/** The facts of a document in two columns: issue date, due date, reference, terms. */
export function MetaTable({ rows, label = "Details", className }: MetaTableProps) {
  return (
    <dl className={cx("fg-paper-meta", className)} aria-label={label}>
      {rows.map((row) => (
        <div key={row.label} className="fg-paper-metarow">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Prints one element on its own: a hidden frame gets a copy of it and the page's styles, so the
 * app around it stays out of the print. Returns when the dialog was asked for.
 */
export function printPaper(element: HTMLElement, title = "Document"): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.append(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }
  const styles = [...document.querySelectorAll("link[rel=stylesheet], style")]
    .map((n) => n.outerHTML)
    .join("");
  const theme = document.documentElement.getAttribute("data-theme");
  doc.open();
  doc.write(
    `<!doctype html><html${theme ? ` data-theme="${theme}"` : ""}><head><meta charset="utf-8"><title>${title.replace(/</g, "&lt;")}</title>${styles}</head><body class="fg-paper-printing">${element.outerHTML}</body></html>`,
  );
  doc.close();
  const run = () => {
    win.focus();
    win.print();
    setTimeout(() => frame.remove(), 1000);
  };
  if (doc.readyState === "complete") setTimeout(run, 50);
  else frame.addEventListener("load", () => setTimeout(run, 50), { once: true });
}
