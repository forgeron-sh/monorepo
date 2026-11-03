import { lstat, readFile, realpath } from "node:fs/promises";
import { extname, isAbsolute, join, normalize, relative, sep } from "node:path";
import {
  DOC_IMAGE_TYPES,
  MAX_FILE,
  MAX_ICON,
  MAX_TOTAL,
  svgProblem,
  type Docs,
} from "@forgeron/manifest";
import { sha256 } from "./fingerprint";

// The tool's documentation for the catalog (docs/console-ux.md, D-056): `README.md` and the images it
// references with a relative path, plus the config's `icon`. What is collected is what a member of the
// workspace will be served, so each file is checked here, and a refusal names the file.

export { MAX_FILE, svgProblem };
const README = "README.md";

interface CollectedAsset {
  path: string;
  type: string;
  size: number;
  hash: string;
  base64: string;
}

/** What the build hands to the deployment: the content, which the manifest only has the hashes of. */
export interface CollectedDocs {
  readme?: string;
  /** The path, among `assets`, of the config's icon. */
  icon?: string;
  assets: CollectedAsset[];
}

const MARKDOWN_IMAGE = /!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^)\s]+))(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
const HTML_IMAGE = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** The image addresses a markdown text references, in order, without the external ones. */
export function imageReferences(markdown: string): string[] {
  // A fenced block shows code: what it contains is not an image of the card.
  const text = markdown.replace(/^(```|~~~)[\s\S]*?^\1/gm, "");
  const found: string[] = [];
  for (const m of text.matchAll(MARKDOWN_IMAGE)) found.push((m[1] ?? m[2])!);
  for (const m of text.matchAll(HTML_IMAGE)) found.push((m[1] ?? m[2])!);
  return found.filter((reference) => reference !== "" && !EXTERNAL.test(reference));
}

const SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  png: (b) => [0x89, 0x50, 0x4e, 0x47].every((v, i) => b[i] === v),
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8,
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8,
  gif: (b) => [0x47, 0x49, 0x46, 0x38].every((v, i) => b[i] === v),
  webp: (b) => [0x52, 0x49, 0x46, 0x46].every((v, i) => b[i] === v) && b[8] === 0x57,
};

/** `docs/a.png` from `./docs/a.png`, `docs/b/../a.png` or `docs%20x.png`; never an address outside `dir`. */
function normalized(file: string, reference: string): string {
  let path = reference.replace(/[?#].*$/, "");
  try {
    path = decodeURIComponent(path);
  } catch {
    throw new Error(`${README}: the image "${reference}" is not a valid address.`);
  }
  if (path.includes("\0") || path.includes("\\") || isAbsolute(path) || path.startsWith("/")) {
    throw new Error(`${file}: "${reference}" must be a relative path inside the tool folder.`);
  }
  const clean = normalize(path).split(sep).join("/");
  if (clean === ".." || clean.startsWith("../")) {
    throw new Error(`${file}: "${reference}" leaves the tool folder.`);
  }
  return clean;
}

async function readInside(dir: string, from: string, path: string, max: number): Promise<Buffer> {
  const absolute = join(dir, path);
  let info;
  try {
    info = await lstat(absolute);
  } catch {
    throw new Error(`${from}: the file "${path}" does not exist.`);
  }
  // A link is followed only if it stays in the tool folder.
  const real = await realpath(absolute);
  const inside = relative(await realpath(dir), real);
  if (inside === ".." || inside.startsWith(`..${sep}`) || isAbsolute(inside)) {
    throw new Error(`${from}: "${path}" is a link that leaves the tool folder.`);
  }
  if (info.isDirectory() || !(info.isFile() || info.isSymbolicLink())) {
    throw new Error(`${from}: "${path}" is not a file.`);
  }
  const content = await readFile(real);
  if (content.length > max) {
    throw new Error(
      `${path}: ${content.length} bytes, over the limit of ${max} bytes for a documentation file.`,
    );
  }
  return content;
}

async function collectImage(
  dir: string,
  from: string,
  path: string,
  max: number,
): Promise<CollectedAsset> {
  const extension = extname(path).slice(1).toLowerCase();
  const type = DOC_IMAGE_TYPES[extension as keyof typeof DOC_IMAGE_TYPES];
  if (!type) {
    throw new Error(
      `${path}: ${from} references it, but only ${Object.keys(DOC_IMAGE_TYPES).join(", ")} images are collected.`,
    );
  }
  const content = await readInside(dir, from, path, max);
  if (extension === "svg") {
    const problem = svgProblem(content.toString("utf8"));
    if (problem) throw new Error(`${path}: this SVG is refused, ${problem}.`);
  } else if (!SIGNATURES[extension]!(content)) {
    throw new Error(`${path}: the content is not a .${extension} image.`);
  }
  return {
    path,
    type,
    size: content.length,
    hash: sha256(content),
    base64: content.toString("base64"),
  };
}

/** The README, its relative images and the icon of the tool folder `dir`. */
export async function collectDocs(dir: string, icon?: string): Promise<CollectedDocs> {
  const assets = new Map<string, CollectedAsset>();
  let readme: string | undefined;
  let total = 0;
  try {
    const content = await readInside(dir, "the tool folder", README, MAX_FILE);
    readme = content.toString("utf8");
    total += content.length;
  } catch (error) {
    if (!(error instanceof Error) || !error.message.endsWith("does not exist.")) throw error;
  }
  let iconPath: string | undefined;
  const wanted: Array<{ from: string; path: string; max: number }> = [];
  for (const reference of imageReferences(readme ?? "")) {
    wanted.push({ from: README, path: normalized(README, reference), max: MAX_FILE });
  }
  if (icon !== undefined) {
    const path = normalized("forgeron.config.ts (icon)", icon);
    if (!/\.(svg|png)$/i.test(path)) {
      throw new Error(`forgeron.config.ts: the icon "${icon}" must be a .svg or a .png file.`);
    }
    iconPath = path;
    wanted.push({ from: "forgeron.config.ts", path, max: MAX_ICON });
  }
  for (const { from, path, max } of wanted) {
    if (assets.has(path)) continue;
    const asset = await collectImage(dir, from, path, max);
    total += asset.size;
    if (total > MAX_TOTAL) {
      throw new Error(
        `${path}: the documentation (README and images) is over ${MAX_TOTAL} bytes in total.`,
      );
    }
    assets.set(path, asset);
  }
  return {
    ...(readme === undefined ? {} : { readme }),
    ...(iconPath === undefined ? {} : { icon: iconPath }),
    assets: [...assets.values()],
  };
}

/** What the manifest keeps of the documentation: the hashes. */
export function docsEntry(docs: CollectedDocs): Docs | undefined {
  if (docs.readme === undefined && docs.assets.length === 0) return undefined;
  return {
    ...(docs.readme === undefined
      ? {}
      : {
          readme: {
            size: Buffer.byteLength(docs.readme),
            hash: sha256(docs.readme),
          },
        }),
    assets: docs.assets.map(({ path, type, size, hash }) => ({ path, type, size, hash })),
  };
}
