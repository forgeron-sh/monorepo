import type { IconManifestEntry, IconRenderOptions } from "@forgeron/icons";

// What the detail view copies and downloads.

export type RasterFormat = "png" | "jpg" | "webp";

const MIME: Record<RasterFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

/** The React snippet for the current settings, only with the props that differ from the defaults. */
export function reactSnippet(entry: IconManifestEntry, options: IconRenderOptions): string {
  const props = [`icon={${entry.export}}`];
  if (options.variant === "duo") props.push(`variant="duo"`);
  if (options.size !== undefined && options.size !== 24) props.push(`size={${options.size}}`);
  if (options.color) props.push(`color="${options.color}"`);
  if (options.variant === "duo" && options.secondaryColor) {
    props.push(`secondaryColor="${options.secondaryColor}"`);
  }
  return [
    `import { ${entry.export} } from "@forgeron/icons";`,
    `import { Icon } from "@forgeron/icons/react";`,
    "",
    `<Icon ${props.join(" ")} />`,
  ].join("\n");
}

export function importSnippet(entry: IconManifestEntry): string {
  return `import { ${entry.export} } from "@forgeron/icons";`;
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * The SVG drawn on a canvas of `size` px, without smoothing, so every pixel of the grid stays a
 * crisp square. A JPEG has no transparency: `background` fills it.
 */
export async function rasterize(
  svg: string,
  size: number,
  format: RasterFormat,
  background: string | null,
): Promise<Blob> {
  const image = new Image();
  image.decoding = "async";
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D canvas.");
  ctx.imageSmoothingEnabled = false;
  const fill = background ?? (format === "jpg" ? "#0a0a0a" : null);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, size, size);
  }
  ctx.drawImage(image, 0, 0, size, size);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`${format} export failed.`))),
      MIME[format],
      0.95,
    ),
  );
}
