// What a tool's documentation may hold (D-058). The compiler checks it at build, and the platform checks
// it again at deployment: a build is a request body, so nothing it says about itself is trusted.

export const MAX_FILE = 1024 * 1024;
export const MAX_TOTAL = 5 * 1024 * 1024;
export const MAX_ICON = 128 * 1024;

/** Why an SVG is refused, or `undefined`: scripts, event handlers and anything fetched are out. */
export function svgProblem(svg: string): string | undefined {
  if (/<\s*script\b/i.test(svg)) return "it holds a <script>";
  if (/<\s*(foreignObject|iframe|embed|object|animate|set)\b/i.test(svg)) {
    return "it holds an element that can run or load code (foreignObject, iframe, embed, object, animate, set)";
  }
  if (/\son[a-z]+\s*=/i.test(svg)) return "it holds an event handler (an on… attribute)";
  if (/javascript\s*:/i.test(svg)) return "it holds a javascript: address";
  if (/<!\s*(ENTITY|DOCTYPE)/i.test(svg)) return "it declares a DOCTYPE or an entity";
  if (/@import/i.test(svg)) return "it imports a stylesheet";
  for (const m of svg.matchAll(/\b(?:xlink:)?href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    if (!(m[1] ?? m[2] ?? "").trim().startsWith("#")) return "it references an external address";
  }
  for (const m of svg.matchAll(/url\(\s*(['"]?)([^)]*)\1\s*\)/gi)) {
    if (!m[2]!.trim().startsWith("#")) return "it references an external address";
  }
  return undefined;
}

/** Whether `path` stays inside the tool folder: relative, `/`-separated, no `..`, no NUL. */
export function isSafeDocPath(path: string): boolean {
  return (
    path !== "" &&
    path.length <= 200 &&
    !path.includes("\\") &&
    !path.includes("\0") &&
    !path.startsWith("/") &&
    !path.split("/").some((part) => part === ".." || part === "." || part === "")
  );
}
