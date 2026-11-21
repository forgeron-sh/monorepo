// Exports in the browser: the SVG of the core with the page's own token values, images inlined
// as data URLs (an SVG drawn as an image loads nothing), then drawn on a 2D canvas for the PNG.
// Nothing leaves the page: the files are handed to the browser's download.

import { exportSvg, type ExportResult } from "../core/export";
import type { DrawItem } from "../core/types";
import { inlineImages } from "../plugins/editor/media";

/** Reads a token's value on an element of the page. */
export const tokenReader = (el: Element | null) => {
  if (!el || typeof getComputedStyle !== "function") return undefined;
  const style = getComputedStyle(el);
  return (token: string) => style.getPropertyValue(token) || undefined;
};

export interface BrowserExportOptions {
  ids: Iterable<string>;
  /** The element whose tokens give the colours: the editor. */
  from?: Element | null;
  background?: string | null;
}

/** The SVG of a frame or a selection, with the images inside it. */
export async function exportSvgDocument(
  items: ReadonlyArray<DrawItem>,
  { ids, from, background = "bg" }: BrowserExportOptions,
): Promise<ExportResult | null> {
  const wanted = [...ids];
  const inlined = await inlineImages(items);
  const resolve = tokenReader(from ?? null);
  return exportSvg(inlined, { ids: wanted, background, ...(resolve ? { resolve } : {}) });
}

/** Draws an SVG document on a canvas at `scale` and gives the PNG. */
export function svgToPng(result: ExportResult, scale = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(result.bounds.w * scale));
      canvas.height = Math.max(1, Math.round(result.bounds.h * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No 2D canvas."));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No PNG."))), "image/png");
    };
    img.onerror = () => reject(new Error("The SVG did not load."));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.svg)}`;
  });
}

/** Hands a file to the browser's download. */
export function download(data: Blob | string, name: string, type = "image/svg+xml") {
  const blob = typeof data === "string" ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A file name from a frame's name or "selection". */
export const fileName = (name: string, ext: string) =>
  `${
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "board"
  }.${ext}`;
