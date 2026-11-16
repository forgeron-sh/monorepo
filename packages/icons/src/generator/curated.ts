// What a person decided about an icon, read by the generator over the heuristics of `taxonomy.ts`
// and `describe.ts`. An entry may exist before the icon is drawn.

export interface CuratedMeta {
  /** A category id of `taxonomy.ts`. */
  readonly category?: string;
  /** Extra search tags, added to those derived from the name. */
  readonly labels?: readonly string[];
  readonly description?: string;
  /** Names used for this icon before the package (the site's lab icons), kept as aliases. */
  readonly aliases?: readonly string[];
  /** What the drawing was redrawn after, for inspiration only (never traced). */
  readonly reference?: string;
  /** A third-party brand icon: the trademark notice. */
  readonly trademark?: string;
}

/**
 * Our own names: icons Hugeicons does not have. A drawn icon whose name is not in the Hugeicons
 * snapshot must be listed here, so that a typo in a file name never invents a new icon.
 */
export const OWN_ICONS: readonly string[] = [
  "cloudflare",
  "deploy",
  "forgeron",
  "log",
  "mcp",
  "rollback",
  "warning",
];

export const CURATED: Readonly<Record<string, CuratedMeta>> = {
  anvil: {
    labels: ["forge", "brand", "smith"],
    description: "Anvil with a spark, the symbol of forging a tool.",
  },
  api: {
    labels: ["rest", "endpoint", "interface"],
    description: "API: a REST endpoint per action.",
  },
  bolt: { labels: ["cache", "kv", "fast"], description: "Lightning bolt over a base line." },
  "book-open-01": {
    aliases: ["docs"],
    labels: ["docs", "documentation", "manual", "files"],
    description: "Open book, for documentation.",
  },
  browser: {
    aliases: ["web"],
    labels: ["web", "page", "interface"],
    description: "Browser window with code and a cursor: the web interface.",
  },
  chart: { labels: ["usage", "metrics", "bar"], description: "Bar chart on two axes." },
  "checkmark-square-01": {
    labels: ["done", "test", "passed", "checkbox"],
    description: "Ticked box, for a check that passed.",
  },
  "clock-01": {
    aliases: ["clock"],
    labels: ["schedule", "job", "cron"],
    description: "Wall clock.",
  },
  cloud: { labels: ["hosting", "workers"], description: "Cloud with a signal line." },
  cloudflare: {
    category: "brands",
    labels: ["workers", "edge", "hosting", "platform", "logo"],
    description:
      "The Cloudflare logo mark on a 16-pixel grid: the large cloud and its cut, the small cloud in the secondary tone.",
    reference:
      "logos:cloudflare-icon (Iconify, 2026-11-16): rasterised to 16×16, then redrawn by hand (2026-11-16, docs/icons.md).",
    trademark:
      "Cloudflare and the Cloudflare logo are trademarks of Cloudflare, Inc., used here only to refer to Cloudflare.",
  },
  "command-line": {
    aliases: ["cli"],
    labels: ["cli", "terminal", "shell", "console"],
    description: "Terminal window with a prompt: the command line.",
  },
  database: { labels: ["d1", "sql", "storage"], description: "Database cylinder." },
  deploy: {
    category: "development",
    labels: ["ship", "release", "upload", "publish"],
    description: "Arrow rising from a tray: deploying a version.",
  },
  eye: {
    aliases: ["preview"],
    labels: ["preview", "view", "visible", "watch"],
    description: "Eye, for a preview.",
  },
  forgeron: {
    category: "brands",
    labels: ["logo", "brand", "anvil", "mark"],
    description: "The Forgeron mark: the anvil of the logo on a 12-pixel grid.",
  },
  "git-branch": {
    aliases: ["branch"],
    labels: ["branch", "preview", "version"],
    description: "Branch leaving the main line.",
  },
  "git-fork": {
    reference:
      "Hugeicons `git-fork` (Iconify preview, 2026-11-16): proportions and composition only, redrawn as pixel art.",
    labels: ["branch", "commits"],
    description: "Two branches turning into one stem, with their commits.",
  },
  globe: {
    labels: ["web", "world", "network"],
    description: "Globe: a meridian and the equator.",
  },
  hammer: { labels: ["build", "forge", "tool"], description: "Hammer, for building." },
  "key-01": {
    aliases: ["key"],
    labels: ["secret", "password", "credential"],
    description: "Key, for a secret.",
  },
  "layers-01": {
    aliases: ["layers"],
    labels: ["stack", "layers", "levels"],
    description: "Stacked layers: a solid top sheet and the edges of two more.",
  },
  lock: { labels: ["sso", "private", "secure"], description: "Closed padlock." },
  log: {
    category: "development",
    labels: ["logs", "audit", "queue", "lines"],
    description: "Lines of a log, one of them highlighted.",
  },
  mcp: {
    category: "ai",
    labels: ["model context protocol", "claude", "agent", "connector"],
    description: "Plug of the Model Context Protocol: tools used from an AI assistant.",
  },
  rollback: {
    category: "development",
    labels: ["revert", "undo", "previous version"],
    description: "Arrow turning back: rolling back to the previous version.",
  },
  "search-01": {
    aliases: ["search"],
    labels: ["find", "lookup"],
    description: "Magnifying glass.",
  },
  "settings-01": {
    reference:
      "Hugeicons `settings-01` (Iconify preview, 2026-11-16): proportions and composition only, redrawn as pixel art.",
    aliases: ["settings"],
    labels: ["gear", "preferences", "configuration"],
    description: "Cog: eight short teeth on a two-pixel rim around a large hub hole, for settings.",
  },
  "shield-01": {
    aliases: ["shield"],
    labels: ["security", "protection", "validated"],
    description: "Shield with a check mark.",
  },
  table: { labels: ["rows", "columns", "data"], description: "Table with a header and rows." },
  "tick-01": {
    reference:
      "Hugeicons `tick-01` (Iconify preview, 2026-11-16): proportions and composition only, redrawn as pixel art.",
    labels: ["done", "valid", "ok"],
    description: "Check mark.",
  },
  "user-group": {
    aliases: ["team"],
    labels: ["team", "members", "people"],
    description: "Two people, for a team.",
  },
  warning: {
    category: "alerts",
    labels: ["alert", "caution", "danger", "triangle"],
    description: "Warning triangle with an exclamation mark.",
  },
  "arrow-down-01": {
    reference:
      "Hugeicons `arrow-down-01` (Iconify preview, 2026-11-16): proportions and composition only, redrawn as pixel art.",
    labels: ["chevron", "expand", "menu"],
    description: "Chevron pointing down.",
  },
  "arrow-left-01": {
    reference:
      "Hugeicons `arrow-left-01` (Iconify preview, 2026-11-16): proportions and composition only, redrawn as pixel art.",
    labels: ["chevron", "back", "previous"],
    description: "Chevron pointing left.",
  },
  "arrow-right-01": {
    reference:
      "Hugeicons `arrow-right-01` (Iconify preview, 2026-11-16): proportions and composition only, redrawn as pixel art.",
    labels: ["chevron", "next", "open"],
    description: "Chevron pointing right.",
  },
};
