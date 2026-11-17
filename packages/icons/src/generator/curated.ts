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
  "add-circle-fill",
  "add-square-fill",
  "airtable",
  "alert-circle-fill",
  "alert-diamond-fill",
  "alert-square-fill",
  "archive-02-fill",
  "asana",
  "attio",
  "book-02-fill",
  "bookmark-01-fill",
  "bookmark-add-01-fill",
  "bookmark-check-01-fill",
  "bookmark-remove-01-fill",
  "briefcase-01-fill",
  "bug-01-fill",
  "bug-02-fill",
  "bus-01-fill",
  "calculator-fill",
  "calendar-03-fill",
  "camera-01-fill",
  "cancel-circle-fill",
  "cancel-square-fill",
  "checkmark-badge-01-fill",
  "checkmark-circle-01-fill",
  "checkmark-square-01-fill",
  "checkmark-square-02-fill",
  "circle-arrow-down-01-fill",
  "circle-arrow-left-01-fill",
  "circle-arrow-right-01-fill",
  "circle-arrow-up-01-fill",
  "clock-02-fill",
  "cloudflare",
  "comment-01-fill",
  "comment-add-01-fill",
  "confluence",
  "contact-01-fill",
  "crown-fill",
  "deploy",
  "diamond-fill",
  "dice-fill",
  "dollar-circle-fill",
  "door-01-fill",
  "download-square-01-fill",
  "euro-circle-fill",
  "favourite-fill",
  "file-01-fill",
  "first-aid-kit-fill",
  "flag-01-fill",
  "floppy-disk-fill",
  "folder-01-fill",
  "folder-open-fill",
  "forgeron",
  "heart-check-fill",
  "heart-fill",
  "help-circle-fill",
  "help-square-fill",
  "home-01-fill",
  "id-fill",
  "information-circle-fill",
  "information-square-fill",
  "intercom",
  "jira",
  "leaf-01-fill",
  "linear",
  "location-01-fill",
  "lock-fill",
  "log",
  "mail-01-fill",
  "mail-02-fill",
  "mcp",
  "message-01-fill",
  "mountain-fill",
  "notification-01-fill",
  "notification-02-fill",
  "password-validation-fill",
  "pause-circle-fill",
  "pine-tree-fill",
  "play-circle-fill",
  "play-fill",
  "radio-button-fill",
  "radio-fill",
  "remove-circle-fill",
  "remove-square-fill",
  "rocket-01-fill",
  "rollback",
  "sad-01-fill",
  "salesforce",
  "shield-01-fill",
  "shield-key-fill",
  "shield-user-fill",
  "shirt-01-fill",
  "smart-phone-01-fill",
  "smile-fill",
  "square-arrow-up-01-fill",
  "star-fill",
  "sticky-note-01-fill",
  "stop-circle-fill",
  "tag-01-fill",
  "user-account-fill",
  "user-circle-fill",
  "user-fill",
  "warning",
  "zendesk",
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
    reference:
      "Hugeicons `checkmark-square-01` (Iconify preview, 2026-11-17): composition only, redrawn as pixel art on 2026-11-17.",
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
    reference:
      "Hugeicons `git-branch` (Iconify preview, 2026-11-17): composition only, redrawn as pixel art on 2026-11-17.",
    aliases: ["branch"],
    labels: ["branch", "preview", "version"],
    description: "Branch leaving the main line.",
  },
  "git-fork": {
    reference:
      "Hugeicons `git-fork` (Iconify preview, 2026-11-16): proportions and composition only, redrawn as pixel art.",
    labels: ["branch", "commits"],
    description: "Two branches joining at right angles into their origin commit.",
  },
  github: {
    category: "brands",
    labels: ["git", "repository", "source", "octocat", "logo"],
    description: "The GitHub mark: the Octocat cut out of a round disc.",
    reference:
      "simple-icons:github (Iconify, 2026-11-17): rasterised to 16×16, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "GitHub and the Octocat logo are trademarks of GitHub, Inc., used here only to refer to GitHub.",
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
  "minus-sign": {
    reference:
      "Hugeicons `minus-sign` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["collapse", "close", "subtract"],
    description: "Minus sign: the bar of the plus sign, for a collapse toggle.",
  },
  mcp: {
    category: "ai",
    labels: ["model context protocol", "claude", "agent", "connector"],
    description: "Plug of the Model Context Protocol: tools used from an AI assistant.",
  },
  "plus-sign": {
    reference:
      "Hugeicons `plus-sign` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["add", "expand", "open"],
    description: "Plus sign: two crossing bars, for an expand toggle.",
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
  "arrow-up-01": {
    reference:
      "Hugeicons `arrow-up-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["chevron", "collapse", "up"],
    description: "Chevron pointing up.",
  },
  "calendar-03": {
    reference:
      "Hugeicons `calendar-03` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["date", "schedule", "day"],
    description: "Calendar page with a few days marked.",
  },
  "cancel-01": {
    reference:
      "Hugeicons `cancel-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["close", "dismiss", "remove", "x"],
    description: "Cross, to close or dismiss.",
  },
  "copy-01": {
    reference:
      "Hugeicons `copy-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["duplicate", "clipboard"],
    description: "Two overlapping sheets, to copy.",
  },
  "delete-02": {
    reference:
      "Hugeicons `delete-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["trash", "bin", "remove"],
    description: "Bin, to delete.",
  },
  "download-01": {
    reference:
      "Hugeicons `download-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["save", "export", "get"],
    description: "Arrow down into a tray.",
  },
  "edit-02": {
    reference:
      "Hugeicons `edit-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["pencil", "write", "modify"],
    description: "Pencil, to edit.",
  },
  "file-01": {
    reference:
      "Hugeicons `file-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["document", "page", "sheet"],
    description: "Sheet with a folded corner.",
  },
  filter: {
    reference:
      "Hugeicons `filter` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["funnel", "refine", "narrow"],
    description: "Funnel, to filter a list.",
  },
  "folder-01": {
    reference:
      "Hugeicons `folder-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["directory", "files"],
    description: "Folder.",
  },
  "home-01": {
    reference:
      "Hugeicons `home-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["house", "start", "dashboard"],
    description: "House, the home page.",
  },
  "information-circle": {
    reference:
      "Hugeicons `information-circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["info", "help", "about"],
    description: "Letter i in a ring.",
  },
  "link-01": {
    reference:
      "Hugeicons `link-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["url", "chain", "hyperlink"],
    description: "Two links joined, a hyperlink.",
  },
  "logout-01": {
    reference:
      "Hugeicons `logout-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["sign out", "exit", "leave"],
    description: "Arrow leaving a door frame, to sign out.",
  },
  "mail-01": {
    reference:
      "Hugeicons `mail-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["email", "message", "envelope"],
    description: "Envelope.",
  },
  "menu-01": {
    reference:
      "Hugeicons `menu-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["hamburger", "navigation", "list"],
    description: "Three bars, a menu.",
  },
  "more-horizontal": {
    reference:
      "Hugeicons `more-horizontal` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["ellipsis", "options", "actions"],
    description: "Three dots, more actions.",
  },
  "notification-01": {
    reference:
      "Hugeicons `notification-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bell", "alert", "notify"],
    description: "Bell, notifications.",
  },
  star: {
    reference:
      "Hugeicons `star` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["favourite", "favorite", "rating"],
    description: "Five-pointed star.",
  },
  "upload-01": {
    reference:
      "Hugeicons `upload-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["send", "import", "put"],
    description: "Arrow up out of a tray.",
  },
  user: {
    reference:
      "Hugeicons `user` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["person", "account", "profile", "member"],
    description: "One person.",
  },
  "alert-circle": {
    reference:
      "Hugeicons `alert-circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["error", "attention", "exclamation"],
    description: "Exclamation mark in a ring.",
  },
  "arrow-down-02": {
    reference:
      "Hugeicons `arrow-down-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["down", "bottom", "lower"],
    description: "Arrow pointing down.",
  },
  "arrow-left-02": {
    reference:
      "Hugeicons `arrow-left-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["back", "previous", "left"],
    description: "Arrow pointing left.",
  },
  "arrow-right-02": {
    reference:
      "Hugeicons `arrow-right-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["next", "forward", "right"],
    description: "Arrow pointing right.",
  },
  "arrow-up-02": {
    reference:
      "Hugeicons `arrow-up-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["up", "top", "raise"],
    description: "Arrow pointing up.",
  },
  "arrow-up-right-01": {
    reference:
      "Hugeicons `arrow-up-right-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["external", "open", "link"],
    description: "Arrow pointing up and right, to open elsewhere.",
  },
  "bookmark-01": {
    reference:
      "Hugeicons `bookmark-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["save", "later", "mark"],
    description: "Bookmark ribbon.",
  },
  "cancel-circle": {
    reference:
      "Hugeicons `cancel-circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["error", "close", "failed"],
    description: "Cross in a ring.",
  },
  "checkmark-circle-01": {
    reference:
      "Hugeicons `checkmark-circle-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["success", "done", "valid"],
    description: "Check mark in a ring.",
  },
  "grid-view": {
    reference:
      "Hugeicons `grid-view` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["grid", "tiles", "dashboard"],
    description: "Four squares, a grid view.",
  },
  heart: {
    reference:
      "Hugeicons `heart` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["like", "love", "favourite"],
    description: "Heart.",
  },
  "help-circle": {
    reference:
      "Hugeicons `help-circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["question", "support", "faq"],
    description: "Question mark in a ring.",
  },
  "image-01": {
    reference:
      "Hugeicons `image-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["picture", "photo", "media"],
    description: "Picture with a sun and peaks.",
  },
  "location-01": {
    reference:
      "Hugeicons `location-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["pin", "map", "place"],
    description: "Map pin.",
  },
  "lock-open": {
    reference:
      "Hugeicons `lock-open` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["unlock", "unlocked", "open"],
    description: "Open padlock.",
  },
  "message-01": {
    reference:
      "Hugeicons `message-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["chat", "comment", "bubble"],
    description: "Speech bubble.",
  },
  "moon-02": {
    reference:
      "Hugeicons `moon-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["dark", "theme", "night"],
    description: "Crescent moon, the dark theme.",
  },
  "more-vertical": {
    reference:
      "Hugeicons `more-vertical` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["ellipsis", "options", "kebab"],
    description: "Three stacked dots, more actions.",
  },
  pause: {
    reference:
      "Hugeicons `pause` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["stop", "hold", "video"],
    description: "Two bars, pause.",
  },
  play: {
    reference:
      "Hugeicons `play` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["start", "run", "video"],
    description: "Play triangle.",
  },
  refresh: {
    reference:
      "Hugeicons `refresh` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["reload", "sync", "update"],
    description: "Two arrows in a circle, to refresh.",
  },
  "sidebar-left": {
    reference:
      "Hugeicons `sidebar-left` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["panel", "layout", "navigation"],
    description: "Window with a left panel.",
  },
  "sun-01": {
    reference:
      "Hugeicons `sun-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["light", "theme", "day"],
    description: "Sun, the light theme.",
  },
  "view-off": {
    reference:
      "Hugeicons `view-off` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["hide", "hidden", "invisible"],
    description: "Eye struck through, to hide.",
  },
  "arrow-up-down": {
    reference:
      "Hugeicons `arrow-up-down` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["sort", "order", "swap"],
    description: "Arrows up and down, to sort.",
  },
  "building-01": {
    reference:
      "Hugeicons `building-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["company", "office", "organisation"],
    description: "Building.",
  },
  "camera-01": {
    reference:
      "Hugeicons `camera-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["photo", "picture", "capture"],
    description: "Camera.",
  },
  clipboard: {
    reference:
      "Hugeicons `clipboard` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["paste", "notes", "task"],
    description: "Clipboard.",
  },
  "credit-card": {
    reference:
      "Hugeicons `credit-card` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["card", "payment", "billing"],
    description: "Bank card.",
  },
  "dashboard-square-01": {
    reference:
      "Hugeicons `dashboard-square-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["dashboard", "panels", "overview"],
    description: "Four panels, a dashboard.",
  },
  "flag-01": {
    reference:
      "Hugeicons `flag-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["report", "mark", "milestone"],
    description: "Flag on a pole.",
  },
  gift: {
    reference:
      "Hugeicons `gift` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["present", "reward", "offer"],
    description: "Gift box.",
  },
  "git-merge": {
    reference:
      "Hugeicons `git-merge` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["merge", "branch", "join"],
    description: "Branch joining the main line.",
  },
  "git-pull-request": {
    reference:
      "Hugeicons `git-pull-request` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["pull request", "review", "merge request"],
    description: "Branch proposed back to the main line.",
  },
  "maximize-01": {
    reference:
      "Hugeicons `maximize-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["fullscreen", "expand", "enlarge"],
    description: "Arrows out to the corners, to maximise.",
  },
  "mic-01": {
    reference:
      "Hugeicons `mic-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["microphone", "audio", "voice"],
    description: "Microphone.",
  },
  "minimize-01": {
    reference:
      "Hugeicons `minimize-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["exit fullscreen", "shrink", "collapse"],
    description: "Arrows in to the centre, to minimise.",
  },
  "pie-chart": {
    reference:
      "Hugeicons `pie-chart` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["chart", "share", "analytics"],
    description: "Pie chart.",
  },
  printer: {
    reference:
      "Hugeicons `printer` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["print", "paper"],
    description: "Printer.",
  },
  "shopping-cart-01": {
    reference:
      "Hugeicons `shopping-cart-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["cart", "basket", "buy"],
    description: "Shopping cart.",
  },
  "volume-high": {
    reference:
      "Hugeicons `volume-high` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["sound", "audio", "speaker"],
    description: "Speaker with sound waves.",
  },
  "wifi-01": {
    reference:
      "Hugeicons `wifi-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["wireless", "network", "connection"],
    description: "Wi-Fi signal.",
  },
  "alert-circle-fill": {
    reference:
      "Filled variant of our own `alert-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "alert"],
    description: "Filled alert circle, its inner symbol cut out.",
  },
  "bookmark-01-fill": {
    reference: "Filled variant of our own `bookmark-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bookmark"],
    description: "Filled bookmark, its inner symbol cut out.",
  },
  "calendar-03-fill": {
    reference: "Filled variant of our own `calendar-03`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "calendar"],
    description: "Filled calendar 03, its inner symbol cut out.",
  },
  "camera-01-fill": {
    reference: "Filled variant of our own `camera-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "camera"],
    description: "Filled camera, its inner symbol cut out.",
  },
  "cancel-circle-fill": {
    reference:
      "Filled variant of our own `cancel-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cancel"],
    description: "Filled cancel circle, its inner symbol cut out.",
  },
  "checkmark-circle-01-fill": {
    reference:
      "Filled variant of our own `checkmark-circle-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "checkmark"],
    description: "Filled checkmark circle, its inner symbol cut out.",
  },
  "checkmark-square-01-fill": {
    reference:
      "Filled variant of our own `checkmark-square-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "checkmark"],
    description: "Filled checkmark square, its inner symbol cut out.",
  },
  "file-01-fill": {
    reference: "Filled variant of our own `file-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "file"],
    description: "Filled file, its inner symbol cut out.",
  },
  "flag-01-fill": {
    reference: "Filled variant of our own `flag-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "flag"],
    description: "Filled flag, its inner symbol cut out.",
  },
  "folder-01-fill": {
    reference: "Filled variant of our own `folder-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "folder"],
    description: "Filled folder, its inner symbol cut out.",
  },
  "heart-fill": {
    reference: "Filled variant of our own `heart`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "heart"],
    description: "Filled heart, its inner symbol cut out.",
  },
  "help-circle-fill": {
    reference: "Filled variant of our own `help-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "help"],
    description: "Filled help circle, its inner symbol cut out.",
  },
  "home-01-fill": {
    reference: "Filled variant of our own `home-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "home"],
    description: "Filled home, its inner symbol cut out.",
  },
  "information-circle-fill": {
    reference:
      "Filled variant of our own `information-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "information"],
    description: "Filled information circle, its inner symbol cut out.",
  },
  "location-01-fill": {
    reference: "Filled variant of our own `location-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "location"],
    description: "Filled location, its inner symbol cut out.",
  },
  "mail-01-fill": {
    reference: "Filled variant of our own `mail-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "mail"],
    description: "Filled mail, its inner symbol cut out.",
  },
  "message-01-fill": {
    reference: "Filled variant of our own `message-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "message"],
    description: "Filled message, its inner symbol cut out.",
  },
  "notification-01-fill": {
    reference:
      "Filled variant of our own `notification-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "notification"],
    description: "Filled notification, its inner symbol cut out.",
  },
  "play-fill": {
    reference: "Filled variant of our own `play`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "play"],
    description: "Filled play, its inner symbol cut out.",
  },
  "shield-01-fill": {
    reference: "Filled variant of our own `shield-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "shield"],
    description: "Filled shield, its inner symbol cut out.",
  },
  "star-fill": {
    reference: "Filled variant of our own `star`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "star"],
    description: "Filled star, its inner symbol cut out.",
  },
  "user-fill": {
    reference: "Filled variant of our own `user`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "user"],
    description: "Filled user, its inner symbol cut out.",
  },
  "archive-01": {
    reference:
      "Hugeicons `archive-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["archive", "store", "box"],
    description: "Archive box.",
  },
  "briefcase-01": {
    reference:
      "Hugeicons `briefcase-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["work", "job", "business"],
    description: "Briefcase.",
  },
  "bug-01": {
    reference:
      "Hugeicons `bug-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bug", "issue", "debug"],
    description: "Bug.",
  },
  bulb: {
    reference:
      "Hugeicons `bulb` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["idea", "tip", "light"],
    description: "Light bulb, an idea.",
  },
  code: {
    reference:
      "Hugeicons `code` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["source", "developer", "brackets"],
    description: "Angle brackets around a slash, code.",
  },
  cpu: {
    reference:
      "Hugeicons `cpu` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["processor", "chip", "compute"],
    description: "Processor chip.",
  },
  "drag-drop-vertical": {
    reference:
      "Hugeicons `drag-drop-vertical` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["drag", "handle", "reorder"],
    description: "Drag handle, two columns of dots.",
  },
  hourglass: {
    reference:
      "Hugeicons `hourglass` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["wait", "pending", "time"],
    description: "Hourglass, waiting.",
  },
  inbox: {
    reference:
      "Hugeicons `inbox` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["inbox", "messages", "tray"],
    description: "Inbox tray.",
  },
  "list-view": {
    reference:
      "Hugeicons `list-view` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["list", "items", "bullets"],
    description: "Bulleted list.",
  },
  "qr-code": {
    reference:
      "Hugeicons `qr-code` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["scan", "code", "share"],
    description: "QR code.",
  },
  "server-stack-01": {
    reference:
      "Hugeicons `server-stack-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["server", "hosting", "infrastructure"],
    description: "Two stacked server units.",
  },
  sparkles: {
    reference:
      "Hugeicons `sparkles` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["ai", "magic", "new"],
    description: "Sparkles, for AI or something new.",
  },
  "text-align-left": {
    reference:
      "Hugeicons `text-align-left` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["text", "align", "paragraph"],
    description: "Lines aligned left.",
  },
  "lock-fill": {
    reference: "Filled variant of our own `lock`, drawn by hand on 2026-11-17.",
    labels: ["filled", "solid", "lock"],
    description: "Filled padlock, its keyhole cut out.",
  },
  "award-01": {
    reference:
      "Hugeicons `award-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["medal", "award", "badge"],
    description: "Medal on ribbons.",
  },
  bank: {
    reference:
      "Hugeicons `bank` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bank", "finance", "institution"],
    description: "Bank building.",
  },
  "battery-full": {
    reference:
      "Hugeicons `battery-full` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["battery", "charge", "power"],
    description: "Full battery.",
  },
  "battery-low": {
    reference:
      "Hugeicons `battery-low` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["battery", "charge", "power"],
    description: "Low battery.",
  },
  "car-01": {
    reference:
      "Hugeicons `car-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["car", "vehicle", "parking"],
    description: "Car seen from the front.",
  },
  "coffee-01": {
    reference:
      "Hugeicons `coffee-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["coffee", "break", "drink"],
    description: "Cup of coffee.",
  },
  compass: {
    reference:
      "Hugeicons `compass` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["explore", "direction", "navigation"],
    description: "Compass.",
  },
  computer: {
    reference:
      "Hugeicons `computer` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["monitor", "screen", "desktop"],
    description: "Monitor on a stand.",
  },
  crop: {
    reference:
      "Hugeicons `crop` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["crop", "trim", "resize"],
    description: "Crop frame.",
  },
  fire: {
    reference:
      "Hugeicons `fire` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["hot", "trending", "flame"],
    description: "Flame.",
  },
  headphones: {
    reference:
      "Hugeicons `headphones` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["audio", "music", "listen"],
    description: "Headphones.",
  },
  "invoice-01": {
    reference:
      "Hugeicons `invoice-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["invoice", "bill", "receipt"],
    description: "Invoice.",
  },
  keyboard: {
    reference:
      "Hugeicons `keyboard` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["typing", "keys", "input"],
    description: "Keyboard.",
  },
  laptop: {
    reference:
      "Hugeicons `laptop` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["computer", "notebook", "device"],
    description: "Laptop.",
  },
  "layout-01": {
    reference:
      "Hugeicons `layout-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["layout", "template", "page"],
    description: "Page layout with header and sidebar.",
  },
  "money-01": {
    reference:
      "Hugeicons `money-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["money", "cash", "banknote"],
    description: "Banknote.",
  },
  "mouse-01": {
    reference:
      "Hugeicons `mouse-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["mouse", "pointer", "click"],
    description: "Computer mouse.",
  },
  "music-note-01": {
    reference:
      "Hugeicons `music-note-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["music", "song", "audio"],
    description: "Two beamed notes.",
  },
  percent: {
    reference:
      "Hugeicons `percent` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["percent", "discount", "rate"],
    description: "Percent sign.",
  },
  pin: {
    reference:
      "Hugeicons `pin` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["pin", "attach", "fix"],
    description: "Push pin.",
  },
  "quote-up": {
    reference:
      "Hugeicons `quote-up` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["quote", "citation", "text"],
    description: "Opening quotation marks.",
  },
  "redo-02": {
    reference:
      "Hugeicons `redo-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["redo", "forward", "repeat"],
    description: "Arrow turning forward, to redo.",
  },
  scissor: {
    reference:
      "Hugeicons `scissor` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["cut", "scissors", "trim"],
    description: "Scissors.",
  },
  "shopping-bag-01": {
    reference:
      "Hugeicons `shopping-bag-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bag", "shop", "purchase"],
    description: "Shopping bag.",
  },
  "smart-phone-01": {
    reference:
      "Hugeicons `smart-phone-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["phone", "mobile", "device"],
    description: "Smartphone.",
  },
  "target-01": {
    reference:
      "Hugeicons `target-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["goal", "aim", "objective"],
    description: "Target.",
  },
  "text-align-center": {
    reference:
      "Hugeicons `text-align-center` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["text", "align", "centre"],
    description: "Lines centred.",
  },
  "text-align-right": {
    reference:
      "Hugeicons `text-align-right` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["text", "align", "right"],
    description: "Lines aligned right.",
  },
  "text-bold": {
    reference:
      "Hugeicons `text-bold` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bold", "format", "text"],
    description: "Bold letter B.",
  },
  "text-italic": {
    reference:
      "Hugeicons `text-italic` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["italic", "format", "text"],
    description: "Italic letter I.",
  },
  trophy: {
    reference:
      "Hugeicons `trophy` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["win", "prize", "achievement"],
    description: "Trophy.",
  },
  truck: {
    reference:
      "Hugeicons `truck` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["delivery", "shipping", "lorry"],
    description: "Lorry.",
  },
  "tv-01": {
    reference:
      "Hugeicons `tv-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["television", "screen", "media"],
    description: "Television.",
  },
  umbrella: {
    reference:
      "Hugeicons `umbrella` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["protection", "insurance", "rain"],
    description: "Umbrella.",
  },
  "undo-02": {
    reference:
      "Hugeicons `undo-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["undo", "back", "revert"],
    description: "Arrow turning back, to undo.",
  },
  "video-01": {
    reference:
      "Hugeicons `video-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["video", "record", "camera"],
    description: "Video camera.",
  },
  "volume-low": {
    reference:
      "Hugeicons `volume-low` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["sound", "quiet", "audio"],
    description: "Speaker with one wave, low volume.",
  },
  "volume-mute-01": {
    reference:
      "Hugeicons `volume-mute-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["mute", "silent", "sound off"],
    description: "Speaker struck by a cross, muted.",
  },
  "wallet-01": {
    reference:
      "Hugeicons `wallet-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["wallet", "payment", "money"],
    description: "Wallet.",
  },
  "smart-phone-01-fill": {
    reference:
      "Filled variant of our own `smart-phone-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "smart"],
    description: "Filled smartphone, its inner symbol cut out.",
  },
  "briefcase-01-fill": {
    reference:
      "Filled variant of our own `briefcase-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "briefcase"],
    description: "Filled briefcase, its inner symbol cut out.",
  },
  "bug-01-fill": {
    reference: "Filled variant of our own `bug-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bug"],
    description: "Filled bug, its inner symbol cut out.",
  },
  "activity-01": {
    reference:
      "Hugeicons `activity-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["pulse", "activity", "monitoring"],
    description: "Pulse line.",
  },
  "airplane-01": {
    reference:
      "Hugeicons `airplane-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["plane", "travel", "flight"],
    description: "Aeroplane.",
  },
  anchor: {
    reference:
      "Hugeicons `anchor` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["anchor", "port", "stable"],
    description: "Anchor.",
  },
  "bar-chart": {
    reference:
      "Hugeicons `bar-chart` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["chart", "statistics", "bars"],
    description: "Bar chart.",
  },
  "binary-code": {
    reference:
      "Hugeicons `binary-code` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["binary", "data", "bits"],
    description: "Binary digits.",
  },
  "chart-increase": {
    reference:
      "Hugeicons `chart-increase` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["growth", "trend", "increase"],
    description: "Rising line chart.",
  },
  crown: {
    reference:
      "Hugeicons `crown` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["premium", "king", "best"],
    description: "Crown.",
  },
  "flask-conical": {
    reference:
      "Hugeicons `flask-conical` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["lab", "experiment", "beta"],
    description: "Flask.",
  },
  "game-controller-01": {
    reference:
      "Hugeicons `game-controller-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["game", "play", "gamepad"],
    description: "Game controller.",
  },
  "git-commit": {
    reference:
      "Hugeicons `git-commit` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["commit", "version", "history"],
    description: "Commit on a line.",
  },
  "git-compare": {
    reference:
      "Hugeicons `git-compare` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["compare", "diff", "branches"],
    description: "Two branches pointing at each other, to compare.",
  },
  hashtag: {
    reference:
      "Hugeicons `hashtag` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["hash", "channel", "tag"],
    description: "Hash sign.",
  },
  "loading-03": {
    reference:
      "Hugeicons `loading-03` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["loading", "spinner", "wait"],
    description: "Spinner of dots.",
  },
  "login-01": {
    reference:
      "Hugeicons `login-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["sign in", "enter", "log in"],
    description: "Arrow entering a door frame, to sign in.",
  },
  news: {
    reference:
      "Hugeicons `news` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["newspaper", "article", "press"],
    description: "Newspaper.",
  },
  "notification-off-01": {
    reference:
      "Hugeicons `notification-off-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["mute", "silent", "bell off"],
    description: "Bell struck through, notifications off.",
  },
  "pine-tree": {
    reference:
      "Hugeicons `pine-tree` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["tree", "nature", "forest"],
    description: "Pine tree.",
  },
  "radio-button": {
    reference:
      "Hugeicons `radio-button` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["option", "select", "choice"],
    description: "Radio button, selected.",
  },
  "sad-01": {
    reference:
      "Hugeicons `sad-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["sad", "face", "emoji"],
    description: "Sad face.",
  },
  "share-08": {
    reference:
      "Hugeicons `share-08` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["share", "network", "connect"],
    description: "Three connected nodes, to share.",
  },
  "sliders-horizontal": {
    reference:
      "Hugeicons `sliders-horizontal` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["settings", "adjust", "controls"],
    description: "Two sliders.",
  },
  smile: {
    reference:
      "Hugeicons `smile` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["happy", "face", "emoji"],
    description: "Smiling face.",
  },
  snow: {
    reference:
      "Hugeicons `snow` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["snowflake", "cold", "winter"],
    description: "Snowflake.",
  },
  "star-half": {
    reference:
      "Hugeicons `star-half` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["rating", "half", "review"],
    description: "Half-filled star.",
  },
  "test-tube": {
    reference:
      "Hugeicons `test-tube` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["test", "lab", "sample"],
    description: "Test tube.",
  },
  thermometer: {
    reference:
      "Hugeicons `thermometer` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["temperature", "heat", "weather"],
    description: "Thermometer.",
  },
  "toggle-off": {
    reference:
      "Hugeicons `toggle-off` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["switch", "off", "disabled"],
    description: "Switch turned off.",
  },
  "toggle-on": {
    reference:
      "Hugeicons `toggle-on` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["switch", "on", "enabled"],
    description: "Switch turned on.",
  },
  "user-add-01": {
    reference:
      "Hugeicons `user-add-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["invite", "add member", "new user"],
    description: "Person with a plus, to add someone.",
  },
  "user-remove-01": {
    reference:
      "Hugeicons `user-remove-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["remove member", "delete user"],
    description: "Person with a minus, to remove someone.",
  },
  "workflow-square-01": {
    reference:
      "Hugeicons `workflow-square-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["workflow", "automation", "flow"],
    description: "Two nodes joined by an elbow.",
  },
  "smile-fill": {
    reference: "Filled variant of our own `smile`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "smile"],
    description: "Filled smiling face, its inner symbol cut out.",
  },
  "sad-01-fill": {
    reference: "Filled variant of our own `sad-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "sad"],
    description: "Filled sad face, its inner symbol cut out.",
  },
  "crown-fill": {
    reference: "Filled variant of our own `crown`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "crown"],
    description: "Filled crown, its inner symbol cut out.",
  },
  "pine-tree-fill": {
    reference: "Filled variant of our own `pine-tree`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pine"],
    description: "Filled pine tree, its inner symbol cut out.",
  },
  "radio-button-fill": {
    reference:
      "Filled variant of our own `radio-button`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "radio"],
    description: "Filled radio button, selected, its inner symbol cut out.",
  },
  "add-circle": {
    reference:
      "Hugeicons `add-circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["add", "plus", "create"],
    description: "Plus in a ring.",
  },
  "add-square": {
    reference:
      "Hugeicons `add-square` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["add", "plus", "create"],
    description: "Plus in a box.",
  },
  "alarm-clock": {
    reference:
      "Hugeicons `alarm-clock` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["alarm", "wake", "reminder"],
    description: "Alarm clock.",
  },
  "arrow-down-left-01": {
    reference:
      "Hugeicons `arrow-down-left-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["arrow", "diagonal", "down left"],
    description: "Arrow pointing down and left.",
  },
  "arrow-down-right-01": {
    reference:
      "Hugeicons `arrow-down-right-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["arrow", "diagonal", "down right"],
    description: "Arrow pointing down and right.",
  },
  "arrow-up-left-01": {
    reference:
      "Hugeicons `arrow-up-left-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["arrow", "diagonal", "up left"],
    description: "Arrow pointing up and left.",
  },
  "backpack-01": {
    reference:
      "Hugeicons `backpack-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["backpack", "bag", "travel"],
    description: "Backpack.",
  },
  "balance-scale": {
    reference:
      "Hugeicons `balance-scale` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["balance", "law", "compare"],
    description: "Balance scale.",
  },
  "basketball-01": {
    reference:
      "Hugeicons `basketball-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["sport", "ball", "basketball"],
    description: "Basketball with its seams.",
  },
  bicycle: {
    reference:
      "Hugeicons `bicycle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bike", "cycle", "ride"],
    description: "Bicycle.",
  },
  boat: {
    reference:
      "Hugeicons `boat` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["sail", "boat", "sea"],
    description: "Sailing boat.",
  },
  "book-02": {
    reference:
      "Hugeicons `book-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["book", "read", "manual"],
    description: "Closed book with a label.",
  },
  "bus-01": {
    reference:
      "Hugeicons `bus-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bus", "transport", "transit"],
    description: "Bus seen from the front.",
  },
  calculator: {
    reference:
      "Hugeicons `calculator` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["calculator", "math", "compute"],
    description: "Calculator.",
  },
  call: {
    reference:
      "Hugeicons `call` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["phone", "call", "telephone"],
    description: "Phone handset.",
  },
  "cloud-snow": {
    reference:
      "Hugeicons `cloud-snow` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["weather", "snow", "winter"],
    description: "Cloud with two snowflakes.",
  },
  "contact-01": {
    reference:
      "Hugeicons `contact-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["contact", "card", "address"],
    description: "Contact card with a person.",
  },
  diamond: {
    reference:
      "Hugeicons `diamond` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["gem", "premium", "value"],
    description: "Cut diamond.",
  },
  dice: {
    reference:
      "Hugeicons `dice` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["dice", "random", "game"],
    description: "Die showing two.",
  },
  "download-square-01": {
    reference:
      "Hugeicons `download-square-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["download", "save", "get"],
    description: "Arrow down in a box.",
  },
  "dumbbell-01": {
    reference:
      "Hugeicons `dumbbell-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["fitness", "gym", "sport"],
    description: "Dumbbell.",
  },
  "face-id": {
    reference:
      "Hugeicons `face-id` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["face", "recognition", "biometric"],
    description: "Face recognition.",
  },
  factory: {
    reference:
      "Hugeicons `factory` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["factory", "industry", "plant"],
    description: "Factory.",
  },
  "fast-wind": {
    reference:
      "Hugeicons `fast-wind` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["wind", "weather", "air"],
    description: "Three gusts of wind.",
  },
  "film-01": {
    reference:
      "Hugeicons `film-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["film", "movie", "video"],
    description: "Film strip.",
  },
  "first-aid-kit": {
    reference:
      "Hugeicons `first-aid-kit` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["first aid", "health", "emergency"],
    description: "First-aid kit with a cross.",
  },
  flashlight: {
    reference:
      "Hugeicons `flashlight` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["torch", "light", "beam"],
    description: "Torch shining up.",
  },
  "fuel-station": {
    reference:
      "Hugeicons `fuel-station` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["fuel", "petrol", "pump"],
    description: "Fuel pump.",
  },
  "heart-check": {
    reference:
      "Hugeicons `heart-check` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["health", "care", "verified"],
    description: "Heart with a check mark.",
  },
  id: {
    reference:
      "Hugeicons `id` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["id", "identity", "card"],
    description: "ID card.",
  },
  "key-02": {
    reference:
      "Hugeicons `key-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["key", "access", "password"],
    description: "Key lying flat.",
  },
  "leaf-01": {
    reference:
      "Hugeicons `leaf-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["leaf", "nature", "eco"],
    description: "Leaf with its midrib.",
  },
  magnet: {
    reference:
      "Hugeicons `magnet` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["magnet", "attract", "pull"],
    description: "Horseshoe magnet.",
  },
  "mail-open-01": {
    reference:
      "Hugeicons `mail-open-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["read", "envelope", "opened"],
    description: "Open envelope.",
  },
  "mail-send-01": {
    reference:
      "Hugeicons `mail-send-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["send", "email", "outbox"],
    description: "Envelope with an arrow leaving it.",
  },
  "moon-cloud": {
    reference:
      "Hugeicons `moon-cloud` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["weather", "night", "cloud"],
    description: "Crescent moon behind a cloud.",
  },
  mountain: {
    reference:
      "Hugeicons `mountain` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["mountain", "landscape", "outdoor"],
    description: "Two mountain peaks, one snow-capped.",
  },
  mushroom: {
    reference:
      "Hugeicons `mushroom` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["mushroom", "nature", "fungus"],
    description: "Mushroom with a domed cap.",
  },
  next: {
    reference:
      "Hugeicons `next` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["next", "skip", "forward"],
    description: "Triangle and bar, skip forward.",
  },
  "parking-area-square": {
    reference:
      "Hugeicons `parking-area-square` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["parking", "car park", "P"],
    description: "Parking sign.",
  },
  "password-validation": {
    reference:
      "Hugeicons `password-validation` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["password", "field", "masked"],
    description: "Masked password field.",
  },
  "pause-circle": {
    reference:
      "Hugeicons `pause-circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["pause", "video", "hold"],
    description: "Pause bars in a ring.",
  },
  pencil: {
    reference:
      "Hugeicons `pencil` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["pencil", "write", "draw"],
    description: "Pencil standing up.",
  },
  pill: {
    reference:
      "Hugeicons `pill` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["medicine", "capsule", "pharmacy"],
    description: "Capsule, half filled.",
  },
  "play-circle": {
    reference:
      "Hugeicons `play-circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["play", "video", "start"],
    description: "Play triangle in a ring.",
  },
  previous: {
    reference:
      "Hugeicons `previous` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["previous", "skip", "back"],
    description: "Bar and triangle, skip back.",
  },
  rain: {
    reference:
      "Hugeicons `rain` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["weather", "rain", "drops"],
    description: "Cloud with three rain drops.",
  },
  rainbow: {
    reference:
      "Hugeicons `rainbow` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["rainbow", "weather", "colour"],
    description: "Rainbow of three arcs.",
  },
  record: {
    reference:
      "Hugeicons `record` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["record", "media", "live"],
    description: "Solid disc, record.",
  },
  "remove-circle": {
    reference:
      "Hugeicons `remove-circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["remove", "minus", "delete"],
    description: "Minus in a ring.",
  },
  "remove-square": {
    reference:
      "Hugeicons `remove-square` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["remove", "minus", "delete"],
    description: "Minus in a box.",
  },
  repeat: {
    reference:
      "Hugeicons `repeat` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["repeat", "loop", "again"],
    description: "Two arrows round a loop, to repeat.",
  },
  road: {
    reference:
      "Hugeicons `road` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["road", "route", "street"],
    description: "Road in perspective.",
  },
  "rocket-01": {
    reference:
      "Hugeicons `rocket-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["launch", "rocket", "ship"],
    description: "Rocket ready to launch.",
  },
  "route-01": {
    reference:
      "Hugeicons `route-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["route", "path", "journey"],
    description: "Route from start to destination.",
  },
  ruler: {
    reference:
      "Hugeicons `ruler` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["ruler", "measure", "size"],
    description: "Ruler with ticks.",
  },
  safe: {
    reference:
      "Hugeicons `safe` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["safe", "vault", "secure"],
    description: "Safe with a dial.",
  },
  scan: {
    reference:
      "Hugeicons `scan` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["scan", "capture", "frame"],
    description: "Scan frame with a scan line.",
  },
  school: {
    reference:
      "Hugeicons `school` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["school", "education", "building"],
    description: "School building.",
  },
  "shield-key": {
    reference:
      "Hugeicons `shield-key` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["security", "access", "protection"],
    description: "Shield with a key.",
  },
  "shirt-01": {
    reference:
      "Hugeicons `shirt-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["shirt", "clothes", "merch"],
    description: "T-shirt.",
  },
  shuffle: {
    reference:
      "Hugeicons `shuffle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["shuffle", "random", "mix"],
    description: "Two crossing arrows, to shuffle.",
  },
  "sorting-01": {
    reference:
      "Hugeicons `sorting-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["sort", "order", "descending"],
    description: "Bars getting shorter, to sort.",
  },
  stethoscope: {
    reference:
      "Hugeicons `stethoscope` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["doctor", "health", "medical"],
    description: "Stethoscope.",
  },
  "sticky-note-01": {
    reference:
      "Hugeicons `sticky-note-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["note", "memo", "sticky"],
    description: "Sticky note with a folded corner.",
  },
  stop: {
    reference:
      "Hugeicons `stop` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["stop", "media", "halt"],
    description: "Solid square, stop.",
  },
  "stop-circle": {
    reference:
      "Hugeicons `stop-circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["stop", "video", "halt"],
    description: "Stop square in a ring.",
  },
  "sun-cloud-01": {
    reference:
      "Hugeicons `sun-cloud-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["weather", "partly sunny", "cloud"],
    description: "Sun behind a cloud.",
  },
  tent: {
    reference:
      "Hugeicons `tent` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["camp", "tent", "outdoor"],
    description: "Tent.",
  },
  "tick-double-01": {
    reference:
      "Hugeicons `tick-double-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["read", "delivered", "done"],
    description: "Double check mark.",
  },
  "timer-01": {
    reference:
      "Hugeicons `timer-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["stopwatch", "timer", "duration"],
    description: "Stopwatch.",
  },
  toolbox: {
    reference:
      "Hugeicons `toolbox` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["toolbox", "tools", "kit"],
    description: "Toolbox.",
  },
  "traffic-light": {
    reference:
      "Hugeicons `traffic-light` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["traffic", "signal", "road"],
    description: "Traffic light.",
  },
  "train-01": {
    reference:
      "Hugeicons `train-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["train", "rail", "transit"],
    description: "Train seen from the front.",
  },
  "user-circle": {
    reference:
      "Hugeicons `user-circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["account", "profile", "avatar"],
    description: "Person in a ring.",
  },
  "watch-01": {
    reference:
      "Hugeicons `watch-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["watch", "time", "wrist"],
    description: "Wristwatch.",
  },
  "wrench-01": {
    reference:
      "Hugeicons `wrench-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["wrench", "tools", "fix"],
    description: "Wrench at 45\u00b0.",
  },
  "leaf-01-fill": {
    reference: "Filled variant of our own `leaf-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "leaf"],
    description: "Filled: leaf with its midrib.",
  },
  "mountain-fill": {
    reference: "Filled variant of our own `mountain`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "mountain"],
    description: "Filled: two mountain peaks, one snow-capped.",
  },
  "first-aid-kit-fill": {
    reference:
      "Filled variant of our own `first-aid-kit`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "first"],
    description: "Filled: first-aid kit with a cross.",
  },
  "heart-check-fill": {
    reference: "Filled variant of our own `heart-check`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "heart"],
    description: "Filled: heart with a check mark.",
  },
  "bus-01-fill": {
    reference: "Filled variant of our own `bus-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bus"],
    description: "Filled: bus seen from the front.",
  },
  "rocket-01-fill": {
    reference: "Filled variant of our own `rocket-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rocket"],
    description: "Filled: rocket ready to launch.",
  },
  "shield-key-fill": {
    reference: "Filled variant of our own `shield-key`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "shield"],
    description: "Filled: shield with a key.",
  },
  "password-validation-fill": {
    reference:
      "Filled variant of our own `password-validation`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "password"],
    description: "Filled: masked password field.",
  },
  "book-02-fill": {
    reference: "Filled variant of our own `book-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "book"],
    description: "Filled: closed book with a label.",
  },
  "shirt-01-fill": {
    reference: "Filled variant of our own `shirt-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "shirt"],
    description: "Filled: t-shirt.",
  },
  "diamond-fill": {
    reference: "Filled variant of our own `diamond`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "diamond"],
    description: "Filled: cut diamond.",
  },
  "dice-fill": {
    reference: "Filled variant of our own `dice`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "dice"],
    description: "Filled: die showing two.",
  },
  "calculator-fill": {
    reference: "Filled variant of our own `calculator`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "calculator"],
    description: "Filled: calculator.",
  },
  "sticky-note-01-fill": {
    reference:
      "Filled variant of our own `sticky-note-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "sticky"],
    description: "Filled: sticky note with a folded corner.",
  },
  "id-fill": {
    reference: "Filled variant of our own `id`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "id"],
    description: "Filled: iD card.",
  },
  "play-circle-fill": {
    reference: "Filled variant of our own `play-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "play"],
    description: "Filled: play triangle in a ring.",
  },
  "pause-circle-fill": {
    reference:
      "Filled variant of our own `pause-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pause"],
    description: "Filled: pause bars in a ring.",
  },
  "stop-circle-fill": {
    reference: "Filled variant of our own `stop-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "stop"],
    description: "Filled: stop square in a ring.",
  },
  "add-circle-fill": {
    reference: "Filled variant of our own `add-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "add"],
    description: "Filled: plus in a ring.",
  },
  "remove-circle-fill": {
    reference:
      "Filled variant of our own `remove-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "remove"],
    description: "Filled: minus in a ring.",
  },
  "add-square-fill": {
    reference: "Filled variant of our own `add-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "add"],
    description: "Filled: plus in a box.",
  },
  "remove-square-fill": {
    reference:
      "Filled variant of our own `remove-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "remove"],
    description: "Filled: minus in a box.",
  },
  "download-square-01-fill": {
    reference:
      "Filled variant of our own `download-square-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "download"],
    description: "Filled: arrow down in a box.",
  },
  "user-circle-fill": {
    reference: "Filled variant of our own `user-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "user"],
    description: "Filled: person in a ring.",
  },
  "contact-01-fill": {
    reference: "Filled variant of our own `contact-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "contact"],
    description: "Filled: contact card with a person.",
  },
  "attachment-01": {
    reference:
      "Hugeicons `attachment-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["attachment", "paperclip", "attach"],
    description: "Paper clip.",
  },
  "battery-empty": {
    reference:
      "Hugeicons `battery-empty` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["battery", "empty", "power"],
    description: "Empty battery.",
  },
  "bookmark-02": {
    reference:
      "Hugeicons `bookmark-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["bookmark", "save", "ribbon"],
    description: "Rounded bookmark ribbon with a label bar.",
  },
  "chatting-01": {
    reference:
      "Hugeicons `chatting-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["chat", "conversation", "messages"],
    description: "Two overlapping speech bubbles.",
  },
  circle: {
    reference:
      "Hugeicons `circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["circle", "ring", "round"],
    description: "Empty ring using the full grid.",
  },
  "cursor-01": {
    reference:
      "Hugeicons `cursor-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["cursor", "pointer", "mouse"],
    description: "Solid mouse pointer.",
  },
  "divide-sign": {
    reference:
      "Hugeicons `divide-sign` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["divide", "division", "math"],
    description: "Division sign.",
  },
  "equal-sign": {
    reference:
      "Hugeicons `equal-sign` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["equal", "equals", "math"],
    description: "Equal sign.",
  },
  eraser: {
    reference:
      "Hugeicons `eraser` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["eraser", "erase", "clear"],
    description: "Eraser lying on the line it erased.",
  },
  flower: {
    reference:
      "Hugeicons `flower` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["flower", "bloom", "nature"],
    description: "Four-petal flower seen from above.",
  },
  "minus-sign-square": {
    reference:
      "Hugeicons `minus-sign-square` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["minus", "remove", "box"],
    description: "Minus in a rounded box.",
  },
  "multiplication-sign": {
    reference:
      "Hugeicons `multiplication-sign` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["multiply", "times", "math"],
    description: "Multiplication sign.",
  },
  sent: {
    reference:
      "Hugeicons `sent` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["send", "paper plane", "message"],
    description: "Paper plane heading up and right.",
  },
  "sidebar-right": {
    reference:
      "Hugeicons `sidebar-right` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["sidebar", "panel", "layout"],
    description: "Window with a panel on the right.",
  },
  square: {
    reference:
      "Hugeicons `square` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["square", "box", "shape"],
    description: "Empty square with rounded corners.",
  },
  "thumbs-down": {
    reference:
      "Hugeicons `thumbs-down` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["dislike", "reject", "thumb"],
    description: "Hand giving a thumbs down.",
  },
  "thumbs-up": {
    reference:
      "Hugeicons `thumbs-up` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["like", "approve", "thumb"],
    description: "Hand giving a thumbs up.",
  },
  triangle: {
    reference:
      "Hugeicons `triangle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art by an Opus agent and reviewed in the gallery.",
    labels: ["triangle", "shape", "pyramid"],
    description: "Triangle pointing up with rounded corners.",
  },
  "alarm-clock-off": {
    reference:
      "Hugeicons `alarm-clock-off` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["alarm", "off", "silent"],
    description: "Alarm clock struck through.",
  },
  antenna: {
    reference:
      "Hugeicons `antenna` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["antenna", "broadcast", "signal"],
    description: "Antenna sending waves.",
  },
  "archive-02": {
    reference:
      "Hugeicons `archive-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["cabinet", "archive", "drawers"],
    description: "Filing cabinet with two drawers.",
  },
  "arrow-expand-01": {
    reference:
      "Hugeicons `arrow-expand-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["expand", "enlarge", "fullscreen"],
    description: "Two diagonal arrows pointing out.",
  },
  "arrow-shrink-01": {
    reference:
      "Hugeicons `arrow-shrink-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["shrink", "reduce", "collapse"],
    description: "Two diagonal arrows pointing in.",
  },
  barcode: {
    reference:
      "Hugeicons `barcode` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["barcode", "scan", "product"],
    description: "Barcode.",
  },
  "battery-charging-01": {
    reference:
      "Hugeicons `battery-charging-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["battery", "charging", "power"],
    description: "Charging battery.",
  },
  "bell-dot": {
    reference:
      "Hugeicons `bell-dot` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bell", "unread", "notification"],
    description: "Bell with a notification dot.",
  },
  bluetooth: {
    reference:
      "Hugeicons `bluetooth` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bluetooth", "wireless", "pairing"],
    description: "Bluetooth rune.",
  },
  "bookmark-add-01": {
    reference:
      "Hugeicons `bookmark-add-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bookmark", "add", "save"],
    description: "Bookmark with a plus.",
  },
  "bookmark-check-01": {
    reference:
      "Hugeicons `bookmark-check-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bookmark", "saved", "done"],
    description: "Bookmark with a check.",
  },
  "bookmark-remove-01": {
    reference:
      "Hugeicons `bookmark-remove-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bookmark", "remove", "unsave"],
    description: "Bookmark with a minus.",
  },
  "bug-02": {
    reference:
      "Hugeicons `bug-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bug", "beetle", "debug"],
    description: "Beetle with a split shell.",
  },
  "calendar-add-01": {
    reference:
      "Hugeicons `calendar-add-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["calendar", "add", "event"],
    description: "Calendar with a plus badge.",
  },
  "calendar-check-in-01": {
    reference:
      "Hugeicons `calendar-check-in-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["calendar", "check in", "confirmed"],
    description: "Calendar with a check badge.",
  },
  "calendar-lock-01": {
    reference:
      "Hugeicons `calendar-lock-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["calendar", "locked", "private"],
    description: "Calendar with a padlock badge.",
  },
  "calendar-remove-01": {
    reference:
      "Hugeicons `calendar-remove-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["calendar", "remove", "event"],
    description: "Calendar with a minus badge.",
  },
  "cancel-square": {
    reference:
      "Hugeicons `cancel-square` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["cancel", "close", "box"],
    description: "Cross in a box.",
  },
  "checkmark-square-02": {
    reference:
      "Hugeicons `checkmark-square-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["done", "checkbox", "ticked"],
    description: "Check in a square box.",
  },
  "circle-arrow-down-01": {
    reference:
      "Hugeicons `circle-arrow-down-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["arrow", "down", "circle"],
    description: "Arrow down in a ring.",
  },
  "circle-arrow-left-01": {
    reference:
      "Hugeicons `circle-arrow-left-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["arrow", "left", "circle"],
    description: "Arrow left in a ring.",
  },
  "circle-arrow-right-01": {
    reference:
      "Hugeicons `circle-arrow-right-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["arrow", "right", "circle"],
    description: "Arrow right in a ring.",
  },
  "circle-arrow-up-01": {
    reference:
      "Hugeicons `circle-arrow-up-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["arrow", "up", "circle"],
    description: "Arrow up in a ring.",
  },
  "clock-02": {
    reference:
      "Hugeicons `clock-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["clock", "time", "hour"],
    description: "Clock with two-pixel hands.",
  },
  "cloud-off": {
    reference:
      "Hugeicons `cloud-off` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["cloud", "offline", "disconnected"],
    description: "Cloud struck through.",
  },
  "comment-01": {
    reference:
      "Hugeicons `comment-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["comment", "text", "reply"],
    description: "Speech bubble with two lines of text.",
  },
  "comment-add-01": {
    reference:
      "Hugeicons `comment-add-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["comment", "add", "new"],
    description: "Speech bubble with a plus.",
  },
  "ethernet-port": {
    reference:
      "Hugeicons `ethernet-port` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["ethernet", "network", "port"],
    description: "Ethernet socket.",
  },
  favourite: {
    reference:
      "Hugeicons `favourite` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["favourite", "like", "heart"],
    description: "Heart.",
  },
  "file-add": {
    reference:
      "Hugeicons `file-add` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["file", "new", "create"],
    description: "File with a plus badge.",
  },
  "file-download": {
    reference:
      "Hugeicons `file-download` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["file", "download", "save"],
    description: "File with a download arrow badge.",
  },
  "file-image": {
    reference:
      "Hugeicons `file-image` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["file", "image", "picture"],
    description: "File with a mountain inside.",
  },
  "file-lock": {
    reference:
      "Hugeicons `file-lock` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["file", "locked", "private"],
    description: "File with a padlock badge.",
  },
  "file-music": {
    reference:
      "Hugeicons `file-music` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["file", "music", "audio"],
    description: "File with a note inside.",
  },
  "file-remove": {
    reference:
      "Hugeicons `file-remove` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["file", "delete", "remove"],
    description: "File with a minus badge.",
  },
  "file-search": {
    reference:
      "Hugeicons `file-search` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["file", "search", "find"],
    description: "File with a magnifier badge.",
  },
  "file-upload": {
    reference:
      "Hugeicons `file-upload` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["file", "upload", "send"],
    description: "File with an upload arrow badge.",
  },
  "file-video": {
    reference:
      "Hugeicons `file-video` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["file", "video", "movie"],
    description: "File with a play triangle inside.",
  },
  "filter-add": {
    reference:
      "Hugeicons `filter-add` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["filter", "add", "refine"],
    description: "Funnel with a plus.",
  },
  "filter-remove": {
    reference:
      "Hugeicons `filter-remove` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["filter", "remove", "clear"],
    description: "Funnel with a minus.",
  },
  "folder-add": {
    reference:
      "Hugeicons `folder-add` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["folder", "new", "create"],
    description: "Folder with a plus badge.",
  },
  "folder-download": {
    reference:
      "Hugeicons `folder-download` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["folder", "download", "save"],
    description: "Folder with a download arrow badge.",
  },
  "folder-lock": {
    reference:
      "Hugeicons `folder-lock` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["folder", "locked", "private"],
    description: "Folder with a padlock badge.",
  },
  "folder-open": {
    reference:
      "Hugeicons `folder-open` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["folder", "open", "browse"],
    description: "Open folder.",
  },
  "folder-remove": {
    reference:
      "Hugeicons `folder-remove` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["folder", "delete", "remove"],
    description: "Folder with a minus badge.",
  },
  "folder-upload": {
    reference:
      "Hugeicons `folder-upload` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["folder", "upload", "send"],
    description: "Folder with an upload arrow badge.",
  },
  "git-pull-request-closed": {
    reference:
      "Hugeicons `git-pull-request-closed` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["pull request", "closed", "rejected"],
    description: "Closed pull request.",
  },
  "hard-drive": {
    reference:
      "Hugeicons `hard-drive` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["disk", "storage", "drive"],
    description: "Hard drive.",
  },
  "hourglass-off": {
    reference:
      "Hugeicons `hourglass-off` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["hourglass", "off", "no wait"],
    description: "Hourglass struck through.",
  },
  "inbox-download": {
    reference:
      "Hugeicons `inbox-download` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["inbox", "receive", "download"],
    description: "Arrow dropping into a tray.",
  },
  "inbox-upload": {
    reference:
      "Hugeicons `inbox-upload` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["inbox", "send", "upload"],
    description: "Arrow rising out of a tray.",
  },
  "infinity-01": {
    reference:
      "Hugeicons `infinity-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["infinity", "unlimited", "loop"],
    description: "Infinity sign.",
  },
  "mail-02": {
    reference:
      "Hugeicons `mail-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["mail", "email", "envelope"],
    description: "Envelope with cut corners.",
  },
  "mail-add-01": {
    reference:
      "Hugeicons `mail-add-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["mail", "add", "new"],
    description: "Envelope with a plus badge.",
  },
  "mail-lock-01": {
    reference:
      "Hugeicons `mail-lock-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["mail", "lock", "encrypted"],
    description: "Envelope with a padlock badge.",
  },
  "mail-remove-01": {
    reference:
      "Hugeicons `mail-remove-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["mail", "remove", "delete"],
    description: "Envelope with a minus badge.",
  },
  "message-add-01": {
    reference:
      "Hugeicons `message-add-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["message", "add", "new"],
    description: "Speech bubble with a plus badge.",
  },
  "message-notification-01": {
    reference:
      "Hugeicons `message-notification-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["message", "unread", "notification"],
    description: "Speech bubble with a notification dot.",
  },
  nfc: {
    reference:
      "Hugeicons `nfc` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["contactless", "nfc", "tap"],
    description: "Contactless waves.",
  },
  notebook: {
    reference:
      "Hugeicons `notebook` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["notebook", "notes", "journal"],
    description: "Notebook with spiral rings.",
  },
  "notification-02": {
    reference:
      "Hugeicons `notification-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["bell", "notification", "alert"],
    description: "Bell with a rounded top.",
  },
  "notification-snooze-01": {
    reference:
      "Hugeicons `notification-snooze-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["snooze", "bell", "later"],
    description: "Bell with a Z, snoozed.",
  },
  "quote-down": {
    reference:
      "Hugeicons `quote-down` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["quote", "citation", "closing"],
    description: "Closing quotation marks.",
  },
  radio: {
    reference:
      "Hugeicons `radio` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["radio", "audio", "broadcast"],
    description: "Radio with a speaker and an antenna.",
  },
  "rotate-left-01": {
    reference:
      "Hugeicons `rotate-left-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["rotate", "anticlockwise", "turn"],
    description: "Arrow turning anticlockwise.",
  },
  "rotate-right-01": {
    reference:
      "Hugeicons `rotate-right-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["rotate", "clockwise", "turn"],
    description: "Arrow turning clockwise.",
  },
  router: {
    reference:
      "Hugeicons `router` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["router", "network", "wireless"],
    description: "Router with two antennas.",
  },
  "search-add": {
    reference:
      "Hugeicons `search-add` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["zoom in", "magnify", "search"],
    description: "Magnifier with a plus.",
  },
  "search-minus": {
    reference:
      "Hugeicons `search-minus` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["zoom out", "magnify", "search"],
    description: "Magnifier with a minus.",
  },
  "search-remove": {
    reference:
      "Hugeicons `search-remove` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["clear search", "magnify", "cancel"],
    description: "Magnifier with a cross.",
  },
  "server-stack-02": {
    reference:
      "Hugeicons `server-stack-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["server", "rack", "infrastructure"],
    description: "Server rack of three units.",
  },
  "shield-user": {
    reference:
      "Hugeicons `shield-user` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["shield", "user", "security"],
    description: "Shield with a person inside.",
  },
  signal: {
    reference:
      "Hugeicons `signal` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["signal", "network", "strength"],
    description: "Four rising signal bars.",
  },
  "sort-by-down-01": {
    reference:
      "Hugeicons `sort-by-down-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["sort", "descending", "order"],
    description: "Arrow down beside shortening bars.",
  },
  "square-arrow-up-01": {
    reference:
      "Hugeicons `square-arrow-up-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["arrow", "up", "box"],
    description: "Arrow up in a box.",
  },
  "task-01": {
    reference:
      "Hugeicons `task-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["task", "todo", "checklist"],
    description: "Two tasks with empty boxes.",
  },
  "task-done-01": {
    reference:
      "Hugeicons `task-done-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["done", "completed", "checklist"],
    description: "Two tasks checked off.",
  },
  "time-quarter-pass": {
    reference:
      "Hugeicons `time-quarter-pass` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["quarter", "time", "elapsed"],
    description: "Clock with a quarter of its ring marked.",
  },
  "timer-02": {
    reference:
      "Hugeicons `timer-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["stopwatch", "timer", "duration"],
    description: "Stopwatch with side buttons.",
  },
  "user-block-01": {
    reference:
      "Hugeicons `user-block-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["user", "block", "ban"],
    description: "Person with a no-entry badge.",
  },
  "user-lock-01": {
    reference:
      "Hugeicons `user-lock-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["user", "lock", "private"],
    description: "Person with a padlock badge.",
  },
  "user-question-01": {
    reference:
      "Hugeicons `user-question-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["user", "question", "unknown"],
    description: "Person with a question-mark badge.",
  },
  "user-shield-01": {
    reference:
      "Hugeicons `user-shield-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["user", "shield", "protected"],
    description: "Person with a shield badge.",
  },
  "user-star-01": {
    reference:
      "Hugeicons `user-star-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["user", "star", "favourite"],
    description: "Person with a star badge.",
  },
  users: {
    reference:
      "Hugeicons `users` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["people", "team", "members"],
    description: "Two people, one behind the other.",
  },
  "wifi-off-01": {
    reference:
      "Hugeicons `wifi-off-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["wifi", "offline", "disconnected"],
    description: "Wi-Fi struck through.",
  },
  "zoom-in-area": {
    reference:
      "Hugeicons `zoom-in-area` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["zoom", "area", "focus"],
    description: "Corner brackets around a plus.",
  },
  "folder-open-fill": {
    reference: "Filled variant of our own `folder-open`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "folder"],
    description: "Filled: open folder.",
  },
  "archive-02-fill": {
    reference: "Filled variant of our own `archive-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "archive"],
    description: "Filled: filing cabinet with two drawers.",
  },
  "shield-user-fill": {
    reference: "Filled variant of our own `shield-user`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "shield"],
    description: "Filled: shield with a person inside.",
  },
  "cancel-square-fill": {
    reference:
      "Filled variant of our own `cancel-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cancel"],
    description: "Filled: cross in a box.",
  },
  "checkmark-square-02-fill": {
    reference:
      "Filled variant of our own `checkmark-square-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "checkmark"],
    description: "Filled: check in a square box.",
  },
  "favourite-fill": {
    reference: "Filled variant of our own `favourite`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "favourite"],
    description: "Filled: heart.",
  },
  "bookmark-add-01-fill": {
    reference:
      "Filled variant of our own `bookmark-add-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bookmark"],
    description: "Filled: bookmark with a plus.",
  },
  "bookmark-remove-01-fill": {
    reference:
      "Filled variant of our own `bookmark-remove-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bookmark"],
    description: "Filled: bookmark with a minus.",
  },
  "bookmark-check-01-fill": {
    reference:
      "Filled variant of our own `bookmark-check-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bookmark"],
    description: "Filled: bookmark with a check.",
  },
  "mail-02-fill": {
    reference: "Filled variant of our own `mail-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "mail"],
    description: "Filled: envelope with cut corners.",
  },
  "comment-01-fill": {
    reference: "Filled variant of our own `comment-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "comment"],
    description: "Filled: speech bubble with two lines of text.",
  },
  "comment-add-01-fill": {
    reference:
      "Filled variant of our own `comment-add-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "comment"],
    description: "Filled: speech bubble with a plus.",
  },
  "notification-02-fill": {
    reference:
      "Filled variant of our own `notification-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "notification"],
    description: "Filled: bell with a rounded top.",
  },
  "clock-02-fill": {
    reference: "Filled variant of our own `clock-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "clock"],
    description: "Filled: clock with two-pixel hands.",
  },
  "circle-arrow-up-01-fill": {
    reference:
      "Filled variant of our own `circle-arrow-up-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: arrow up in a ring.",
  },
  "circle-arrow-down-01-fill": {
    reference:
      "Filled variant of our own `circle-arrow-down-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: arrow down in a ring.",
  },
  "circle-arrow-left-01-fill": {
    reference:
      "Filled variant of our own `circle-arrow-left-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: arrow left in a ring.",
  },
  "circle-arrow-right-01-fill": {
    reference:
      "Filled variant of our own `circle-arrow-right-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: arrow right in a ring.",
  },
  "square-arrow-up-01-fill": {
    reference:
      "Filled variant of our own `square-arrow-up-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: arrow up in a box.",
  },
  "radio-fill": {
    reference: "Filled variant of our own `radio`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "radio"],
    description: "Filled: radio with a speaker and an antenna.",
  },
  "bug-02-fill": {
    reference: "Filled variant of our own `bug-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bug"],
    description: "Filled: beetle with a split shell.",
  },
  "alert-diamond": {
    reference:
      "Hugeicons `alert-diamond` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["warning", "critical", "attention"],
    description: "Exclamation mark in a diamond.",
  },
  "alert-square": {
    reference:
      "Hugeicons `alert-square` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["warning", "error", "attention"],
    description: "Exclamation mark in a box.",
  },
  at: {
    reference:
      "Hugeicons `at` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["at", "email", "mention"],
    description: "At sign.",
  },
  "call-blocked": {
    reference:
      "Hugeicons `call-blocked` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["blocked", "call", "phone"],
    description: "Handset with a no-entry badge.",
  },
  "call-end-01": {
    reference:
      "Hugeicons `call-end-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["hang up", "end call", "phone"],
    description: "Handset lying upside down, to hang up.",
  },
  "camera-off-01": {
    reference:
      "Hugeicons `camera-off-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["camera", "off", "disabled"],
    description: "Camera struck through.",
  },
  "certificate-01": {
    reference:
      "Hugeicons `certificate-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["certificate", "diploma", "award"],
    description: "Certificate with a seal and ribbons.",
  },
  "chart-decrease": {
    reference:
      "Hugeicons `chart-decrease` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["decline", "trend", "decrease"],
    description: "Falling line chart.",
  },
  "chart-line-data-01": {
    reference:
      "Hugeicons `chart-line-data-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["chart", "data", "analytics"],
    description: "Line chart through data points.",
  },
  "checkmark-badge-01": {
    reference:
      "Hugeicons `checkmark-badge-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["verified", "badge", "approved"],
    description: "Rosette badge with a check mark.",
  },
  "cloud-download": {
    reference:
      "Hugeicons `cloud-download` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["download", "cloud", "sync"],
    description: "Arrow dropping out through the base of a cloud.",
  },
  "cloud-upload": {
    reference:
      "Hugeicons `cloud-upload` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["upload", "cloud", "sync"],
    description: "Arrow rising through the base of a cloud.",
  },
  "color-picker": {
    reference:
      "Hugeicons `color-picker` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["eyedropper", "colour", "pick"],
    description: "Eyedropper with a drop.",
  },
  command: {
    reference:
      "Hugeicons `command` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["command", "shortcut", "key"],
    description: "Command key sign.",
  },
  "dollar-circle": {
    reference:
      "Hugeicons `dollar-circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["dollar", "money", "price"],
    description: "Dollar sign in a ring.",
  },
  "door-01": {
    reference:
      "Hugeicons `door-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["door", "entrance", "room"],
    description: "Door with its knob.",
  },
  "drag-drop-horizontal": {
    reference:
      "Hugeicons `drag-drop-horizontal` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["drag", "handle", "reorder"],
    description: "Drag handle, two rows of dots.",
  },
  "euro-circle": {
    reference:
      "Hugeicons `euro-circle` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["euro", "money", "price"],
    description: "Euro sign in a ring.",
  },
  "file-check": {
    reference:
      "Hugeicons `file-check` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["file", "approved", "done"],
    description: "File with a check badge.",
  },
  "file-edit": {
    reference:
      "Hugeicons `file-edit` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["file", "edit", "modify"],
    description: "File with a pencil badge.",
  },
  "filter-horizontal": {
    reference:
      "Hugeicons `filter-horizontal` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["filter", "refine", "narrow"],
    description: "Three centred lines getting shorter.",
  },
  "floppy-disk": {
    reference:
      "Hugeicons `floppy-disk` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["save", "disk", "store"],
    description: "Floppy disk, to save.",
  },
  "folder-favourite": {
    reference:
      "Hugeicons `folder-favourite` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["folder", "favourite", "starred"],
    description: "Folder with a star badge.",
  },
  heading: {
    reference:
      "Hugeicons `heading` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["heading", "title", "text"],
    description: "Letter H, a heading.",
  },
  "help-square": {
    reference:
      "Hugeicons `help-square` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["help", "question", "faq"],
    description: "Question mark in a box.",
  },
  hierarchy: {
    reference:
      "Hugeicons `hierarchy` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["org chart", "structure", "tree"],
    description: "Root node with three children.",
  },
  highlighter: {
    reference:
      "Hugeicons `highlighter` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["highlight", "marker", "annotate"],
    description: "Highlighter over a highlight stroke.",
  },
  history: {
    reference:
      "Hugeicons `history` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["history", "recent", "log"],
    description: "Clock whose ring turns back on itself.",
  },
  "image-add-01": {
    reference:
      "Hugeicons `image-add-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["image", "add", "upload"],
    description: "Picture with a plus badge.",
  },
  "image-upload": {
    reference:
      "Hugeicons `image-upload` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["image", "upload", "send"],
    description: "Picture with an upload arrow badge.",
  },
  "information-square": {
    reference:
      "Hugeicons `information-square` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["info", "about", "help"],
    description: "Letter i in a box.",
  },
  "left-to-right-list-number": {
    reference:
      "Hugeicons `left-to-right-list-number` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["numbered list", "ordered", "list"],
    description: "Numbered list.",
  },
  "link-square-02": {
    reference:
      "Hugeicons `link-square-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["external link", "open", "new tab"],
    description: "Arrow leaving a box, an external link.",
  },
  "logout-square-01": {
    reference:
      "Hugeicons `logout-square-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["sign out", "exit", "leave"],
    description: "Arrow leaving a bracket.",
  },
  "magic-wand-01": {
    reference:
      "Hugeicons `magic-wand-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["magic", "auto", "ai"],
    description: "Magic wand with a sparkle.",
  },
  "menu-collapse": {
    reference:
      "Hugeicons `menu-collapse` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["menu", "collapse", "navigation"],
    description: "Three bars with a chevron pointing left.",
  },
  "mic-off-01": {
    reference:
      "Hugeicons `mic-off-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["mute", "microphone", "off"],
    description: "Microphone struck through, muted.",
  },
  "money-bag-02": {
    reference:
      "Hugeicons `money-bag-02` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["money", "savings", "funds"],
    description: "Money bag with its tie.",
  },
  "mortarboard-01": {
    reference:
      "Hugeicons `mortarboard-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["graduation", "education", "diploma"],
    description: "Graduation cap with its tassel.",
  },
  move: {
    reference:
      "Hugeicons `move` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["move", "drag", "arrows"],
    description: "Four arrows pointing out, to move.",
  },
  "navigation-03": {
    reference:
      "Hugeicons `navigation-03` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["navigation", "location", "direction"],
    description: "Solid location arrow pointing up and right.",
  },
  "note-add": {
    reference:
      "Hugeicons `note-add` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["note", "add", "new"],
    description: "Note with a plus badge.",
  },
  package: {
    reference:
      "Hugeicons `package` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["parcel", "box", "delivery"],
    description: "Parcel with tape, in oblique view.",
  },
  "panel-left-close": {
    reference:
      "Hugeicons `panel-left-close` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["panel", "sidebar", "collapse"],
    description: "Window with its left panel and a chevron pointing left.",
  },
  "pin-off": {
    reference:
      "Hugeicons `pin-off` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["unpin", "pin", "off"],
    description: "Push pin struck through, unpinned.",
  },
  "power-service": {
    reference:
      "Hugeicons `power-service` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["power", "on off", "shutdown"],
    description: "Power button.",
  },
  "presentation-01": {
    reference:
      "Hugeicons `presentation-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["presentation", "slides", "board"],
    description: "Presentation board on an easel.",
  },
  "receipt-dollar": {
    reference:
      "Hugeicons `receipt-dollar` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["receipt", "payment", "bill"],
    description: "Receipt with a dollar sign.",
  },
  "screen-share": {
    reference:
      "Hugeicons `screen-share` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["share screen", "present", "monitor"],
    description: "Monitor with an arrow rising out of it.",
  },
  "sort-by-up-01": {
    reference:
      "Hugeicons `sort-by-up-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["sort", "ascending", "order"],
    description: "Arrow up beside lengthening bars.",
  },
  "star-off": {
    reference:
      "Hugeicons `star-off` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["unfavourite", "star", "off"],
    description: "Star struck through.",
  },
  "store-01": {
    reference:
      "Hugeicons `store-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["shop", "store", "retail"],
    description: "Shop with a striped awning.",
  },
  "tag-01": {
    reference:
      "Hugeicons `tag-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["tag", "price", "label"],
    description: "Price tag at 45\u00b0 with its hole.",
  },
  "task-add-01": {
    reference:
      "Hugeicons `task-add-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["task", "add", "todo"],
    description: "Task list with a plus badge.",
  },
  text: {
    reference:
      "Hugeicons `text` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["text", "type", "font"],
    description: "Letter T, text.",
  },
  "text-indent": {
    reference:
      "Hugeicons `text-indent` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["indent", "text", "paragraph"],
    description: "Indented lines with an arrow.",
  },
  "text-strikethrough": {
    reference:
      "Hugeicons `text-strikethrough` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["strikethrough", "format", "text"],
    description: "Struck-through letter S.",
  },
  "text-underline": {
    reference:
      "Hugeicons `text-underline` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["underline", "format", "text"],
    description: "Underlined letter U.",
  },
  "unlink-01": {
    reference:
      "Hugeicons `unlink-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["unlink", "broken", "detach"],
    description: "Two link halves pulled apart.",
  },
  "user-account": {
    reference:
      "Hugeicons `user-account` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["account", "profile", "avatar"],
    description: "Person in a box.",
  },
  "user-check-01": {
    reference:
      "Hugeicons `user-check-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["user", "verified", "approved"],
    description: "Person with a check badge.",
  },
  "user-edit-01": {
    reference:
      "Hugeicons `user-edit-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["user", "edit", "profile"],
    description: "Person with a pencil badge.",
  },
  "user-settings-01": {
    reference:
      "Hugeicons `user-settings-01` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["user", "settings", "preferences"],
    description: "Person with a cog badge.",
  },
  "video-off": {
    reference:
      "Hugeicons `video-off` (Iconify preview, 2026-11-17): proportions and composition only, redrawn as pixel art.",
    labels: ["video", "camera off", "off"],
    description: "Video camera struck through.",
  },
  airtable: {
    category: "brands",
    labels: ["airtable", "database", "logo"],
    description: "The Airtable mark: a rhombus on top of a parallelogram and a triangle.",
    reference:
      "simple-icons:airtable (Iconify, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "Airtable and the Airtable logo are trademarks of Formagrid, Inc. (Airtable), used here only to refer to Airtable.",
  },
  asana: {
    category: "brands",
    labels: ["asana", "tasks", "logo"],
    description: "The Asana mark: three round dots in a triangle.",
    reference:
      "simple-icons:asana (Iconify, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "Asana and the Asana logo are trademarks of Asana, Inc., used here only to refer to Asana.",
  },
  attio: {
    category: "brands",
    labels: ["attio", "crm", "logo"],
    description: "The Attio mark: a long slanted rounded bar and a small rounded rhombus.",
    reference:
      "thesvg-color:attio (Iconify, theSVG collection, MIT, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "Attio and the Attio logo are trademarks of Attio Ltd, used here only to refer to Attio.",
  },
  confluence: {
    category: "brands",
    labels: ["confluence", "atlassian", "logo"],
    description: "The Confluence mark: two tapered swooshes symmetric by a half turn.",
    reference:
      "simple-icons:confluence (Iconify, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "Confluence and the Confluence logo are trademarks of Atlassian, used here only to refer to Confluence.",
  },
  intercom: {
    category: "brands",
    labels: ["intercom", "chat", "logo"],
    description: "The Intercom mark: a rounded square with five bars and a smile cut out.",
    reference:
      "simple-icons:intercom (Iconify, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "Intercom and the Intercom logo are trademarks of Intercom, Inc., used here only to refer to Intercom.",
  },
  jira: {
    category: "brands",
    labels: ["jira", "atlassian", "logo"],
    description: "The Jira mark: three chevrons stacked from the top right to the bottom left.",
    reference:
      "simple-icons:jira (Iconify, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "Jira and the Jira logo are trademarks of Atlassian, used here only to refer to Jira.",
  },
  linear: {
    category: "brands",
    labels: ["linear", "issues", "logo"],
    description: "The Linear mark: a disc cut by three parallel 45\u00b0 lines on its lower left.",
    reference:
      "simple-icons:linear (Iconify, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "Linear and the Linear logo are trademarks of Linear Orbit, Inc., used here only to refer to Linear.",
  },
  "notion-01": {
    category: "brands",
    labels: ["notion", "notes", "logo"],
    description: "The Notion mark: the serif N in a cube seen in perspective.",
    reference:
      "simple-icons:notion (Iconify, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "Notion and the Notion logo are trademarks of Notion Labs, Inc., used here only to refer to Notion.",
  },
  salesforce: {
    category: "brands",
    labels: ["salesforce", "crm", "logo"],
    description: "The Salesforce mark: the cloud with two bumps on top and two below.",
    reference:
      "simple-icons:salesforce (Iconify, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "Salesforce and the Salesforce logo are trademarks of Salesforce, Inc., used here only to refer to Salesforce.",
  },
  zendesk: {
    category: "brands",
    labels: ["zendesk", "support", "logo"],
    description: "The Zendesk mark: two half discs and two triangles split by a vertical gap.",
    reference:
      "simple-icons:zendesk (Iconify, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "Zendesk and the Zendesk logo are trademarks of Zendesk, Inc., used here only to refer to Zendesk.",
  },
  "floppy-disk-fill": {
    reference: "Filled variant of our own `floppy-disk`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "floppy"],
    description: "Filled: floppy disk, to save.",
  },
  "tag-01-fill": {
    reference: "Filled variant of our own `tag-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "tag"],
    description: "Filled: price tag at 45° with its hole.",
  },
  "dollar-circle-fill": {
    reference:
      "Filled variant of our own `dollar-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "dollar"],
    description: "Filled: dollar sign in a ring.",
  },
  "euro-circle-fill": {
    reference: "Filled variant of our own `euro-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "euro"],
    description: "Filled: euro sign in a ring.",
  },
  "checkmark-badge-01-fill": {
    reference:
      "Filled variant of our own `checkmark-badge-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "checkmark"],
    description: "Filled: rosette badge with a check mark.",
  },
  "alert-square-fill": {
    reference:
      "Filled variant of our own `alert-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "alert"],
    description: "Filled: exclamation mark in a box.",
  },
  "information-square-fill": {
    reference:
      "Filled variant of our own `information-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "information"],
    description: "Filled: letter i in a box.",
  },
  "help-square-fill": {
    reference: "Filled variant of our own `help-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "help"],
    description: "Filled: question mark in a box.",
  },
  "alert-diamond-fill": {
    reference:
      "Filled variant of our own `alert-diamond`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "alert"],
    description: "Filled: exclamation mark in a diamond.",
  },
  "user-account-fill": {
    reference:
      "Filled variant of our own `user-account`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "user"],
    description: "Filled: person in a box.",
  },
  "door-01-fill": {
    reference: "Filled variant of our own `door-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "door"],
    description: "Filled: door with its knob.",
  },
};
