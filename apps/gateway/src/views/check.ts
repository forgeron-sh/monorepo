// The views a build carries (D-134): `views/<name>.js` and the chunks they share, path to code. They come
// from CI or from a marketplace's file and are served on the workspace origin, so they are checked
// as the docs are: names, count and size.

const MAX_FILES = 50;
const MAX_FILE = 2 * 1024 * 1024;
const MAX_TOTAL = 8 * 1024 * 1024;
const PATH = /^views\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.js$/;

/** The views as a map, `undefined` when there are none, or why they are refused. */
export function viewsProblem(views: unknown): Record<string, string> | undefined | string {
  if (views === undefined || views === null) return undefined;
  if (typeof views !== "object" || Array.isArray(views)) return "views: a map of path to code.";
  const entries = Object.entries(views as Record<string, unknown>);
  if (entries.length > MAX_FILES) return `views: at most ${MAX_FILES} files.`;
  let total = 0;
  for (const [path, code] of entries) {
    if (!PATH.test(path) || path.includes("..")) return `views: "${path}" is not a view file.`;
    if (typeof code !== "string") return `views: "${path}" is not text.`;
    if (code.length > MAX_FILE) return `views: "${path}" is over ${MAX_FILE} bytes.`;
    total += code.length;
  }
  if (total > MAX_TOTAL) return `views: over ${MAX_TOTAL} bytes in all.`;
  return entries.length === 0 ? undefined : (views as Record<string, string>);
}
