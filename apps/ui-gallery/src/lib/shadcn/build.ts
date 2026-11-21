// The shadcn registry of `@forgeron/ui` (D-156), built from the package sources at build time.
//
// Each gallery entry (atom, block, hook, marketing block) becomes one registry item: the files that
// define its names and every file they import, copied as they are under `components/forgeron/`, so
// the relative imports keep working in the user's project. Our private packages (`@forgeron/font`,
// `@forgeron/shaders`, `@forgeron/icons`) are vendored under `components/forgeron/vendor/`, one file
// per icon. The shared part (the `cn` helper and the stylesheet) is the `forgeron` item that every
// other item depends on. Pure: the sources come in as text, the items go out as JSON.

/** A source file, its path relative to `packages/` (`ui/src/button.tsx`). */
export type Sources = ReadonlyMap<string, string>;

export interface Entry {
  slug: string;
  name: string;
  summary: string;
  /** The names exported by `@forgeron/ui` (`"Button"`, `"type ButtonProps"`). */
  imports: ReadonlyArray<string>;
  kind: "atom" | "block" | "hook";
}

/** An icon of `@forgeron/icons`, as plain data. */
interface IconData {
  name: string;
  style: string;
  grid: number;
  rows: ReadonlyArray<string>;
}

export interface BuildInput {
  sources: Sources;
  entries: ReadonlyArray<Entry>;
  /** Every runtime export of `@forgeron/icons` (icons are objects, helpers are functions). */
  icons: Readonly<Record<string, unknown>>;
  /** `name@version` of the npm packages the sources may import. */
  versions: Readonly<Record<string, string>>;
  /** Font files referenced by `tokens.css`, as data URLs, by file name. */
  fonts: Readonly<Record<string, string>>;
  /** Where the items are served, ending with `/` (`https://ui.forgeron.sh/r/`). */
  base: string;
}

interface RegistryFile {
  path: string;
  type: "registry:ui" | "registry:hook" | "registry:lib" | "registry:file";
  target: string;
  content: string;
}

interface RegistryItem {
  $schema: string;
  name: string;
  type: "registry:ui" | "registry:block" | "registry:hook" | "registry:theme" | "registry:style";
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryFile[];
  cssVars?: {
    theme?: Record<string, string>;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  docs?: string;
}

const ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";
const REGISTRY_SCHEMA = "https://ui.shadcn.com/schema/registry.json";
export const BASE_ITEM = "forgeron";
export const THEME_ITEM = "forgeron-theme";
/** Where the files land in the user's project (`src/` is added by shadcn when the project has one). */
const TARGET_ROOT = "components/forgeron";

// ---------------------------------------------------------------------------------------------
// Tokens: ours become `--fg-*`, read from the shadcn variables of the host project.
// ---------------------------------------------------------------------------------------------

/** The tokens declared on `:root` in `tokens.css`, with their (dark) values. */
export function tokensOf(tokensCss: string, selector = ":root"): Map<string, string> {
  const escaped = selector.replace(/[[\]"().*+?^$|\\]/g, "\\$&");
  const block = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(tokensCss);
  const out = new Map<string, string>();
  if (!block) return out;
  for (const m of block[1]!.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) out.set(m[1]!, m[2]!.trim());
  return out;
}

/**
 * How each colour and type token of ours reads the host's shadcn theme. A token not listed keeps its
 * own value (spacing, borders, motion). The fallbacks keep a host theme without our extras working.
 */
const FROM_SHADCN: Readonly<Record<string, string>> = {
  bg: "var(--background)",
  "bg-raised": "var(--muted)",
  "bg-sunk": "var(--sunk, var(--background))",
  line: "var(--border)",
  "line-strong": "var(--line-strong, var(--input))",
  ink: "var(--foreground)",
  "ink-muted": "var(--muted-foreground)",
  "ink-dim": "var(--ink-dim, color-mix(in oklab, var(--muted-foreground) 70%, var(--background)))",
  accent: "var(--primary)",
  "accent-ink": "var(--primary-foreground)",
  focus: "var(--ring)",
  success: "var(--success, #2fa866)",
  "success-subtle":
    "var(--success-subtle, color-mix(in oklab, var(--fg-success) 14%, var(--background)))",
  warning: "var(--warning, #d48a0b)",
  "warning-subtle":
    "var(--warning-subtle, color-mix(in oklab, var(--fg-warning) 14%, var(--background)))",
  danger: "var(--destructive)",
  "danger-subtle":
    "var(--destructive-subtle, color-mix(in oklab, var(--destructive) 14%, var(--background)))",
  scrim: "var(--scrim, rgb(0 0 0 / 0.6))",
  "shadow-pop": "var(--shadow-pop, 0 8px 24px rgb(0 0 0 / 0.25))",
  "font-sans": "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
  "font-mono": 'var(--font-mono, ui-monospace, "SFMono-Regular", monospace)',
  "radius-none": "max(0px, calc(var(--radius, 0px) - 2px))",
};

/** The shadcn theme, Forgeron's values: what `forgeron-theme` writes into the host's CSS. */
export function shadcnTheme(tokens: ReadonlyMap<string, string>): Record<string, string> {
  const t = (name: string) => {
    const v = tokens.get(name);
    if (v === undefined) throw new Error(`tokens.css has no --${name}`);
    return v;
  };
  return {
    background: t("bg"),
    foreground: t("ink"),
    card: t("bg-raised"),
    "card-foreground": t("ink"),
    popover: t("bg-raised"),
    "popover-foreground": t("ink"),
    primary: t("accent"),
    "primary-foreground": t("accent-ink"),
    secondary: t("bg-raised"),
    "secondary-foreground": t("ink"),
    muted: t("bg-raised"),
    "muted-foreground": t("ink-muted"),
    accent: t("bg-raised"),
    "accent-foreground": t("ink"),
    destructive: t("danger"),
    border: t("line"),
    input: t("line-strong"),
    ring: t("accent"),
    "chart-1": t("accent"),
    "chart-2": t("success"),
    "chart-3": t("warning"),
    "chart-4": t("danger"),
    "chart-5": t("ink-muted"),
    sidebar: t("bg-sunk"),
    "sidebar-foreground": t("ink"),
    "sidebar-primary": t("accent"),
    "sidebar-primary-foreground": t("accent-ink"),
    "sidebar-accent": t("bg-raised"),
    "sidebar-accent-foreground": t("ink"),
    "sidebar-border": t("line"),
    "sidebar-ring": t("accent"),
    // Ours, beyond the shadcn set (they also give `bg-sunk`, `text-ink-dim`… in Tailwind).
    sunk: t("bg-sunk"),
    "line-strong": t("line-strong"),
    "ink-dim": t("ink-dim"),
    success: t("success"),
    "success-subtle": t("success-subtle"),
    warning: t("warning"),
    "warning-subtle": t("warning-subtle"),
    "destructive-subtle": t("danger-subtle"),
  };
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const tokenPattern = (names: Iterable<string>) =>
  [...names]
    .sort((a, b) => b.length - a.length)
    .map(escapeRe)
    .join("|");

/** `--bg` → `--fg-bg` for our tokens, in CSS. Other custom properties are left alone. */
export function prefixTokensInCss(css: string, names: Iterable<string>): string {
  const re = new RegExp(`(?<![\\w-])--(${tokenPattern(names)})(?![\\w-])`, "g");
  return css
    .replace(re, "--fg-$1")
    .replaceAll(':root[data-theme="light"]', ":root:not(.dark)")
    .replaceAll(':root:not([data-theme="light"])', ":root.dark");
}

/** `var(--bg)` and `"--bg"` → `--fg-bg` in TypeScript (inline styles, `getPropertyValue`). */
export function prefixTokensInCode(code: string, names: Iterable<string>): string {
  const re = new RegExp(`(var\\(\\s*|["'\`])--(${tokenPattern(names)})(?![\\w-])`, "g");
  return code.replace(re, "$1--fg-$2");
}

// ---------------------------------------------------------------------------------------------
// Modules: names, imports, closure.
// ---------------------------------------------------------------------------------------------

const dirname = (p: string) => p.slice(0, Math.max(0, p.lastIndexOf("/")));

function joinPath(dir: string, rel: string): string {
  const out: string[] = dir ? dir.split("/") : [];
  for (const part of rel.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}

/** The relative specifier from the file `from` to the module `to` (`./cx`, `../vendor/icons/src/react`). */
export function relativeSpecifier(from: string, to: string): string {
  const a = dirname(from).split("/").filter(Boolean);
  const b = to.replace(/\.(tsx?|jsx?)$/, "").split("/");
  let i = 0;
  while (i < a.length && i < b.length - 1 && a[i] === b[i]) i++;
  const up = a.length - i;
  const rest = b.slice(i).join("/");
  return up === 0 ? `./${rest}` : `${"../".repeat(up)}${rest}`;
}

/** The file a relative specifier points at, or undefined. */
function resolveRelative(sources: Sources, from: string, spec: string): string | undefined {
  const base = joinPath(dirname(from), spec);
  for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
    if (sources.has(c)) return c;
  }
  return undefined;
}

/** `@forgeron/<pkg>[/<sub>]` → the file it exports. `@forgeron/icons` (root) is handled apart. */
const PACKAGE_ENTRIES: Readonly<Record<string, string>> = {
  "@forgeron/ui": "ui/src/index.ts",
  "@forgeron/font": "font/src/index.ts",
  "@forgeron/shaders": "shaders/src/index.ts",
  "@forgeron/shaders/dom": "shaders/src/dom/index.ts",
  "@forgeron/icons/react": "icons/src/react.tsx",
  "@forgeron/icons/render": "icons/src/render.ts",
};

const ICONS = "@forgeron/icons";
const ICON_TYPES = "icons/src/types.ts";
const ICON_RENDER = "icons/src/render.ts";
const glyphPath = (name: string) => `icons/glyphs/${name}.ts`;
const ICONS_ALL = "icons/glyphs/index.ts";

/** Specifiers in a module: static imports and re-exports, side-effect and dynamic imports. */
export function specifiersOf(code: string): string[] {
  const out = new Set<string>();
  const patterns = [
    /^\s*(?:import|export)\b[^'";]*?\bfrom\s*(["'])([^"'\n]+)\1/gm,
    /^\s*import\s*(["'])([^"'\n]+)\1/gm,
    /\bimport\(\s*(["'])([^"'\n]+)\1\s*\)/g,
  ];
  for (const re of patterns) for (const m of code.matchAll(re)) out.add(m[2]!);
  return [...out];
}

const npmName = (spec: string) =>
  spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]!;

/** Names a module defines itself (not re-exported from elsewhere). */
function ownExports(code: string): Set<string> {
  const out = new Set<string>();
  for (const m of code.matchAll(
    /\bexport\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|interface|type|enum|abstract\s+class)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    out.add(m[1]!);
  }
  for (const m of code.matchAll(/\bexport\s+(?:type\s+)?\{([^}]*)\}(?!\s*from)/g)) {
    for (const part of m[1]!.split(",")) {
      const name = part
        .replace(/^\s*type\s+/, "")
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) out.add(name);
    }
  }
  return out;
}

/** The file that defines `name`, following the re-exports from `file`. */
export function definingFile(
  sources: Sources,
  file: string,
  name: string,
  seen = new Set<string>(),
): string | undefined {
  if (seen.has(file)) return undefined;
  seen.add(file);
  const code = sources.get(file);
  if (code === undefined) return undefined;
  if (ownExports(code).has(name)) return file;
  for (const m of code.matchAll(/\bexport\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    for (const part of m[1]!.split(",")) {
      const [orig, alias] = part
        .replace(/^\s*type\s+/, "")
        .split(/\s+as\s+/)
        .map((s) => s.trim());
      if ((alias ?? orig) !== name || !orig) continue;
      const target = m[2]!.startsWith(".") ? resolveRelative(sources, file, m[2]!) : undefined;
      return target ? definingFile(sources, target, orig, seen) : undefined;
    }
  }
  for (const m of code.matchAll(/\bexport\s+\*\s+from\s*["']([^"']+)["']/g)) {
    if (!m[1]!.startsWith(".")) continue;
    const target = resolveRelative(sources, file, m[1]!);
    const found = target && definingFile(sources, target, name, seen);
    if (found) return found;
  }
  return undefined;
}

interface IconUse {
  glyphs: Set<string>;
  helpers: boolean;
  all: boolean;
}

/** Rewrites the imports of `@forgeron/icons` (root) into one import per glyph, and the types. */
function rewriteIconImports(
  code: string,
  file: string,
  icons: BuildInput["icons"],
  typeNames: ReadonlySet<string>,
  renderNames: ReadonlySet<string>,
  use: IconUse,
): string {
  const to = (target: string) => relativeSpecifier(distPath(file), distPath(target));
  let out = code.replace(
    /\b(import|export)\s+(type\s+)?\{([^}]*)\}\s*from\s*(["'])@forgeron\/icons\4;?/g,
    (_all, kw: string, typeOnly: string | undefined, list: string) => {
      const lines: string[] = [];
      const typesList: string[] = [];
      const renderList: string[] = [];
      for (const raw of list.split(",")) {
        const part = raw.trim();
        if (!part) continue;
        const isType = Boolean(typeOnly) || part.startsWith("type ");
        const bare = part.replace(/^type\s+/, "");
        const name = bare.split(/\s+as\s+/)[0]!.trim();
        const value = icons[name];
        if (value && typeof value === "object" && "rows" in value) {
          use.glyphs.add(name);
          lines.push(`${kw} ${isType ? "type " : ""}{ ${bare} } from "${to(glyphPath(name))}";`);
        } else if (renderNames.has(name)) {
          use.helpers = true;
          renderList.push(isType && !typeOnly ? `type ${bare}` : bare);
        } else if (typeNames.has(name)) {
          typesList.push(bare);
        } else {
          throw new Error(`${file}: unknown export of @forgeron/icons: ${name}`);
        }
      }
      if (typesList.length) {
        use.helpers = true;
        lines.push(`${kw} type { ${typesList.join(", ")} } from "${to(ICON_TYPES)}";`);
      }
      if (renderList.length) {
        lines.push(
          `${kw} ${typeOnly ? "type " : ""}{ ${renderList.join(", ")} } from "${to(ICON_RENDER)}";`,
        );
      }
      return lines.join("\n");
    },
  );
  out = out.replace(/\bexport\s+\*\s+from\s*(["'])@forgeron\/icons\1;?/g, () => {
    use.all = true;
    return `export * from "${to(ICONS_ALL)}";`;
  });
  return out;
}

/** Where a source lands, relative to `components/forgeron/`. */
function distPath(source: string): string {
  if (source.startsWith("ui/src/")) return source.slice("ui/src/".length);
  // shadcn drops the first `src/` of a target: a vendored package's `src/` becomes `lib/`.
  return `vendor/${source.replace(/^([^/]+)\/src\//, "$1/lib/")}`;
}

const BLOCK_CSS = /^ui\/src\/blocks\/([a-z0-9-]+)\.css$/;

/** The stylesheet of a block group a file belongs to (`blocks/lists-board.tsx` → `blocks/lists.css`). */
function blockCssOf(sources: Sources, file: string): string | undefined {
  const m = /^ui\/src\/blocks\/([a-z0-9-]+)\.tsx$/.exec(file);
  if (!m) return undefined;
  let best: string | undefined;
  for (const path of sources.keys()) {
    const group = BLOCK_CSS.exec(path)?.[1];
    if (!group) continue;
    if ((m[1] === group || m[1]!.startsWith(`${group}-`)) && (!best || path.length > best.length)) {
      best = path;
    }
  }
  return best;
}

/** Files shipped by the `forgeron` item, not repeated in the others. */
const SHARED = new Set(["ui/src/cx.ts"]);

interface Built {
  files: Map<string, string>;
  dependencies: Set<string>;
}

/** The files an item ships (dist path → content) and its npm dependencies. */
function collect(
  input: BuildInput,
  roots: ReadonlyArray<string>,
  tokens: ReadonlySet<string>,
): Built {
  const { sources, icons, versions } = input;
  const typeNames = ownExports(sources.get(ICON_TYPES) ?? "");
  const renderNames = ownExports(sources.get(ICON_RENDER) ?? "");
  const files = new Map<string, string>();
  const dependencies = new Set<string>();
  const use: IconUse = { glyphs: new Set(), helpers: false, all: false };
  const queue = [...roots];
  const seen = new Set<string>();
  while (queue.length) {
    const file = queue.shift()!;
    if (seen.has(file) || SHARED.has(file)) continue;
    seen.add(file);
    const code = sources.get(file);
    if (code === undefined) throw new Error(`missing source ${file}`);
    if (file.endsWith(".css") || file.endsWith(".json")) {
      files.set(distPath(file), file.endsWith(".css") ? prefixTokensInCss(code, tokens) : code);
      continue;
    }
    let out = code;
    for (const spec of specifiersOf(code)) {
      if (spec.startsWith(".")) {
        const target = resolveRelative(sources, file, spec);
        if (!target) throw new Error(`${file}: cannot resolve ${spec}`);
        queue.push(target);
      } else if (spec.startsWith("@forgeron/")) {
        if (spec === ICONS) continue;
        const target = PACKAGE_ENTRIES[spec];
        if (!target) throw new Error(`${file}: ${spec} cannot be vendored`);
        queue.push(target);
        out = out.replaceAll(
          new RegExp(`(["'])${escapeRe(spec)}\\1`, "g"),
          `"${relativeSpecifier(distPath(file), distPath(target))}"`,
        );
      } else {
        const pkg = npmName(spec);
        if (pkg === "react" || pkg === "react-dom") continue;
        const version = versions[pkg];
        if (!version) throw new Error(`${file}: no pinned version for ${pkg}`);
        dependencies.add(`${pkg}@${version}`);
      }
    }
    out = rewriteIconImports(out, file, icons, typeNames, renderNames, use);
    out = prefixTokensInCode(out, tokens);
    if (file.endsWith(".tsx")) {
      const css = blockCssOf(sources, file);
      if (css) {
        queue.push(css);
        out = `import "${relativeSpecifier(distPath(file), distPath(css))}";\n${out}`;
      }
      if (!/^\s*["']use client["']/.test(out)) out = `"use client";\n\n${out}`;
    }
    files.set(distPath(file), out);
  }
  const glyphs = use.all ? Object.keys(icons).filter((k) => isGlyph(icons[k])) : [...use.glyphs];
  if (glyphs.length) {
    files.set(distPath(ICON_TYPES), sources.get(ICON_TYPES)!);
  }
  if (use.helpers) {
    for (const f of [ICON_TYPES, ICON_RENDER]) files.set(distPath(f), sources.get(f)!);
  }
  for (const name of glyphs) {
    files.set(distPath(glyphPath(name)), glyphModule(name, icons[name] as IconData));
  }
  if (use.all) {
    files.set(
      distPath(ICONS_ALL),
      `${glyphs
        .sort()
        .map((n) => `export { ${n} } from "./${n}";`)
        .join("\n")}\nexport * from "../lib/render";\nexport type * from "../lib/types";\n`,
    );
    files.set(distPath(ICON_RENDER), sources.get(ICON_RENDER)!);
  }
  return { files, dependencies };
}

const isGlyph = (v: unknown) => Boolean(v && typeof v === "object" && "rows" in v);

function glyphModule(exportName: string, icon: IconData): string {
  const data = { name: icon.name, style: icon.style, grid: icon.grid, rows: icon.rows };
  return `import type { PixelIcon } from "../lib/types";\n\nexport const ${exportName}: PixelIcon = ${JSON.stringify(data)};\n`;
}

// ---------------------------------------------------------------------------------------------
// The items.
// ---------------------------------------------------------------------------------------------

const fileType = (path: string, kind: Entry["kind"]): RegistryFile["type"] =>
  path.endsWith(".css") || path.endsWith(".json")
    ? "registry:file"
    : kind === "hook" && /^hooks\//.test(path)
      ? "registry:hook"
      : "registry:ui";

const toFiles = (files: Map<string, string>, kind: Entry["kind"]): RegistryFile[] =>
  [...files.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, content]) => ({
      path: `registry/forgeron/${path}`,
      type: fileType(path, kind),
      target: `${TARGET_ROOT}/${path}`,
      content,
    }));

/** The stylesheet every item shares: our fonts, our tokens on shadcn's, the atoms and components. */
function baseStylesheet(input: BuildInput, tokens: ReadonlyMap<string, string>): string {
  const { sources, fonts } = input;
  const read = (p: string) => {
    const code = sources.get(p);
    if (code === undefined) throw new Error(`missing source ${p}`);
    return code;
  };
  const tokensCss = read("ui/tokens/tokens.css");
  const fontFaces = [...tokensCss.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) =>
    m[0].replace(/url\("\.\/fonts\/([^"]+)"\)/g, (_all, file: string) => {
      const data = fonts[file];
      if (!data) throw new Error(`tokens.css: no data for font ${file}`);
      return `url("${data}")`;
    }),
  );
  const decls = [...tokens.entries()]
    .map(
      ([name, value]) =>
        `    --fg-${name}: ${FROM_SHADCN[name] ?? prefixTokensInCss(value, tokens.keys())};`,
    )
    .join("\n");
  const typeClasses = tokensCss
    .slice(tokensCss.indexOf("}", tokensCss.indexOf(':root[data-theme="light"]')) + 1)
    .trim();
  const sheets = [
    "ui/src/atoms.css",
    "ui/src/components.css",
    "ui/src/fields.css",
    "ui/src/shaders/shaders.css",
    ...[
      "forms",
      "display",
      "disclosure",
      "overlays",
      "data",
      "menus",
      "fields",
      "charts",
      "diff",
      "icon-picker",
      "status",
      "timeline",
      "tree",
      "access",
      "collection",
      "sortable",
      "shell",
    ].map((g) => `ui/src/parts-${g}.css`),
  ];
  const names = [...tokens.keys()];
  const body = [typeClasses, ...sheets.map(read)]
    .map((css) => prefixTokensInCss(css, names))
    .join("\n\n");
  return `/* Forgeron UI for shadcn: generated from @forgeron/ui (ui.forgeron.sh). Our tokens are --fg-*,
   read from your shadcn variables (--background, --primary, --border, --radius…): change those to
   restyle every Forgeron component. \`npx shadcn add ${input.base}${THEME_ITEM}.json\` gives the
   Forgeron values. Everything is in the components layer, so your Tailwind utilities win. */

${fontFaces.join("\n\n")}

@layer components {
  :root,
  .dark {
${decls}
  }

${body
  .split("\n")
  .map((l) => (l ? `  ${l}` : l))
  .join("\n")}
}
`;
}

const CX_SOURCE = "ui/src/cx.ts";

export interface Registry {
  index: {
    $schema: string;
    name: string;
    homepage: string;
    items: Array<
      Omit<RegistryItem, "$schema" | "files"> & { files: Array<Omit<RegistryFile, "content">> }
    >;
  };
  items: Map<string, RegistryItem>;
}

export function buildRegistry(input: BuildInput): Registry {
  const tokensCss = input.sources.get("ui/tokens/tokens.css");
  if (!tokensCss) throw new Error("missing ui/tokens/tokens.css");
  const dark = tokensOf(tokensCss);
  const light = tokensOf(tokensCss, ':root[data-theme="light"]');
  const names = new Set(dark.keys());
  const items = new Map<string, RegistryItem>();
  const baseUrl = `${input.base}${BASE_ITEM}.json`;

  const cx = input.sources.get(CX_SOURCE);
  if (!cx) throw new Error(`missing ${CX_SOURCE}`);
  items.set(BASE_ITEM, {
    $schema: ITEM_SCHEMA,
    name: BASE_ITEM,
    type: "registry:ui",
    title: "Forgeron UI",
    description:
      "What every Forgeron component shares: the cn helper and the stylesheet (Forgeron Sans, the tokens read from your shadcn theme, the atoms).",
    files: toFiles(
      new Map([
        ["cx.ts", `import "./forgeron.css";\n\n${prefixTokensInCode(cx, names)}`],
        ["forgeron.css", baseStylesheet(input, dark)],
      ]),
      "atom",
    ),
    docs: `Forgeron components follow your shadcn theme. For the Forgeron look (ember on near-black, sharp corners): npx shadcn add ${input.base}${THEME_ITEM}.json`,
  });

  const lightTheme = shadcnTheme(new Map([...dark, ...light]));
  items.set(THEME_ITEM, {
    $schema: ITEM_SCHEMA,
    name: THEME_ITEM,
    type: "registry:theme",
    title: "Forgeron theme",
    description:
      "The Forgeron palette in the shadcn variables: ember primary, near-black or paper background, square corners.",
    cssVars: {
      light: { ...lightTheme, radius: "0rem" },
      dark: shadcnTheme(dark),
    },
  });

  for (const entry of input.entries) {
    if (items.has(entry.slug)) throw new Error(`duplicate registry item ${entry.slug}`);
    const roots = new Set<string>();
    for (const raw of entry.imports) {
      const name = raw.replace(/^type\s+/, "");
      const file = definingFile(input.sources, PACKAGE_ENTRIES["@forgeron/ui"]!, name);
      if (!file) throw new Error(`${entry.slug}: @forgeron/ui does not export ${name}`);
      roots.add(file);
    }
    const built = collect(input, [...roots], names);
    items.set(entry.slug, {
      $schema: ITEM_SCHEMA,
      name: entry.slug,
      type:
        entry.kind === "hook"
          ? "registry:hook"
          : entry.kind === "block"
            ? "registry:block"
            : "registry:ui",
      title: entry.name,
      description: entry.summary,
      ...(built.dependencies.size ? { dependencies: [...built.dependencies].sort() } : {}),
      registryDependencies: [baseUrl],
      files: toFiles(built.files, entry.kind),
    });
  }

  const index: Registry["index"] = {
    $schema: REGISTRY_SCHEMA,
    name: "forgeron",
    homepage: input.base.replace(/r\/$/, ""),
    items: [...items.values()].map(({ $schema: _s, files, ...rest }) => ({
      ...rest,
      files: (files ?? []).map(({ content: _c, ...file }) => file),
    })),
  };
  return { index, items };
}

/**
 * The import lines of an entry once installed with shadcn: `@/components/forgeron/<file>`, one line
 * per file that defines the names.
 */
export function shadcnImports(sources: Sources, imports: ReadonlyArray<string>): string[] {
  const byFile = new Map<string, string[]>();
  for (const raw of imports) {
    const name = raw.replace(/^type\s+/, "");
    const file = definingFile(sources, PACKAGE_ENTRIES["@forgeron/ui"]!, name);
    if (!file) throw new Error(`@forgeron/ui does not export ${name}`);
    byFile.set(file, [...(byFile.get(file) ?? []), raw]);
  }
  return [...byFile.entries()].map(
    ([file, names]) =>
      `import { ${names.join(", ")} } from "@/${TARGET_ROOT}/${distPath(file).replace(/\.tsx?$/, "")}";`,
  );
}
