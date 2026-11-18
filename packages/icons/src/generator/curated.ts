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
    labels: ["collapse", "close", "subtract"],
    description: "Minus sign: the bar of the plus sign, for a collapse toggle.",
  },
  mcp: {
    category: "ai",
    labels: ["model context protocol", "claude", "agent", "connector"],
    description: "Plug of the Model Context Protocol: tools used from an AI assistant.",
  },
  "plus-sign": {
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
    labels: ["chevron", "expand", "menu"],
    description: "Chevron pointing down.",
  },
  "arrow-left-01": {
    labels: ["chevron", "back", "previous"],
    description: "Chevron pointing left.",
  },
  "arrow-right-01": {
    labels: ["chevron", "next", "open"],
    description: "Chevron pointing right.",
  },
  "arrow-up-01": {
    labels: ["chevron", "collapse", "up"],
    description: "Chevron pointing up.",
  },
  "calendar-03": {
    labels: ["date", "schedule", "day"],
    description: "Calendar page with a few days marked.",
  },
  "cancel-01": {
    labels: ["close", "dismiss", "remove", "x"],
    description: "Cross, to close or dismiss.",
  },
  "copy-01": {
    labels: ["duplicate", "clipboard"],
    description: "Two overlapping sheets, to copy.",
  },
  "delete-02": {
    labels: ["trash", "bin", "remove"],
    description: "Bin, to delete.",
  },
  "download-01": {
    labels: ["save", "export", "get"],
    description: "Arrow down into a tray.",
  },
  "edit-02": {
    labels: ["pencil", "write", "modify"],
    description: "Pencil, to edit.",
  },
  "file-01": {
    labels: ["document", "page", "sheet"],
    description: "Sheet with a folded corner.",
  },
  filter: {
    labels: ["funnel", "refine", "narrow"],
    description: "Funnel, to filter a list.",
  },
  "folder-01": {
    labels: ["directory", "files"],
    description: "Folder.",
  },
  "home-01": {
    labels: ["house", "start", "dashboard"],
    description: "House, the home page.",
  },
  "information-circle": {
    labels: ["info", "help", "about"],
    description: "Letter i in a ring.",
  },
  "link-01": {
    labels: ["url", "chain", "hyperlink"],
    description: "Two links joined, a hyperlink.",
  },
  "logout-01": {
    labels: ["sign out", "exit", "leave"],
    description: "Arrow leaving a door frame, to sign out.",
  },
  "mail-01": {
    labels: ["email", "message", "envelope"],
    description: "Envelope.",
  },
  "menu-01": {
    labels: ["hamburger", "navigation", "list"],
    description: "Three bars, a menu.",
  },
  "more-horizontal": {
    labels: ["ellipsis", "options", "actions"],
    description: "Three dots, more actions.",
  },
  "notification-01": {
    labels: ["bell", "alert", "notify"],
    description: "Bell, notifications.",
  },
  star: {
    labels: ["favourite", "favorite", "rating"],
    description: "Five-pointed star.",
  },
  "upload-01": {
    labels: ["send", "import", "put"],
    description: "Arrow up out of a tray.",
  },
  user: {
    labels: ["person", "account", "profile", "member"],
    description: "One person.",
  },
  "alert-circle": {
    labels: ["error", "attention", "exclamation"],
    description: "Exclamation mark in a ring.",
  },
  "arrow-down-02": {
    labels: ["down", "bottom", "lower"],
    description: "Arrow pointing down.",
  },
  "arrow-left-02": {
    labels: ["back", "previous", "left"],
    description: "Arrow pointing left.",
  },
  "arrow-right-02": {
    labels: ["next", "forward", "right"],
    description: "Arrow pointing right.",
  },
  "arrow-up-02": {
    labels: ["up", "top", "raise"],
    description: "Arrow pointing up.",
  },
  "arrow-up-right-01": {
    labels: ["external", "open", "link"],
    description: "Arrow pointing up and right, to open elsewhere.",
  },
  "bookmark-01": {
    labels: ["save", "later", "mark"],
    description: "Bookmark ribbon.",
  },
  "cancel-circle": {
    labels: ["error", "close", "failed"],
    description: "Cross in a ring.",
  },
  "checkmark-circle-01": {
    labels: ["success", "done", "valid"],
    description: "Check mark in a ring.",
  },
  "grid-view": {
    labels: ["grid", "tiles", "dashboard"],
    description: "Four squares, a grid view.",
  },
  heart: {
    labels: ["like", "love", "favourite"],
    description: "Heart.",
  },
  "help-circle": {
    labels: ["question", "support", "faq"],
    description: "Question mark in a ring.",
  },
  "image-01": {
    labels: ["picture", "photo", "media"],
    description: "Picture with a sun and peaks.",
  },
  "location-01": {
    labels: ["pin", "map", "place"],
    description:
      "The larger shared pin, a round head and a pointed tip, with a ring centred in its head in the secondary tone.",
  },
  "lock-open": {
    labels: ["unlock", "unlocked", "open"],
    description: "Open padlock.",
  },
  "message-01": {
    labels: ["chat", "comment", "bubble"],
    description: "Speech bubble.",
  },
  "moon-02": {
    labels: ["dark", "theme", "night"],
    description: "Crescent moon, the dark theme.",
  },
  "more-vertical": {
    labels: ["ellipsis", "options", "kebab"],
    description: "Three stacked dots, more actions.",
  },
  pause: {
    labels: ["stop", "hold", "video"],
    description: "Two bars, pause.",
  },
  play: {
    labels: ["start", "run", "video"],
    description: "Play triangle.",
  },
  refresh: {
    labels: ["reload", "sync", "update"],
    description: "Two arrows in a circle, to refresh.",
  },
  "sidebar-left": {
    labels: ["panel", "layout", "navigation"],
    description: "Window with a left panel.",
  },
  "sun-01": {
    labels: ["light", "theme", "day"],
    description: "Sun, the light theme.",
  },
  "view-off": {
    labels: ["hide", "hidden", "invisible"],
    description: "Eye struck through, to hide.",
  },
  "arrow-up-down": {
    labels: ["sort", "order", "swap"],
    description: "Arrows up and down, to sort.",
  },
  "building-01": {
    labels: ["company", "office", "organisation"],
    description: "Building.",
  },
  "camera-01": {
    labels: ["photo", "picture", "capture"],
    description: "Camera.",
  },
  clipboard: {
    labels: ["paste", "notes", "task"],
    description: "Clipboard.",
  },
  "credit-card": {
    labels: ["card", "payment", "billing"],
    description: "Bank card.",
  },
  "dashboard-square-01": {
    labels: ["dashboard", "panels", "overview"],
    description: "Four panels, a dashboard.",
  },
  "flag-01": {
    labels: ["report", "mark", "milestone"],
    description: "Flag on a pole.",
  },
  gift: {
    labels: ["present", "reward", "offer"],
    description: "Gift box.",
  },
  "git-merge": {
    labels: ["merge", "branch", "join"],
    description: "Branch joining the main line.",
  },
  "git-pull-request": {
    labels: ["pull request", "review", "merge request"],
    description: "Branch proposed back to the main line.",
  },
  "maximize-01": {
    labels: ["fullscreen", "expand", "enlarge"],
    description: "Arrows out to the corners, to maximise.",
  },
  "mic-01": {
    labels: ["microphone", "audio", "voice"],
    description: "Microphone.",
  },
  "minimize-01": {
    labels: ["exit fullscreen", "shrink", "collapse"],
    description: "Arrows in to the centre, to minimise.",
  },
  "pie-chart": {
    labels: ["chart", "share", "analytics"],
    description: "Pie chart.",
  },
  printer: {
    labels: ["print", "paper"],
    description: "Printer.",
  },
  "shopping-cart-01": {
    labels: ["cart", "basket", "buy"],
    description: "Shopping cart.",
  },
  "volume-high": {
    labels: ["sound", "audio", "speaker"],
    description: "Speaker with sound waves.",
  },
  "wifi-01": {
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
    labels: ["archive", "store", "box"],
    description: "Archive box.",
  },
  "briefcase-01": {
    labels: ["work", "job", "business"],
    description: "Briefcase.",
  },
  "bug-01": {
    labels: ["bug", "issue", "debug"],
    description: "Bug.",
  },
  bulb: {
    labels: ["idea", "tip", "light"],
    description: "Light bulb, an idea.",
  },
  code: {
    labels: ["source", "developer", "brackets"],
    description: "Angle brackets around a slash, code.",
  },
  cpu: {
    labels: ["processor", "chip", "compute"],
    description: "Processor chip.",
  },
  "drag-drop-vertical": {
    labels: ["drag", "handle", "reorder"],
    description: "Drag handle, two columns of dots.",
  },
  hourglass: {
    labels: ["wait", "pending", "time"],
    description: "Hourglass, waiting.",
  },
  inbox: {
    labels: ["inbox", "messages", "tray"],
    description: "Inbox tray.",
  },
  "list-view": {
    labels: ["list", "items", "bullets"],
    description: "Bulleted list.",
  },
  "qr-code": {
    labels: ["scan", "code", "share"],
    description: "QR code.",
  },
  "server-stack-01": {
    labels: ["server", "hosting", "infrastructure"],
    description: "Two stacked server units.",
  },
  sparkles: {
    labels: ["ai", "magic", "new"],
    description: "Sparkles, for AI or something new.",
  },
  "text-align-left": {
    labels: ["text", "align", "paragraph"],
    description: "Lines aligned left.",
  },
  "lock-fill": {
    reference: "Filled variant of our own `lock`, drawn by hand on 2026-11-17.",
    labels: ["filled", "solid", "lock"],
    description: "Filled padlock, its keyhole cut out.",
  },
  "award-01": {
    labels: ["medal", "award", "badge"],
    description: "Medal on ribbons.",
  },
  bank: {
    labels: ["bank", "finance", "institution"],
    description: "Bank building.",
  },
  "battery-full": {
    labels: ["battery", "charge", "power"],
    description: "Full battery.",
  },
  "battery-low": {
    labels: ["battery", "charge", "power"],
    description: "Low battery.",
  },
  "car-01": {
    labels: ["car", "vehicle", "parking"],
    description: "Car seen from the front.",
  },
  "coffee-01": {
    labels: ["coffee", "break", "drink"],
    description: "Cup of coffee.",
  },
  compass: {
    labels: ["explore", "direction", "navigation"],
    description: "Compass.",
  },
  computer: {
    labels: ["monitor", "screen", "desktop"],
    description: "Monitor on a stand.",
  },
  crop: {
    labels: ["crop", "trim", "resize"],
    description: "Crop frame.",
  },
  fire: {
    labels: ["hot", "trending", "flame"],
    description: "Flame.",
  },
  headphones: {
    labels: ["audio", "music", "listen"],
    description: "Headphones.",
  },
  "invoice-01": {
    labels: ["invoice", "bill", "receipt"],
    description: "Invoice.",
  },
  keyboard: {
    labels: ["typing", "keys", "input"],
    description: "Keyboard.",
  },
  laptop: {
    labels: ["computer", "notebook", "device"],
    description: "Laptop.",
  },
  "layout-01": {
    labels: ["layout", "template", "page"],
    description: "Page layout with header and sidebar.",
  },
  "money-01": {
    labels: ["money", "cash", "banknote"],
    description: "Banknote.",
  },
  "mouse-01": {
    labels: ["mouse", "pointer", "click"],
    description: "Computer mouse.",
  },
  "music-note-01": {
    labels: ["music", "song", "audio"],
    description: "Two beamed notes.",
  },
  percent: {
    labels: ["percent", "discount", "rate"],
    description: "Percent sign.",
  },
  pin: {
    labels: ["pin", "attach", "fix"],
    description: "Push pin.",
  },
  "quote-up": {
    labels: ["quote", "citation", "text"],
    description: "Opening quotation marks.",
  },
  "redo-02": {
    labels: ["redo", "forward", "repeat"],
    description: "Arrow turning forward, to redo.",
  },
  scissor: {
    labels: ["cut", "scissors", "trim"],
    description: "Scissors.",
  },
  "shopping-bag-01": {
    labels: ["bag", "shop", "purchase"],
    description: "Shopping bag.",
  },
  "smart-phone-01": {
    labels: ["phone", "mobile", "device"],
    description: "Smartphone.",
  },
  "target-01": {
    labels: ["goal", "aim", "objective"],
    description: "Target.",
  },
  "text-align-center": {
    labels: ["text", "align", "centre"],
    description: "Lines centred.",
  },
  "text-align-right": {
    labels: ["text", "align", "right"],
    description: "Lines aligned right.",
  },
  "text-bold": {
    labels: ["bold", "format", "text"],
    description: "Bold letter B.",
  },
  "text-italic": {
    labels: ["italic", "format", "text"],
    description: "Italic letter I.",
  },
  trophy: {
    labels: ["win", "prize", "achievement"],
    description: "Trophy.",
  },
  truck: {
    labels: ["delivery", "shipping", "lorry"],
    description: "Lorry.",
  },
  "tv-01": {
    labels: ["television", "screen", "media"],
    description: "Television.",
  },
  umbrella: {
    labels: ["protection", "insurance", "rain"],
    description: "Umbrella.",
  },
  "undo-02": {
    labels: ["undo", "back", "revert"],
    description: "Arrow turning back, to undo.",
  },
  "video-01": {
    labels: ["video", "record", "camera"],
    description: "Video camera.",
  },
  "volume-low": {
    labels: ["sound", "quiet", "audio"],
    description: "Speaker with one wave, low volume.",
  },
  "volume-mute-01": {
    labels: ["mute", "silent", "sound off"],
    description: "Speaker struck by a cross, muted.",
  },
  "wallet-01": {
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
    labels: ["pulse", "activity", "monitoring"],
    description: "Pulse line.",
  },
  "airplane-01": {
    labels: ["plane", "travel", "flight"],
    description: "Aeroplane.",
  },
  anchor: {
    labels: ["anchor", "port", "stable"],
    description: "Anchor.",
  },
  "bar-chart": {
    labels: ["chart", "statistics", "bars"],
    description: "Bar chart.",
  },
  "binary-code": {
    labels: ["binary", "data", "bits"],
    description: "Binary digits.",
  },
  "chart-increase": {
    labels: ["growth", "trend", "increase"],
    description: "Rising line chart.",
  },
  crown: {
    labels: ["premium", "king", "best"],
    description: "Crown.",
  },
  "flask-conical": {
    labels: ["lab", "experiment", "beta"],
    description: "Flask.",
  },
  "game-controller-01": {
    labels: ["game", "play", "gamepad"],
    description: "Game controller.",
  },
  "git-commit": {
    labels: ["commit", "version", "history"],
    description: "Commit on a line.",
  },
  "git-compare": {
    labels: ["compare", "diff", "branches"],
    description: "Two branches pointing at each other, to compare.",
  },
  hashtag: {
    labels: ["hash", "channel", "tag"],
    description: "Hash sign.",
  },
  "loading-03": {
    labels: ["loading", "spinner", "wait"],
    description: "Spinner of dots.",
  },
  "login-01": {
    labels: ["sign in", "enter", "log in"],
    description: "Arrow entering a door frame, to sign in.",
  },
  news: {
    labels: ["newspaper", "article", "press"],
    description: "Newspaper.",
  },
  "notification-off-01": {
    labels: ["mute", "silent", "bell off"],
    description: "Bell struck through, notifications off.",
  },
  "pine-tree": {
    labels: ["tree", "nature", "forest"],
    description: "Pine tree.",
  },
  "radio-button": {
    labels: ["option", "select", "choice"],
    description: "Radio button, selected.",
  },
  "sad-01": {
    labels: ["sad", "face", "emoji"],
    description: "Sad face.",
  },
  "share-08": {
    labels: ["share", "network", "connect"],
    description: "Three connected nodes, to share.",
  },
  "sliders-horizontal": {
    labels: ["settings", "adjust", "controls"],
    description: "Two sliders.",
  },
  smile: {
    labels: ["happy", "face", "emoji"],
    description: "Smiling face.",
  },
  snow: {
    labels: ["snowflake", "cold", "winter"],
    description: "Snowflake.",
  },
  "star-half": {
    labels: ["rating", "half", "review"],
    description: "Half-filled star.",
  },
  "test-tube": {
    labels: ["test", "lab", "sample"],
    description: "Test tube.",
  },
  thermometer: {
    labels: ["temperature", "heat", "weather"],
    description: "Thermometer.",
  },
  "toggle-off": {
    labels: ["switch", "off", "disabled"],
    description: "Switch turned off.",
  },
  "toggle-on": {
    labels: ["switch", "on", "enabled"],
    description: "Switch turned on.",
  },
  "user-add-01": {
    labels: ["invite", "add member", "new user"],
    description: "Person with a plus, to add someone.",
  },
  "user-remove-01": {
    labels: ["remove member", "delete user"],
    description: "Person with a minus, to remove someone.",
  },
  "workflow-square-01": {
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
    labels: ["add", "plus", "create"],
    description: "Plus in a ring.",
  },
  "add-square": {
    labels: ["add", "plus", "create"],
    description: "Plus in a box.",
  },
  "alarm-clock": {
    labels: ["alarm", "wake", "reminder"],
    description: "Alarm clock.",
  },
  "arrow-down-left-01": {
    labels: ["arrow", "diagonal", "down left"],
    description: "Arrow pointing down and left.",
  },
  "arrow-down-right-01": {
    labels: ["arrow", "diagonal", "down right"],
    description: "Arrow pointing down and right.",
  },
  "arrow-up-left-01": {
    labels: ["arrow", "diagonal", "up left"],
    description: "Arrow pointing up and left.",
  },
  "backpack-01": {
    labels: ["backpack", "bag", "travel"],
    description: "Backpack.",
  },
  "balance-scale": {
    labels: ["balance", "law", "compare"],
    description: "Balance scale.",
  },
  "basketball-01": {
    labels: ["sport", "ball", "basketball"],
    description: "Basketball with its seams.",
  },
  bicycle: {
    labels: ["bike", "cycle", "ride"],
    description: "Bicycle.",
  },
  boat: {
    labels: ["sail", "boat", "sea"],
    description: "Sailing boat.",
  },
  "book-02": {
    labels: ["book", "read", "manual"],
    description: "Closed book with a label.",
  },
  "bus-01": {
    labels: ["bus", "transport", "transit"],
    description: "Bus seen from the front.",
  },
  calculator: {
    labels: ["calculator", "math", "compute"],
    description: "Calculator.",
  },
  call: {
    labels: ["phone", "call", "telephone"],
    description: "Phone handset.",
  },
  "cloud-snow": {
    labels: ["weather", "snow", "winter"],
    description: "Cloud with two snowflakes.",
  },
  "contact-01": {
    labels: ["contact", "card", "address"],
    description: "Contact card with a person.",
  },
  diamond: {
    labels: ["gem", "premium", "value"],
    description: "Cut diamond.",
  },
  dice: {
    labels: ["dice", "random", "game"],
    description: "Die showing two.",
  },
  "download-square-01": {
    labels: ["download", "save", "get"],
    description: "Arrow down in a box.",
  },
  "dumbbell-01": {
    labels: ["fitness", "gym", "sport"],
    description: "Dumbbell.",
  },
  "face-id": {
    labels: ["face", "recognition", "biometric"],
    description: "Face recognition.",
  },
  factory: {
    labels: ["factory", "industry", "plant"],
    description: "Factory.",
  },
  "fast-wind": {
    labels: ["wind", "weather", "air"],
    description: "Three gusts of wind.",
  },
  "film-01": {
    labels: ["film", "movie", "video"],
    description: "Film strip.",
  },
  "first-aid-kit": {
    labels: ["first aid", "health", "emergency"],
    description: "First-aid kit with a cross.",
  },
  flashlight: {
    labels: ["torch", "light", "beam"],
    description: "Torch shining up.",
  },
  "fuel-station": {
    labels: ["fuel", "petrol", "pump"],
    description: "Fuel pump.",
  },
  "heart-check": {
    labels: ["health", "care", "verified"],
    description: "Heart with a check mark.",
  },
  id: {
    labels: ["id", "identity", "card"],
    description: "ID card.",
  },
  "key-02": {
    labels: ["key", "access", "password"],
    description: "Key lying flat.",
  },
  "leaf-01": {
    labels: ["leaf", "nature", "eco"],
    description: "Leaf with its midrib.",
  },
  magnet: {
    labels: ["magnet", "attract", "pull"],
    description: "Horseshoe magnet.",
  },
  "mail-open-01": {
    labels: ["read", "envelope", "opened"],
    description: "Open envelope.",
  },
  "mail-send-01": {
    labels: ["send", "email", "outbox"],
    description: "Envelope with an arrow leaving it.",
  },
  "moon-cloud": {
    labels: ["weather", "night", "cloud"],
    description: "Crescent moon behind a cloud.",
  },
  mountain: {
    labels: ["mountain", "landscape", "outdoor"],
    description: "Two mountain peaks, one snow-capped.",
  },
  mushroom: {
    labels: ["mushroom", "nature", "fungus"],
    description: "Mushroom with a domed cap.",
  },
  next: {
    labels: ["next", "skip", "forward"],
    description: "Triangle and bar, skip forward.",
  },
  "parking-area-square": {
    labels: ["parking", "car park", "P"],
    description: "Parking sign.",
  },
  "password-validation": {
    labels: ["password", "field", "masked"],
    description: "Masked password field.",
  },
  "pause-circle": {
    labels: ["pause", "video", "hold"],
    description: "Pause bars in a ring.",
  },
  pencil: {
    labels: ["pencil", "write", "draw"],
    description: "Pencil standing up.",
  },
  pill: {
    labels: ["medicine", "capsule", "pharmacy"],
    description: "Capsule, half filled.",
  },
  "play-circle": {
    labels: ["play", "video", "start"],
    description: "Play triangle in a ring.",
  },
  previous: {
    labels: ["previous", "skip", "back"],
    description: "Bar and triangle, skip back.",
  },
  rain: {
    labels: ["weather", "rain", "drops"],
    description: "Cloud with three rain drops.",
  },
  rainbow: {
    labels: ["rainbow", "weather", "colour"],
    description: "Rainbow of three arcs.",
  },
  record: {
    labels: ["record", "media", "live"],
    description: "Solid disc, record.",
  },
  "remove-circle": {
    labels: ["remove", "minus", "delete"],
    description: "Minus in a ring.",
  },
  "remove-square": {
    labels: ["remove", "minus", "delete"],
    description: "Minus in a box.",
  },
  repeat: {
    labels: ["repeat", "loop", "again"],
    description: "Two arrows round a loop, to repeat.",
  },
  road: {
    labels: ["road", "route", "street"],
    description: "Road in perspective.",
  },
  "rocket-01": {
    labels: ["launch", "rocket", "ship"],
    description: "Rocket ready to launch.",
  },
  "route-01": {
    labels: ["route", "path", "journey"],
    description: "Route from start to destination.",
  },
  ruler: {
    labels: ["ruler", "measure", "size"],
    description: "Ruler with ticks.",
  },
  safe: {
    labels: ["safe", "vault", "secure"],
    description: "Safe with a dial.",
  },
  scan: {
    labels: ["scan", "capture", "frame"],
    description: "Scan frame with a scan line.",
  },
  school: {
    labels: ["school", "education", "building"],
    description: "School building.",
  },
  "shield-key": {
    labels: ["security", "access", "protection"],
    description: "Shield with a key.",
  },
  "shirt-01": {
    labels: ["shirt", "clothes", "merch"],
    description: "T-shirt.",
  },
  shuffle: {
    labels: ["shuffle", "random", "mix"],
    description: "Two crossing arrows, to shuffle.",
  },
  "sorting-01": {
    labels: ["sort", "order", "descending"],
    description: "Bars getting shorter, to sort.",
  },
  stethoscope: {
    labels: ["doctor", "health", "medical"],
    description: "Stethoscope.",
  },
  "sticky-note-01": {
    labels: ["note", "memo", "sticky"],
    description: "Sticky note with a folded corner.",
  },
  stop: {
    labels: ["stop", "media", "halt"],
    description: "Solid square, stop.",
  },
  "stop-circle": {
    labels: ["stop", "video", "halt"],
    description: "Stop square in a ring.",
  },
  "sun-cloud-01": {
    labels: ["weather", "partly sunny", "cloud"],
    description: "Sun behind a cloud.",
  },
  tent: {
    labels: ["camp", "tent", "outdoor"],
    description: "Tent.",
  },
  "tick-double-01": {
    labels: ["read", "delivered", "done"],
    description: "Double check mark.",
  },
  "timer-01": {
    labels: ["stopwatch", "timer", "duration"],
    description: "Stopwatch.",
  },
  toolbox: {
    labels: ["toolbox", "tools", "kit"],
    description: "Toolbox.",
  },
  "traffic-light": {
    labels: ["traffic", "signal", "road"],
    description: "Traffic light.",
  },
  "train-01": {
    labels: ["train", "rail", "transit"],
    description: "Train seen from the front.",
  },
  "user-circle": {
    labels: ["account", "profile", "avatar"],
    description: "Person in a ring.",
  },
  "watch-01": {
    labels: ["watch", "time", "wrist"],
    description: "Wristwatch.",
  },
  "wrench-01": {
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
    labels: ["attachment", "paperclip", "attach"],
    description: "Paper clip.",
  },
  "battery-empty": {
    labels: ["battery", "empty", "power"],
    description: "Empty battery.",
  },
  "bookmark-02": {
    labels: ["bookmark", "save", "ribbon"],
    description: "Rounded bookmark ribbon with a label bar.",
  },
  "chatting-01": {
    labels: ["chat", "conversation", "messages"],
    description: "Two overlapping speech bubbles.",
  },
  circle: {
    labels: ["circle", "ring", "round"],
    description: "Empty ring using the full grid.",
  },
  "cursor-01": {
    labels: ["cursor", "pointer", "mouse"],
    description: "Solid mouse pointer.",
  },
  "divide-sign": {
    labels: ["divide", "division", "math"],
    description: "Division sign.",
  },
  "equal-sign": {
    labels: ["equal", "equals", "math"],
    description: "Equal sign.",
  },
  eraser: {
    labels: ["eraser", "erase", "clear"],
    description: "Eraser lying on the line it erased.",
  },
  flower: {
    labels: ["flower", "bloom", "nature"],
    description: "Four-petal flower seen from above.",
  },
  "minus-sign-square": {
    labels: ["minus", "remove", "box"],
    description: "Minus in a rounded box.",
  },
  "multiplication-sign": {
    labels: ["multiply", "times", "math"],
    description: "Multiplication sign.",
  },
  sent: {
    labels: ["send", "paper plane", "message"],
    description: "Paper plane heading up and right.",
  },
  "sidebar-right": {
    labels: ["sidebar", "panel", "layout"],
    description: "Window with a panel on the right.",
  },
  square: {
    labels: ["square", "box", "shape"],
    description: "Empty square with rounded corners.",
  },
  "thumbs-down": {
    labels: ["dislike", "reject", "thumb"],
    description: "Thumbs down: the thumbs-up hand turned over.",
  },
  "thumbs-up": {
    labels: ["like", "approve", "thumb"],
    description:
      "Thumbs up: the fist of the set turned a quarter turn, a cuff on the left, a thumb rising from it.",
  },
  triangle: {
    labels: ["triangle", "shape", "pyramid"],
    description: "Triangle pointing up with rounded corners.",
  },
  "alarm-clock-off": {
    labels: ["alarm", "off", "silent"],
    description: "Alarm clock struck through.",
  },
  antenna: {
    labels: ["antenna", "broadcast", "signal"],
    description: "Antenna sending waves.",
  },
  "archive-02": {
    labels: ["cabinet", "archive", "drawers"],
    description: "Filing cabinet with two drawers.",
  },
  "arrow-expand-01": {
    labels: ["expand", "enlarge", "fullscreen"],
    description: "Two diagonal arrows pointing out.",
  },
  "arrow-shrink-01": {
    labels: ["shrink", "reduce", "collapse"],
    description: "Two diagonal arrows pointing in.",
  },
  barcode: {
    labels: ["barcode", "scan", "product"],
    description: "Barcode.",
  },
  "battery-charging-01": {
    labels: ["battery", "charging", "power"],
    description: "Charging battery.",
  },
  "bell-dot": {
    labels: ["bell", "unread", "notification"],
    description: "Bell with a notification dot.",
  },
  bluetooth: {
    labels: ["bluetooth", "wireless", "pairing"],
    description: "Bluetooth rune.",
  },
  "bookmark-add-01": {
    labels: ["bookmark", "add", "save"],
    description: "Bookmark with a plus.",
  },
  "bookmark-check-01": {
    labels: ["bookmark", "saved", "done"],
    description: "Bookmark with a check.",
  },
  "bookmark-remove-01": {
    labels: ["bookmark", "remove", "unsave"],
    description: "Bookmark with a minus.",
  },
  "bug-02": {
    labels: ["bug", "beetle", "debug"],
    description: "Beetle with a split shell.",
  },
  "calendar-add-01": {
    labels: ["calendar", "add", "event"],
    description: "Calendar with a plus badge.",
  },
  "calendar-check-in-01": {
    labels: ["calendar", "check in", "confirmed"],
    description: "Calendar with a check badge.",
  },
  "calendar-lock-01": {
    labels: ["calendar", "locked", "private"],
    description: "Calendar with a padlock badge.",
  },
  "calendar-remove-01": {
    labels: ["calendar", "remove", "event"],
    description: "Calendar with a minus badge.",
  },
  "cancel-square": {
    labels: ["cancel", "close", "box"],
    description: "Cross in a box.",
  },
  "checkmark-square-02": {
    labels: ["done", "checkbox", "ticked"],
    description: "Check in a square box.",
  },
  "circle-arrow-down-01": {
    labels: ["arrow", "down", "circle"],
    description: "Arrow down in a ring.",
  },
  "circle-arrow-left-01": {
    labels: ["arrow", "left", "circle"],
    description: "Arrow left in a ring.",
  },
  "circle-arrow-right-01": {
    labels: ["arrow", "right", "circle"],
    description: "Arrow right in a ring.",
  },
  "circle-arrow-up-01": {
    labels: ["arrow", "up", "circle"],
    description: "Arrow up in a ring.",
  },
  "clock-02": {
    labels: ["clock", "time", "hour"],
    description: "Clock with two-pixel hands.",
  },
  "cloud-off": {
    labels: ["cloud", "offline", "disconnected"],
    description: "Cloud struck through.",
  },
  "comment-01": {
    labels: ["comment", "text", "reply"],
    description: "Speech bubble with two lines of text.",
  },
  "comment-add-01": {
    labels: ["comment", "add", "new"],
    description: "Speech bubble with a plus.",
  },
  "ethernet-port": {
    labels: ["ethernet", "network", "port"],
    description: "Ethernet socket.",
  },
  favourite: {
    labels: ["favourite", "like", "heart"],
    description: "Heart.",
  },
  "file-add": {
    labels: ["file", "new", "create"],
    description: "File with a plus badge.",
  },
  "file-download": {
    labels: ["file", "download", "save"],
    description: "File with a download arrow badge.",
  },
  "file-image": {
    labels: ["file", "image", "picture"],
    description: "File with a mountain inside.",
  },
  "file-lock": {
    labels: ["file", "locked", "private"],
    description: "File with a padlock badge.",
  },
  "file-music": {
    labels: ["file", "music", "audio"],
    description: "File with a note inside.",
  },
  "file-remove": {
    labels: ["file", "delete", "remove"],
    description: "File with a minus badge.",
  },
  "file-search": {
    labels: ["file", "search", "find"],
    description: "File with a magnifier badge.",
  },
  "file-upload": {
    labels: ["file", "upload", "send"],
    description: "File with an upload arrow badge.",
  },
  "file-video": {
    labels: ["file", "video", "movie"],
    description: "File with a play triangle inside.",
  },
  "filter-add": {
    labels: ["filter", "add", "refine"],
    description: "Funnel with a plus.",
  },
  "filter-remove": {
    labels: ["filter", "remove", "clear"],
    description: "Funnel with a minus.",
  },
  "folder-add": {
    labels: ["folder", "new", "create"],
    description: "Folder with a plus badge.",
  },
  "folder-download": {
    labels: ["folder", "download", "save"],
    description: "Folder with a download arrow badge.",
  },
  "folder-lock": {
    labels: ["folder", "locked", "private"],
    description: "Folder with a padlock badge.",
  },
  "folder-open": {
    labels: ["folder", "open", "browse"],
    description: "Open folder.",
  },
  "folder-remove": {
    labels: ["folder", "delete", "remove"],
    description: "Folder with a minus badge.",
  },
  "folder-upload": {
    labels: ["folder", "upload", "send"],
    description: "Folder with an upload arrow badge.",
  },
  "git-pull-request-closed": {
    labels: ["pull request", "closed", "rejected"],
    description: "Closed pull request.",
  },
  "hard-drive": {
    labels: ["disk", "storage", "drive"],
    description: "Hard drive.",
  },
  "hourglass-off": {
    labels: ["hourglass", "off", "no wait"],
    description: "Hourglass struck through.",
  },
  "inbox-download": {
    labels: ["inbox", "receive", "download"],
    description: "Arrow dropping into a tray.",
  },
  "inbox-upload": {
    labels: ["inbox", "send", "upload"],
    description: "Arrow rising out of a tray.",
  },
  "infinity-01": {
    labels: ["infinity", "unlimited", "loop"],
    description: "Infinity sign.",
  },
  "mail-02": {
    labels: ["mail", "email", "envelope"],
    description: "Envelope with cut corners.",
  },
  "mail-add-01": {
    labels: ["mail", "add", "new"],
    description: "Envelope with a plus badge.",
  },
  "mail-lock-01": {
    labels: ["mail", "lock", "encrypted"],
    description: "Envelope with a padlock badge.",
  },
  "mail-remove-01": {
    labels: ["mail", "remove", "delete"],
    description: "Envelope with a minus badge.",
  },
  "message-add-01": {
    labels: ["message", "add", "new"],
    description: "Speech bubble with a plus badge.",
  },
  "message-notification-01": {
    labels: ["message", "unread", "notification"],
    description: "Speech bubble with a notification dot.",
  },
  nfc: {
    labels: ["contactless", "nfc", "tap"],
    description: "Contactless waves.",
  },
  notebook: {
    labels: ["notebook", "notes", "journal"],
    description: "Notebook with spiral rings.",
  },
  "notification-02": {
    labels: ["bell", "notification", "alert"],
    description: "Bell with a rounded top.",
  },
  "notification-snooze-01": {
    labels: ["snooze", "bell", "later"],
    description: "Bell with a Z, snoozed.",
  },
  "quote-down": {
    labels: ["quote", "citation", "closing"],
    description: "Closing quotation marks.",
  },
  radio: {
    labels: ["radio", "audio", "broadcast"],
    description: "Radio with a speaker and an antenna.",
  },
  "rotate-left-01": {
    labels: ["rotate", "anticlockwise", "turn"],
    description: "Arrow turning anticlockwise.",
  },
  "rotate-right-01": {
    labels: ["rotate", "clockwise", "turn"],
    description: "Arrow turning clockwise.",
  },
  router: {
    labels: ["router", "network", "wireless"],
    description: "Router with two antennas.",
  },
  "search-add": {
    labels: ["zoom in", "magnify", "search"],
    description: "Magnifier with a plus.",
  },
  "search-minus": {
    labels: ["zoom out", "magnify", "search"],
    description: "Magnifier with a minus.",
  },
  "search-remove": {
    labels: ["clear search", "magnify", "cancel"],
    description: "Magnifier with a cross.",
  },
  "server-stack-02": {
    labels: ["server", "rack", "infrastructure"],
    description: "Server rack of three units.",
  },
  "shield-user": {
    labels: ["shield", "user", "security"],
    description: "Shield with a person inside.",
  },
  signal: {
    labels: ["signal", "network", "strength"],
    description: "Four rising signal bars.",
  },
  "sort-by-down-01": {
    labels: ["sort", "descending", "order"],
    description: "Arrow down beside shortening bars.",
  },
  "square-arrow-up-01": {
    labels: ["arrow", "up", "box"],
    description: "Arrow up in a box.",
  },
  "task-01": {
    labels: ["task", "todo", "checklist"],
    description: "Two tasks with empty boxes.",
  },
  "task-done-01": {
    labels: ["done", "completed", "checklist"],
    description: "Two tasks checked off.",
  },
  "time-quarter-pass": {
    labels: ["quarter", "time", "elapsed"],
    description: "Clock with a quarter of its ring marked.",
  },
  "timer-02": {
    labels: ["stopwatch", "timer", "duration"],
    description: "Stopwatch with side buttons.",
  },
  "user-block-01": {
    labels: ["user", "block", "ban"],
    description: "Person with a no-entry badge.",
  },
  "user-lock-01": {
    labels: ["user", "lock", "private"],
    description: "Person with a padlock badge.",
  },
  "user-question-01": {
    labels: ["user", "question", "unknown"],
    description: "Person with a question-mark badge.",
  },
  "user-shield-01": {
    labels: ["user", "shield", "protected"],
    description: "Person with a shield badge.",
  },
  "user-star-01": {
    labels: ["user", "star", "favourite"],
    description: "Person with a star badge.",
  },
  users: {
    labels: ["people", "team", "members"],
    description: "Two people, one behind the other.",
  },
  "wifi-off-01": {
    labels: ["wifi", "offline", "disconnected"],
    description: "Wi-Fi struck through.",
  },
  "zoom-in-area": {
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
    labels: ["warning", "critical", "attention"],
    description: "Exclamation mark in a diamond.",
  },
  "alert-square": {
    labels: ["warning", "error", "attention"],
    description: "Exclamation mark in a box.",
  },
  at: {
    labels: ["at", "email", "mention"],
    description: "At sign.",
  },
  "call-blocked": {
    labels: ["blocked", "call", "phone"],
    description: "Handset with a no-entry badge.",
  },
  "call-end-01": {
    labels: ["hang up", "end call", "phone"],
    description: "Handset lying upside down, to hang up.",
  },
  "camera-off-01": {
    labels: ["camera", "off", "disabled"],
    description: "Camera struck through.",
  },
  "certificate-01": {
    labels: ["certificate", "diploma", "award"],
    description: "Certificate with a seal and ribbons.",
  },
  "chart-decrease": {
    labels: ["decline", "trend", "decrease"],
    description: "Falling line chart.",
  },
  "chart-line-data-01": {
    labels: ["chart", "data", "analytics"],
    description: "Line chart through data points.",
  },
  "checkmark-badge-01": {
    labels: ["verified", "badge", "approved"],
    description: "Rosette badge with a check mark.",
  },
  "cloud-download": {
    labels: ["download", "cloud", "sync"],
    description: "Arrow dropping out through the base of a cloud.",
  },
  "cloud-upload": {
    labels: ["upload", "cloud", "sync"],
    description: "Arrow rising through the base of a cloud.",
  },
  "color-picker": {
    labels: ["eyedropper", "colour", "pick"],
    description: "Eyedropper with a drop.",
  },
  command: {
    labels: ["command", "shortcut", "key"],
    description: "Command key sign.",
  },
  "dollar-circle": {
    labels: ["dollar", "money", "price"],
    description: "Dollar sign in a ring.",
  },
  "door-01": {
    labels: ["door", "entrance", "room"],
    description: "Door with its knob.",
  },
  "drag-drop-horizontal": {
    labels: ["drag", "handle", "reorder"],
    description: "Drag handle, two rows of dots.",
  },
  "euro-circle": {
    labels: ["euro", "money", "price"],
    description: "Euro sign in a ring.",
  },
  "file-check": {
    labels: ["file", "approved", "done"],
    description: "File with a check badge.",
  },
  "file-edit": {
    labels: ["file", "edit", "modify"],
    description: "File with a pencil badge.",
  },
  "filter-horizontal": {
    labels: ["filter", "refine", "narrow"],
    description: "Three centred lines getting shorter.",
  },
  "floppy-disk": {
    labels: ["save", "disk", "store"],
    description: "Floppy disk, to save.",
  },
  "folder-favourite": {
    labels: ["folder", "favourite", "starred"],
    description: "Folder with a star badge.",
  },
  heading: {
    labels: ["heading", "title", "text"],
    description: "Letter H, a heading.",
  },
  "help-square": {
    labels: ["help", "question", "faq"],
    description: "Question mark in a box.",
  },
  hierarchy: {
    labels: ["org chart", "structure", "tree"],
    description: "Root node with three children.",
  },
  highlighter: {
    labels: ["highlight", "marker", "annotate"],
    description: "Highlighter over a highlight stroke.",
  },
  history: {
    labels: ["history", "recent", "log"],
    description: "Clock whose ring turns back on itself.",
  },
  "image-add-01": {
    labels: ["image", "add", "upload"],
    description: "Picture with a plus badge.",
  },
  "image-upload": {
    labels: ["image", "upload", "send"],
    description: "Picture with an upload arrow badge.",
  },
  "information-square": {
    labels: ["info", "about", "help"],
    description: "Letter i in a box.",
  },
  "left-to-right-list-number": {
    labels: ["numbered list", "ordered", "list"],
    description: "Numbered list.",
  },
  "link-square-02": {
    labels: ["external link", "open", "new tab"],
    description: "Arrow leaving a box, an external link.",
  },
  "logout-square-01": {
    labels: ["sign out", "exit", "leave"],
    description: "Arrow leaving a bracket.",
  },
  "magic-wand-01": {
    labels: ["magic", "auto", "ai"],
    description: "Magic wand with a sparkle.",
  },
  "menu-collapse": {
    labels: ["menu", "collapse", "navigation"],
    description: "Three bars with a chevron pointing left.",
  },
  "mic-off-01": {
    labels: ["mute", "microphone", "off"],
    description: "Microphone struck through, muted.",
  },
  "money-bag-02": {
    labels: ["money", "savings", "funds"],
    description: "Money bag with its tie.",
  },
  "mortarboard-01": {
    labels: ["graduation", "education", "diploma"],
    description: "Graduation cap with its tassel.",
  },
  move: {
    labels: ["move", "drag", "arrows"],
    description: "Four arrows pointing out, to move.",
  },
  "navigation-03": {
    labels: ["navigation", "location", "direction"],
    description: "Solid location arrow pointing up and right.",
  },
  "note-add": {
    labels: ["note", "add", "new"],
    description: "Note with a plus badge.",
  },
  package: {
    labels: ["parcel", "box", "delivery"],
    description: "Parcel with tape, in oblique view.",
  },
  "panel-left-close": {
    labels: ["panel", "sidebar", "collapse"],
    description: "Window with its left panel and a chevron pointing left.",
  },
  "pin-off": {
    labels: ["unpin", "pin", "off"],
    description: "Push pin struck through, unpinned.",
  },
  "power-service": {
    labels: ["power", "on off", "shutdown"],
    description: "Power button.",
  },
  "presentation-01": {
    labels: ["presentation", "slides", "board"],
    description: "Presentation board on an easel.",
  },
  "receipt-dollar": {
    labels: ["receipt", "payment", "bill"],
    description: "Receipt with a dollar sign.",
  },
  "screen-share": {
    labels: ["share screen", "present", "monitor"],
    description: "Monitor with an arrow rising out of it.",
  },
  "sort-by-up-01": {
    labels: ["sort", "ascending", "order"],
    description: "Arrow up beside lengthening bars.",
  },
  "star-off": {
    labels: ["unfavourite", "star", "off"],
    description: "Star struck through.",
  },
  "store-01": {
    labels: ["shop", "store", "retail"],
    description: "Shop with a striped awning.",
  },
  "tag-01": {
    labels: ["tag", "price", "label"],
    description: "Price tag at 45\u00b0 with its hole.",
  },
  "task-add-01": {
    labels: ["task", "add", "todo"],
    description: "Task list with a plus badge.",
  },
  text: {
    labels: ["text", "type", "font"],
    description: "Letter T, text.",
  },
  "text-indent": {
    labels: ["indent", "text", "paragraph"],
    description: "Indented lines with an arrow.",
  },
  "text-strikethrough": {
    labels: ["strikethrough", "format", "text"],
    description: "Struck-through letter S.",
  },
  "text-underline": {
    labels: ["underline", "format", "text"],
    description: "Underlined letter U.",
  },
  "unlink-01": {
    labels: ["unlink", "broken", "detach"],
    description: "Two link halves pulled apart.",
  },
  "user-account": {
    labels: ["account", "profile", "avatar"],
    description: "Person in a box.",
  },
  "user-check-01": {
    labels: ["user", "verified", "approved"],
    description: "Person with a check badge.",
  },
  "user-edit-01": {
    labels: ["user", "edit", "profile"],
    description: "Person with a pencil badge.",
  },
  "user-settings-01": {
    labels: ["user", "settings", "preferences"],
    description: "Person with a cog badge.",
  },
  "video-off": {
    labels: ["video", "camera off", "off"],
    description: "Video camera struck through.",
  },
  anthropic: {
    category: "brands",
    labels: ["anthropic", "claude", "ai", "logo"],
    description: "The Anthropic mark: the A with its small counter and the slanted bar beside it.",
    reference:
      "simple-icons:anthropic (Iconify, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "Anthropic and the Anthropic logo are trademarks of Anthropic, PBC, used here only to refer to Anthropic.",
  },
  mistral: {
    category: "brands",
    labels: ["mistral", "mistral ai", "ai", "logo"],
    description: "The Mistral AI mark: an M built of square blocks on a wide base.",
    reference:
      "simple-icons:mistralai (Iconify, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "Mistral AI and the Mistral AI logo are trademarks of Mistral AI, used here only to refer to Mistral AI.",
  },
  openai: {
    category: "brands",
    labels: ["openai", "chatgpt", "ai", "logo"],
    description: "The OpenAI mark: six interlaced links round a hexagonal hole.",
    reference:
      "simple-icons:openai (Iconify, fetched 2026-11-17): rasterised to 16\u00d716, then redrawn by hand (2026-11-17, docs/icons.md).",
    trademark:
      "OpenAI and the OpenAI logo are trademarks of OpenAI, used here only to refer to OpenAI.",
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
  accessibility: {
    labels: ["accessibility", "a11y", "person"],
    description: "Figure with arms spread, accessibility.",
  },
  "ai-idea": {
    labels: ["idea", "ai", "inspiration"],
    description: "Light bulb with rays.",
  },
  "arrow-left-right": {
    labels: ["swap", "exchange", "arrows"],
    description: "Arrow left over arrow right, symmetric by a half turn.",
  },
  "arrow-turn-backward": {
    labels: ["turn", "back", "arrow"],
    description: "Arrow rising and turning left.",
  },
  "arrow-turn-forward": {
    labels: ["turn", "forward", "arrow"],
    description: "Arrow rising and turning right.",
  },
  bot: {
    labels: ["bot", "robot", "assistant"],
    description: "Bot head with an antenna, ears, eyes and a mouth.",
  },
  "building-02": {
    labels: ["tower", "building", "office"],
    description: "Tower with windows and a door.",
  },
  "calendar-01": {
    labels: ["calendar", "date", "today"],
    description: "Calendar with a header line and today marked.",
  },
  "calendar-download-01": {
    labels: ["calendar", "download", "import"],
    description: "Calendar with a download arrow badge.",
  },
  "calendar-favorite-01": {
    labels: ["calendar", "favourite", "starred"],
    description: "Calendar with a star badge.",
  },
  "calendar-upload-01": {
    labels: ["calendar", "upload", "export"],
    description: "Calendar with an upload arrow badge.",
  },
  "call-incoming-01": {
    labels: ["incoming", "call", "phone"],
    description: "Handset with an incoming arrow.",
  },
  "call-missed-01": {
    labels: ["missed", "call", "phone"],
    description: "Handset with a small cross.",
  },
  "call-outgoing-01": {
    labels: ["outgoing", "call", "phone"],
    description: "Handset with an outgoing arrow.",
  },
  "chat-01": {
    labels: ["chat", "typing", "conversation"],
    description: "Speech bubble with three dots.",
  },
  "chat-bot": {
    labels: ["chatbot", "assistant", "ai"],
    description: "Speech bubble with a bot's antenna and eyes.",
  },
  "city-01": {
    labels: ["city", "buildings", "skyline"],
    description: "Three buildings of different heights.",
  },
  "clock-03": {
    labels: ["clock", "time", "square"],
    description: "Square clock.",
  },
  "cloud-angled-rain": {
    labels: ["rain", "weather", "storm"],
    description: "Cloud with slanted rain streaks.",
  },
  "cloud-angled-zap": {
    labels: ["storm", "lightning", "weather"],
    description: "Cloud struck by a lightning bolt.",
  },
  "cloud-saving-done-01": {
    labels: ["saved", "cloud", "synced"],
    description: "Cloud with a check mark.",
  },
  "comment-02": {
    labels: ["comment", "reply", "text"],
    description: "Speech bubble with two lines, tail on the right.",
  },
  "contact-book": {
    labels: ["contacts", "address book", "directory"],
    description: "Address book with index tabs.",
  },
  "delivery-truck-01": {
    labels: ["delivery", "shipping", "fast"],
    description: "Lorry with speed lines behind it.",
  },
  "download-04": {
    labels: ["download", "save", "get"],
    description: "Solid arrow down over an open tray.",
  },
  "exchange-01": {
    labels: ["exchange", "swap", "convert"],
    description: "Arrow right over arrow left, their tails bent towards each other.",
  },
  "gps-01": {
    labels: ["gps", "location", "position"],
    description: "The shared map pin with its tip in a ring in the secondary tone, a position fix.",
  },
  headset: {
    labels: ["headset", "support", "call"],
    description: "Headphones with a boom microphone.",
  },
  "heart-add": {
    labels: ["heart", "add", "like"],
    description: "Heart with a plus badge.",
  },
  "heart-remove": {
    labels: ["heart", "remove", "unlike"],
    description: "Heart with a minus badge.",
  },
  "home-02": {
    labels: ["house", "home", "building"],
    description: "House with a solid roof and a door.",
  },
  "hospital-01": {
    labels: ["hospital", "health", "clinic"],
    description: "Building with a cross.",
  },
  "hospital-bed-01": {
    labels: ["hospital", "bed", "patient"],
    description: "Hospital bed with a patient lying down.",
  },
  "hotel-01": {
    labels: ["hotel", "bed", "stay"],
    description: "Bed with a pillow, a hotel.",
  },
  "id-verified": {
    labels: ["id", "verified", "identity"],
    description: "ID card with a check badge.",
  },
  "inbox-check": {
    labels: ["inbox", "done", "cleared"],
    description: "Inbox tray with a check.",
  },
  "live-streaming-01": {
    labels: ["live", "stream", "broadcast"],
    description: "Dot between two pairs of arcs, live.",
  },
  "mail-open-02": {
    labels: ["mail", "letter", "read"],
    description: "Open envelope with a letter rising out.",
  },
  "mail-receive-01": {
    labels: ["receive", "mail", "incoming"],
    description: "Arrow coming down into an envelope.",
  },
  "mail-send-02": {
    labels: ["send", "mail", "outgoing"],
    description: "Envelope with speed lines.",
  },
  man: {
    labels: ["man", "male", "person"],
    description: "Man pictogram.",
  },
  "map-pin": {
    labels: ["pin", "map", "place"],
    description:
      "The shared outline pin with a dot in its head, standing on a ground arc in the secondary tone.",
  },
  maps: {
    labels: ["map", "directions", "travel"],
    description: "Folded map in three panels.",
  },
  "maps-location-01": {
    labels: ["map", "location", "pin"],
    description: "The shared map pin above a three-panel folded map in the secondary tone.",
  },
  "medicine-02": {
    labels: ["medicine", "bottle", "pharmacy"],
    description: "Medicine bottle with a cross.",
  },
  "message-done-01": {
    labels: ["message", "done", "read"],
    description: "Speech bubble with a check badge.",
  },
  "message-edit-01": {
    labels: ["message", "edit", "modify"],
    description: "Speech bubble with a pencil badge.",
  },
  "message-question": {
    labels: ["message", "question", "help"],
    description: "Speech bubble with a question-mark badge.",
  },
  "notification-square": {
    labels: ["notification", "badge", "unread"],
    description: "Square with a notification dot.",
  },
  "parking-area-circle": {
    labels: ["parking", "car park", "P"],
    description: "Parking P in a ring.",
  },
  "phone-call": {
    labels: ["phone", "call", "ringing"],
    description: "Handset with sound waves.",
  },
  "playlist-01": {
    labels: ["playlist", "music", "queue"],
    description: "List lines with a music note.",
  },
  podcast: {
    labels: ["podcast", "audio", "broadcast"],
    description: "Microphone inside two open arcs.",
  },
  "police-car": {
    labels: ["police", "car", "emergency"],
    description: "Car with a light on the roof.",
  },
  "pulse-01": {
    labels: ["pulse", "heartbeat", "health"],
    description: "Heart crossed by a pulse line.",
  },
  "route-02": {
    labels: ["route", "path", "journey"],
    description: "Route from a start node to a pin.",
  },
  rss: {
    labels: ["rss", "feed", "subscribe"],
    description: "RSS feed symbol.",
  },
  "scooter-01": {
    labels: ["scooter", "kick scooter", "ride"],
    description: "Kick scooter.",
  },
  "share-05": {
    labels: ["share", "export", "send"],
    description: "Arrow rising out of an open box.",
  },
  speaker: {
    labels: ["speaker", "audio", "sound"],
    description: "Loudspeaker box with tweeter and woofer.",
  },
  sunrise: {
    labels: ["sunrise", "morning", "dawn"],
    description: "Arrow up over half a sun on the horizon.",
  },
  sunset: {
    labels: ["sunset", "evening", "dusk"],
    description: "Arrow down over half a sun on the horizon.",
  },
  syringe: {
    labels: ["syringe", "vaccine", "injection"],
    description: "Syringe at 45\u00b0.",
  },
  taxi: {
    labels: ["taxi", "cab", "car"],
    description: "Car with a taxi sign on the roof.",
  },
  temperature: {
    labels: ["temperature", "thermometer", "weather"],
    description: "Thermometer with scale marks.",
  },
  "time-02": {
    labels: ["time", "clock", "hour"],
    description: "Clock with one hand up and one at 45\u00b0.",
  },
  "upload-04": {
    labels: ["upload", "send", "import"],
    description: "Solid arrow up over an open tray.",
  },
  "user-group-02": {
    labels: ["group", "team", "people"],
    description: "A person in front of two others.",
  },
  "user-id-verification": {
    labels: ["identity", "verification", "kyc"],
    description: "Person inside scan brackets.",
  },
  "user-multiple": {
    labels: ["people", "users", "members"],
    description: "Two people side by side.",
  },
  voicemail: {
    labels: ["voicemail", "message", "phone"],
    description: "Two rings joined at the bottom, voicemail.",
  },
  "volume-off": {
    labels: ["volume", "off", "silent"],
    description: "Speaker struck through.",
  },
  walking: {
    labels: ["walk", "pedestrian", "person"],
    description: "Person walking.",
  },
  warehouse: {
    labels: ["warehouse", "storage", "depot"],
    description: "Warehouse with a roller door.",
  },
  wheelchair: {
    labels: ["wheelchair", "accessible", "disability"],
    description: "Person in a wheelchair.",
  },
  woman: {
    labels: ["woman", "female", "person"],
    description: "Woman pictogram with a dress.",
  },
  "warehouse-fill": {
    reference: "Filled variant of our own `warehouse`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "warehouse"],
    description: "Filled: warehouse with a roller door.",
  },
  "calendar-01-fill": {
    reference: "Filled variant of our own `calendar-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "calendar"],
    description: "Filled: calendar with a header line and today marked.",
  },
  "time-02-fill": {
    reference: "Filled variant of our own `time-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "time"],
    description: "Filled: clock with one hand up and one at 45\u00b0.",
  },
  "clock-03-fill": {
    reference: "Filled variant of our own `clock-03`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "clock"],
    description: "Filled: square clock.",
  },
  "medicine-02-fill": {
    reference: "Filled variant of our own `medicine-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "medicine"],
    description: "Filled: medicine bottle with a cross.",
  },
  "chat-bot-fill": {
    reference: "Filled variant of our own `chat-bot`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "chat"],
    description: "Filled: speech bubble with a bot's antenna and eyes.",
  },
  "bot-fill": {
    reference: "Filled variant of our own `bot`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bot"],
    description: "Filled: bot head with an antenna, ears, eyes and a mouth.",
  },
  "contact-book-fill": {
    reference:
      "Filled variant of our own `contact-book`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "contact"],
    description: "Filled: address book with index tabs.",
  },
  "chat-01-fill": {
    reference: "Filled variant of our own `chat-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "chat"],
    description: "Filled: speech bubble with three dots.",
  },
  "comment-02-fill": {
    reference: "Filled variant of our own `comment-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "comment"],
    description: "Filled: speech bubble with two lines, tail on the right.",
  },
  "speaker-fill": {
    reference: "Filled variant of our own `speaker`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "speaker"],
    description: "Filled: loudspeaker box with tweeter and woofer.",
  },
  "album-02": {
    labels: ["album", "gallery", "photos"],
    description: "Picture in front of a second frame.",
  },
  "alert-02": {
    labels: ["alert", "stop", "octagon"],
    description: "Exclamation mark in an octagon.",
  },
  "analytics-01": {
    labels: ["analytics", "dashboard", "screen"],
    description: "Screen on a stand with a data line.",
  },
  "analytics-down": {
    labels: ["analytics", "decline", "down"],
    description: "Screen with an arrow falling.",
  },
  "analytics-up": {
    labels: ["analytics", "growth", "up"],
    description: "Screen with an arrow climbing.",
  },
  apartment: {
    labels: ["apartment", "flats", "residence"],
    description: "Apartment block with six windows and a door.",
  },
  "arrow-down-double": {
    labels: ["double chevron", "down", "expand"],
    description: "Double chevron pointing down.",
  },
  "arrow-down-left-02": {
    labels: ["arrow", "diagonal", "down left"],
    description: "Heavy arrow pointing down and left.",
  },
  "arrow-down-right-02": {
    labels: ["arrow", "diagonal", "down right"],
    description: "Heavy arrow pointing down and right.",
  },
  "arrow-left-double": {
    labels: ["double chevron", "previous", "back"],
    description: "Double chevron pointing left.",
  },
  "arrow-right-double": {
    labels: ["double chevron", "next", "forward"],
    description: "Double chevron pointing right.",
  },
  "arrow-up-double": {
    labels: ["double chevron", "up", "collapse"],
    description: "Double chevron pointing up.",
  },
  "arrow-up-left-02": {
    labels: ["arrow", "diagonal", "up left"],
    description: "Heavy arrow pointing up and left.",
  },
  "arrow-up-right-02": {
    labels: ["arrow", "diagonal", "up right"],
    description: "Heavy arrow pointing up and right.",
  },
  "barcode-scan": {
    labels: ["barcode", "scan", "product"],
    description: "Barcode between scan corner brackets.",
  },
  "battery-medium-01": {
    labels: ["battery", "half", "power"],
    description: "Battery half charged.",
  },
  beer: {
    labels: ["beer", "drink", "pub"],
    description: "Beer mug under a head of foam.",
  },
  "book-01": {
    labels: ["book", "read", "guide"],
    description: "Closed book with a thick spine and a title.",
  },
  "book-edit": {
    labels: ["book", "edit", "write"],
    description: "Book with a pencil badge.",
  },
  brush: {
    labels: ["brush", "paint", "design"],
    description: "Upright paint brush with wide bristles.",
  },
  "bus-03": {
    labels: ["bus", "transit", "side"],
    description: "Bus seen from the side with a band of windows.",
  },
  "calendar-block-01": {
    labels: ["calendar", "blocked", "unavailable"],
    description: "Calendar with a no-entry badge.",
  },
  "calendar-check-out-01": {
    labels: ["calendar", "check out", "leave"],
    description: "Calendar with an arrow leaving it.",
  },
  "camera-video": {
    labels: ["film camera", "video", "record"],
    description: "Film camera with two reels and a lens cone.",
  },
  "cancel-02": {
    labels: ["close", "cross", "heavy"],
    description: "Heavy cross.",
  },
  "car-03": {
    labels: ["car", "vehicle", "side"],
    description: "Car seen from the side, facing right.",
  },
  "castle-01": {
    labels: ["castle", "fortress", "wall"],
    description: "Castle wall with merlons and an arched gate.",
  },
  "cellular-network": {
    labels: ["cellular", "mast", "network"],
    description: "Cellular mast sending waves.",
  },
  "chart-01": {
    labels: ["chart", "bars", "report"],
    description: "Two bars in a frame.",
  },
  "chart-bar-big": {
    labels: ["chart", "bars", "statistics"],
    description: "Three wide bars, the tallest highlighted.",
  },
  "chart-column": {
    labels: ["chart", "columns", "compare"],
    description: "Two groups of two columns.",
  },
  "chart-down": {
    labels: ["trend", "down", "decline"],
    description: "Zigzag trend line falling to an arrowhead.",
  },
  "chart-radar": {
    labels: ["chart", "radar", "spider"],
    description: "Radar chart: a diamond frame with its data area.",
  },
  "chart-ring": {
    labels: ["chart", "donut", "share"],
    description: "Donut chart with one quarter highlighted.",
  },
  "chart-scatter": {
    labels: ["chart", "scatter", "points"],
    description: "Scatter plot on two axes.",
  },
  "chart-up": {
    labels: ["trend", "up", "growth"],
    description: "Zigzag trend line climbing to an arrowhead.",
  },
  "checkmark-circle-02": {
    labels: ["check", "success", "circle"],
    description: "Heavy check mark in a full-grid ring.",
  },
  church: {
    labels: ["church", "chapel", "religion"],
    description: "Church with a cross on a pointed roof.",
  },
  "clipboard-check": {
    labels: ["clipboard", "done", "approved"],
    description: "Clipboard with a check mark.",
  },
  "clipboard-list": {
    labels: ["clipboard", "list", "checklist"],
    description: "Clipboard with a bulleted list.",
  },
  "cloud-loading": {
    labels: ["cloud", "loading", "sync"],
    description: "Cloud with three loading dots.",
  },
  cloudy: {
    labels: ["cloudy", "weather", "clouds"],
    description: "Two clouds, one behind the other.",
  },
  "coffee-02": {
    labels: ["coffee", "takeaway", "cup"],
    description: "Takeaway coffee cup with a lid and sleeve.",
  },
  "configuration-01": {
    labels: ["configuration", "switches", "options"],
    description: "Two switches, one on and one off.",
  },
  "database-01": {
    labels: ["database", "storage", "data"],
    description: "Cylinder with its top face and one band.",
  },
  "document-validation": {
    labels: ["document", "validated", "approved"],
    description: "Document with two text lines and a check badge.",
  },
  "edit-01": {
    labels: ["edit", "text", "write"],
    description: "Pencil writing a line of text.",
  },
  "file-02": {
    labels: ["file", "document", "text"],
    description: "Sheet with a folded corner and two lines of text.",
  },
  "file-audio": {
    labels: ["file", "audio", "music"],
    description: "File with a music-note badge.",
  },
  "file-link": {
    labels: ["file", "link", "url"],
    description: "File with a slanted chain-link badge.",
  },
  "file-pin": {
    labels: ["file", "pinned", "pin"],
    description: "File with a push-pin badge.",
  },
  "file-script": {
    labels: ["file", "script", "terminal"],
    description: "File with a prompt badge, a chevron and an underscore.",
  },
  "file-star": {
    labels: ["file", "favourite", "starred"],
    description: "File with a star badge.",
  },
  "file-sync": {
    labels: ["file", "sync", "update"],
    description: "File with a sync badge, a ring of two turning arrows.",
  },
  "file-unknown": {
    labels: ["file", "unknown", "question"],
    description: "Sheet with a two-pixel question mark.",
  },
  "film-roll-01": {
    labels: ["film", "roll", "reel"],
    description: "Film reel with its strip running off.",
  },
  "folder-02": {
    labels: ["folder", "directory", "pocket"],
    description: "Folder with its front pocket marked by a line.",
  },
  "folder-check": {
    labels: ["folder", "done", "approved"],
    description: "Folder with a check badge.",
  },
  "folder-cloud": {
    labels: ["folder", "cloud", "online"],
    description: "Folder with a cloud badge.",
  },
  "folder-search": {
    labels: ["folder", "search", "find"],
    description: "Folder with a magnifier badge.",
  },
  "folder-sync": {
    labels: ["folder", "sync", "update"],
    description: "Folder with a sync badge, a ring of two turning arrows.",
  },
  "game-controller-02": {
    labels: ["game pad", "retro", "play"],
    description: "Retro game pad with a cross pad and two buttons.",
  },
  garage: {
    labels: ["garage", "parking", "door"],
    description: "Garage with a roll-up door.",
  },
  helicopter: {
    labels: ["helicopter", "flight", "air"],
    description: "Helicopter seen from the side.",
  },
  "home-03": {
    labels: ["house", "home", "chimney"],
    description: "House with a chimney and a window.",
  },
  "house-01": {
    labels: ["house", "home", "residence"],
    description: "House with an overhanging gable roof, a window and a door.",
  },
  "image-02": {
    labels: ["picture", "photo", "image"],
    description: "Picture with a mountain and the sun in a frame with cut corners.",
  },
  "image-crop": {
    labels: ["crop", "picture", "trim"],
    description: "Crop marks around a small picture.",
  },
  "image-delete-01": {
    labels: ["picture", "delete", "remove"],
    description: "Picture with a cross badge.",
  },
  "image-done-01": {
    labels: ["picture", "done", "approved"],
    description: "Picture with a check badge.",
  },
  "information-diamond": {
    labels: ["info", "about", "diamond"],
    description: "Letter i in a diamond.",
  },
  "lock-key": {
    labels: ["lock", "key", "access"],
    description: "Padlock with a key inside.",
  },
  "lock-password": {
    labels: ["password", "lock", "pin"],
    description: "Padlock over password dots.",
  },
  "medal-01": {
    labels: ["medal", "award", "prize"],
    description: "Medal on two straps.",
  },
  metro: {
    labels: ["metro", "subway", "underground"],
    description: "Metro sign: an M in a ring.",
  },
  "minus-sign-circle": {
    labels: ["minus", "remove", "circle"],
    description: "Minus in a full-grid ring.",
  },
  "moon-01": {
    labels: ["moon", "night", "dark"],
    description: "Solid crescent moon.",
  },
  "music-note-02": {
    labels: ["music", "note", "song"],
    description: "Single eighth note.",
  },
  newspaper: {
    labels: ["newspaper", "news", "press"],
    description: "Newspaper with its back page curling out.",
  },
  "package-add": {
    labels: ["package", "add", "parcel"],
    description: "Parcel with a plus badge.",
  },
  "package-delivered": {
    labels: ["delivered", "package", "done"],
    description: "Parcel with a check badge.",
  },
  "package-receive": {
    labels: ["receive", "package", "incoming"],
    description: "Parcel with a down arrow badge.",
  },
  "package-remove": {
    labels: ["package", "remove", "parcel"],
    description: "Parcel with a minus badge.",
  },
  "package-sent": {
    labels: ["sent", "package", "outgoing"],
    description: "Parcel with an up arrow badge.",
  },
  "pencil-edit-01": {
    labels: ["edit", "modify", "write"],
    description: "Pencil writing into an open box, to edit.",
  },
  "pencil-edit-02": {
    labels: ["pencil", "write", "draw"],
    description: "Pencil drawing a line.",
  },
  "play-square": {
    labels: ["play", "video", "box"],
    description: "Play triangle in a box.",
  },
  "plug-01": {
    labels: ["plug", "power", "cable"],
    description: "Electric plug with two pins and its cable.",
  },
  "plus-sign-square": {
    labels: ["plus", "add", "box"],
    description: "Plus in a rounded box.",
  },
  question: {
    labels: ["question", "help", "unknown"],
    description: "Question mark on its own.",
  },
  "sd-card": {
    labels: ["memory card", "storage", "sd"],
    description: "Memory card with a cut corner and its contacts.",
  },
  "security-lock": {
    labels: ["security", "lock", "shield"],
    description: "Shield with a padlock.",
  },
  "settings-03": {
    labels: ["settings", "sliders", "adjust"],
    description: "Two vertical sliders, settings.",
  },
  "shield-02": {
    labels: ["shield", "security", "protection"],
    description: "Shield with its left half filled.",
  },
  "shopping-bag-add": {
    labels: ["bag", "add", "buy"],
    description: "Shopping bag with a plus badge.",
  },
  "shopping-bag-check": {
    labels: ["bag", "purchased", "done"],
    description: "Shopping bag with a check badge.",
  },
  "shopping-cart-02": {
    labels: ["cart", "shop", "basket"],
    description: "Cart with a deep basket on a base rail with two wheels.",
  },
  "shopping-cart-add-01": {
    labels: ["cart", "add", "buy"],
    description: "Cart with a plus badge.",
  },
  "shopping-cart-check-01": {
    labels: ["cart", "checkout", "done"],
    description: "Cart with a check badge.",
  },
  "shopping-cart-remove-01": {
    labels: ["cart", "remove", "delete"],
    description: "Cart with a minus badge.",
  },
  "signal-full-02": {
    labels: ["signal", "full", "network"],
    description: "Full signal, a solid wedge rising to the right.",
  },
  "smart-phone-02": {
    labels: ["phone", "mobile", "device"],
    description: "Phone with rounded corners and a notch.",
  },
  "square-arrow-down-01": {
    labels: ["arrow", "down", "box"],
    description: "Arrow down in a box.",
  },
  "square-arrow-left-01": {
    labels: ["arrow", "left", "box"],
    description: "Arrow left in a box.",
  },
  "square-arrow-right-01": {
    labels: ["arrow", "right", "box"],
    description: "Arrow right in a box.",
  },
  "square-arrow-up-right": {
    labels: ["external", "open", "box"],
    description: "Arrow up and right in a box.",
  },
  "store-02": {
    labels: ["shop", "store", "retail"],
    description: "Shop front with a sign board, a window and a door.",
  },
  "tablet-01": {
    labels: ["tablet", "device", "screen"],
    description: "Tablet with a home button.",
  },
  tea: {
    labels: ["tea", "cup", "drink"],
    description: "Cup of tea with the bag's string and tag.",
  },
  "tick-02": {
    labels: ["check", "done", "light"],
    description: "Light check mark in one-pixel lines.",
  },
  "tick-04": {
    labels: ["check", "done", "heavy"],
    description: "Heavy check mark.",
  },
  tools: {
    labels: ["tools", "repair", "maintenance"],
    description: "Screwdriver and wrench crossed.",
  },
  "train-02": {
    labels: ["train", "high speed", "rail"],
    description: "High-speed train seen from the side.",
  },
  tram: {
    labels: ["tram", "streetcar", "transit"],
    description: "Tram seen from the front, on its rail.",
  },
  "tv-smart": {
    labels: ["smart tv", "streaming", "screen"],
    description: "Screen with a play triangle, on a stand.",
  },
  "two-factor-access": {
    labels: ["2fa", "security", "phone"],
    description: "Phone beside a padlock.",
  },
  university: {
    labels: ["university", "campus", "education"],
    description: "Domed building with columns on a plinth.",
  },
  "user-02": {
    labels: ["user", "person", "profile"],
    description: "Person with an open shoulder arc.",
  },
  "user-add-02": {
    labels: ["user", "add", "invite"],
    description: "Person with a plus badge.",
  },
  "user-circle-02": {
    labels: ["account", "avatar", "profile"],
    description: "Person in a full ring, shoulders running into it.",
  },
  "user-list": {
    labels: ["users", "list", "directory"],
    description: "Person beside list lines.",
  },
  "user-love-01": {
    labels: ["user", "favourite", "love"],
    description: "Person with a heart badge.",
  },
  "user-minus-01": {
    labels: ["user", "remove", "minus"],
    description: "Person with a minus badge.",
  },
  "user-remove-02": {
    labels: ["user", "remove", "delete"],
    description: "Person with a cross badge.",
  },
  "user-search-01": {
    labels: ["user", "search", "find"],
    description: "Person with a magnifier badge.",
  },
  "user-sharing": {
    labels: ["user", "share", "invite"],
    description: "Person with a share arrow badge.",
  },
  "user-time-01": {
    labels: ["user", "time", "pending"],
    description: "Person with a clock badge.",
  },
  "user-warning-01": {
    labels: ["user", "warning", "alert"],
    description: "Person with an exclamation badge.",
  },
  "video-replay": {
    labels: ["replay", "video", "again"],
    description: "Play triangle inside a ring turning back on itself.",
  },
  "volume-up": {
    labels: ["volume", "louder", "sound"],
    description: "Speaker with a plus.",
  },
  "wallet-03": {
    labels: ["wallet", "purse", "payment"],
    description: "Wallet with a flap and a round snap.",
  },
  "wallet-add-01": {
    labels: ["wallet", "add", "top up"],
    description: "Wallet with a plus badge.",
  },
  webcam: {
    labels: ["webcam", "camera", "video call"],
    description: "Round webcam on a stand.",
  },
  "wifi-error-01": {
    labels: ["wifi", "error", "connection"],
    description: "Wi-Fi arcs over an exclamation mark.",
  },
  "square-arrow-down-01-fill": {
    reference:
      "Filled variant of our own `square-arrow-down-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: arrow down in a box.",
  },
  "square-arrow-left-01-fill": {
    reference:
      "Filled variant of our own `square-arrow-left-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: arrow left in a box.",
  },
  "square-arrow-right-01-fill": {
    reference:
      "Filled variant of our own `square-arrow-right-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: arrow right in a box.",
  },
  "square-arrow-up-right-fill": {
    reference:
      "Filled variant of our own `square-arrow-up-right`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: arrow up and right in a box.",
  },
  "minus-sign-circle-fill": {
    reference:
      "Filled variant of our own `minus-sign-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "minus"],
    description: "Filled: minus in a full-grid ring.",
  },
  "plus-sign-square-fill": {
    reference:
      "Filled variant of our own `plus-sign-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "plus"],
    description: "Filled: plus in a rounded box.",
  },
  "checkmark-circle-02-fill": {
    reference:
      "Filled variant of our own `checkmark-circle-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "checkmark"],
    description: "Filled: heavy check mark in a full-grid ring.",
  },
  "alert-02-fill": {
    reference: "Filled variant of our own `alert-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "alert"],
    description: "Filled: exclamation mark in an octagon.",
  },
  "information-diamond-fill": {
    reference:
      "Filled variant of our own `information-diamond`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "information"],
    description: "Filled: letter i in a diamond.",
  },
  "book-01-fill": {
    reference: "Filled variant of our own `book-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "book"],
    description: "Filled: closed book with a thick spine and a title.",
  },
  "file-02-fill": {
    reference: "Filled variant of our own `file-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "file"],
    description: "Filled: sheet with a folded corner and two lines of text.",
  },
  "file-unknown-fill": {
    reference:
      "Filled variant of our own `file-unknown`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "file"],
    description: "Filled: sheet with a two-pixel question mark.",
  },
  "folder-02-fill": {
    reference: "Filled variant of our own `folder-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "folder"],
    description: "Filled: folder with its front pocket marked by a line.",
  },
  "user-circle-02-fill": {
    reference:
      "Filled variant of our own `user-circle-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "user"],
    description: "Filled: person in a full ring, shoulders running into it.",
  },
  "security-lock-fill": {
    reference:
      "Filled variant of our own `security-lock`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "security"],
    description: "Filled: shield with a padlock.",
  },
  "database-01-fill": {
    reference: "Filled variant of our own `database-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "database"],
    description: "Filled: cylinder with its top face and one band.",
  },
  "chart-01-fill": {
    reference: "Filled variant of our own `chart-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "chart"],
    description: "Filled: two bars in a frame.",
  },
  "wallet-03-fill": {
    reference: "Filled variant of our own `wallet-03`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "wallet"],
    description: "Filled: wallet with a flap and a round snap.",
  },
  "store-02-fill": {
    reference: "Filled variant of our own `store-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "store"],
    description: "Filled: shop front with a sign board, a window and a door.",
  },
  "home-03-fill": {
    reference: "Filled variant of our own `home-03`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "home"],
    description: "Filled: house with a chimney and a window.",
  },
  "apartment-fill": {
    reference: "Filled variant of our own `apartment`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "apartment"],
    description: "Filled: apartment block with six windows and a door.",
  },
  "castle-01-fill": {
    reference: "Filled variant of our own `castle-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "castle"],
    description: "Filled: castle wall with merlons and an arched gate.",
  },
  "metro-fill": {
    reference: "Filled variant of our own `metro`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "metro"],
    description: "Filled: metro sign: an M in a ring.",
  },
  "smart-phone-02-fill": {
    reference:
      "Filled variant of our own `smart-phone-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "smart"],
    description: "Filled: phone with rounded corners and a notch.",
  },
  "tablet-01-fill": {
    reference: "Filled variant of our own `tablet-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "tablet"],
    description: "Filled: tablet with a home button.",
  },
  "game-controller-02-fill": {
    reference:
      "Filled variant of our own `game-controller-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "game"],
    description: "Filled: retro game pad with a cross pad and two buttons.",
  },
  "sd-card-fill": {
    reference: "Filled variant of our own `sd-card`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "sd"],
    description: "Filled: memory card with a cut corner and its contacts.",
  },
  "image-02-fill": {
    reference: "Filled variant of our own `image-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "image"],
    description: "Filled: picture with a mountain and the sun in a frame with cut corners.",
  },
  "play-square-fill": {
    reference: "Filled variant of our own `play-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "play"],
    description: "Filled: play triangle in a box.",
  },
  "add-01": {
    labels: ["add", "plus", "bold"],
    description: "Bold plus, two-pixel bars.",
  },
  "add-invoice": {
    labels: ["invoice", "add", "bill"],
    description: "Invoice with a plus badge.",
  },
  "ai-book": {
    labels: ["ai", "book", "read"],
    description: "Book with an AI sparkle badge.",
  },
  "ai-browser": {
    labels: ["ai", "browser", "web"],
    description: "Browser window with an AI sparkle badge.",
  },
  "ai-chat-01": {
    labels: ["ai", "chat", "assistant"],
    description: "Speech bubble with an AI sparkle badge.",
  },
  "ai-cloud": {
    labels: ["ai", "cloud", "service"],
    description: "Cloud with an AI sparkle badge.",
  },
  "ai-computer": {
    labels: ["ai", "computer", "screen"],
    description: "Monitor with an AI sparkle badge.",
  },
  "alarm-clock-minus": {
    labels: ["alarm", "remove", "reminder"],
    description: "Alarm clock with a minus badge.",
  },
  "alarm-clock-plus": {
    labels: ["alarm", "add", "reminder"],
    description: "Alarm clock with a plus badge.",
  },
  "analytics-02": {
    labels: ["analytics", "bars", "dashboard"],
    description: "Monitor on a stand with two bars.",
  },
  angry: {
    labels: ["angry", "face", "emoji"],
    description: "Angry face with slanted eyes and a frown.",
  },
  "award-02": {
    labels: ["award", "rosette", "prize"],
    description: "Rosette with two ribbon tails.",
  },
  "bar-code-02": {
    labels: ["barcode", "product", "retail"],
    description: "Barcode with taller guard bars at both ends.",
  },
  battery: {
    labels: ["battery", "charge", "power"],
    description: "Upright battery, its charge in the secondary tone.",
  },
  "battery-plus": {
    labels: ["battery", "charge", "plus"],
    description: "Battery with a plus inside, to charge.",
  },
  "bell-minus": {
    labels: ["bell", "notification", "remove"],
    description: "Bell with a small minus top right.",
  },
  "bell-plus": {
    labels: ["bell", "notification", "add"],
    description: "Bell with a small plus top right.",
  },
  bitcoin: {
    labels: ["bitcoin", "crypto", "currency"],
    description: "Bitcoin sign.",
  },
  "bitcoin-01": {
    labels: ["bitcoin", "crypto", "coin"],
    description: "Bitcoin sign in a ring.",
  },
  "bluetooth-circle": {
    labels: ["bluetooth", "wireless", "circle"],
    description: "Bluetooth rune in a ring.",
  },
  "bluetooth-search": {
    labels: ["bluetooth", "search", "pairing"],
    description: "Bluetooth rune with a magnifier badge.",
  },
  "bluetooth-square": {
    labels: ["bluetooth", "wireless", "box"],
    description: "Bluetooth rune in a box.",
  },
  "book-bookmark-01": {
    labels: ["book", "bookmark", "reading"],
    description: "Book with a ribbon bookmark hanging from the top.",
  },
  "book-bookmark-02": {
    labels: ["book", "bookmark", "ribbon"],
    description: "Book with a ribbon hanging out of the bottom.",
  },
  "book-check": {
    labels: ["book", "done", "read"],
    description: "Book with a check badge.",
  },
  "book-copy": {
    labels: ["books", "copy", "duplicate"],
    description: "Two books, one in front of the other.",
  },
  "book-download": {
    labels: ["book", "download", "ebook"],
    description: "Book with a download badge.",
  },
  "book-headphones": {
    labels: ["audiobook", "book", "listen"],
    description: "Book with a headphones badge, an audiobook.",
  },
  "book-heart": {
    labels: ["book", "favourite", "love"],
    description: "Book with a heart badge.",
  },
  "book-key": {
    labels: ["book", "key", "licence"],
    description: "Book with a key badge.",
  },
  "book-lock": {
    labels: ["book", "locked", "private"],
    description: "Book with a padlock badge.",
  },
  "bot-message-square": {
    labels: ["bot", "chat", "assistant"],
    description: "Square speech bubble with a bot's face.",
  },
  "bus-02": {
    labels: ["bus", "transit", "front"],
    description: "Bus from the front with a solid windscreen.",
  },
  cake: {
    labels: ["cake", "birthday", "party"],
    description: "Two-tier cake with a candle.",
  },
  "calendar-02": {
    labels: ["calendar", "agenda", "events"],
    description: "Calendar page with two agenda lines.",
  },
  "calendar-add-02": {
    labels: ["calendar", "add", "event"],
    description: "Calendar with a plus inside.",
  },
  "calendar-check": {
    labels: ["calendar", "done", "confirmed"],
    description: "Calendar with a check mark inside.",
  },
  "calendar-clock": {
    labels: ["calendar", "time", "schedule"],
    description: "Calendar with a clock badge.",
  },
  "calendar-cog": {
    labels: ["calendar", "settings", "configure"],
    description: "Calendar with a cog badge.",
  },
  "calendar-heart": {
    labels: ["calendar", "favourite", "love"],
    description: "Calendar with a heart badge.",
  },
  "calendar-minus": {
    labels: ["calendar", "remove", "event"],
    description: "Calendar with a minus inside.",
  },
  "call-add": {
    labels: ["call", "add", "contact"],
    description: "Phone handset with a plus.",
  },
  "call-minus": {
    labels: ["call", "remove", "contact"],
    description: "Phone handset with a minus.",
  },
  "camera-02": {
    labels: ["camera", "photo", "lens"],
    description: "Camera with a round lens and a side viewfinder.",
  },
  "camera-03": {
    labels: ["camera", "photo", "shoot"],
    description: "Camera with a solid lens.",
  },
  "camera-add-01": {
    labels: ["camera", "add", "photo"],
    description: "Camera with a plus badge.",
  },
  "camera-add-02": {
    labels: ["camera", "add", "photo"],
    description: "Round-lens camera with a plus badge.",
  },
  "camera-add-03": {
    labels: ["camera", "add", "photo"],
    description: "Solid-lens camera with a plus badge.",
  },
  "camera-ai": {
    labels: ["camera", "ai", "smart"],
    description: "Camera with a sparkle badge.",
  },
  "camera-microphone-01": {
    labels: ["camera", "microphone", "record"],
    description: "Camera with a microphone badge.",
  },
  "camera-microphone-02": {
    labels: ["video", "microphone", "call"],
    description: "Video camera with a microphone badge.",
  },
  "camera-smile-01": {
    labels: ["camera", "face", "detection"],
    description: "Camera with a smiley badge.",
  },
  "car-02": {
    labels: ["car", "vehicle", "solid"],
    description: "Solid car seen from the front.",
  },
  "car-parking-02": {
    labels: ["car", "parking", "park"],
    description: "Car with a P badge.",
  },
  "car-time": {
    labels: ["car", "time", "schedule"],
    description: "Car with a clock badge.",
  },
  "chart-02": {
    labels: ["chart", "line", "report"],
    description: "Rising line chart in a frame.",
  },
  "chart-03": {
    labels: ["chart", "area", "report"],
    description: "Area chart in a frame.",
  },
  "chart-bar-line": {
    labels: ["chart", "bars", "trend"],
    description: "Bars with a trend line.",
  },
  "chart-network": {
    labels: ["chart", "network", "nodes"],
    description: "Chart axes with connected data nodes in the secondary tone.",
  },
  chat: {
    labels: ["chat", "conversation", "bubble"],
    description: "Round speech bubble with three dots in the secondary tone.",
  },
  "chat-add": {
    labels: ["chat", "add", "new"],
    description: "Round speech bubble with a plus badge.",
  },
  "chat-cancel": {
    labels: ["chat", "cancel", "close"],
    description: "Round speech bubble with a cross badge.",
  },
  "chat-cancel-01": {
    labels: ["chat", "cancel", "close"],
    description: "Speech bubble with a cross badge.",
  },
  "chat-download": {
    labels: ["chat", "download", "save"],
    description: "Round speech bubble with a download arrow badge.",
  },
  "chat-download-01": {
    labels: ["chat", "download", "save"],
    description: "Speech bubble with a download arrow badge.",
  },
  "chat-edit": {
    labels: ["chat", "edit", "write"],
    description: "Round speech bubble with a pencil badge.",
  },
  "chat-lock": {
    labels: ["chat", "private", "encrypted"],
    description: "Round speech bubble with a padlock badge.",
  },
  "chat-lock-01": {
    labels: ["chat", "private", "encrypted"],
    description: "Speech bubble with a padlock badge.",
  },
  "chat-notification": {
    labels: ["chat", "unread", "notification"],
    description: "Round speech bubble with a notification dot.",
  },
  "check-line": {
    labels: ["check", "done", "underline"],
    description: "Check mark over a line.",
  },
  "circle-lock-01": {
    labels: ["lock", "padlock", "round"],
    description: "Round padlock with a keyhole in the secondary tone.",
  },
  "angry-fill": {
    reference: "Filled variant of our own `angry`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "angry"],
    description: "Filled: angry face with slanted eyes and a frown.",
  },
  "award-02-fill": {
    reference: "Filled variant of our own `award-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "award"],
    description: "Filled: rosette with two ribbon tails.",
  },
  "bluetooth-circle-fill": {
    reference:
      "Filled variant of our own `bluetooth-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bluetooth"],
    description: "Filled: bluetooth rune in a ring.",
  },
  "bluetooth-square-fill": {
    reference:
      "Filled variant of our own `bluetooth-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bluetooth"],
    description: "Filled: bluetooth rune in a box.",
  },
  "calendar-02-fill": {
    reference: "Filled variant of our own `calendar-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "calendar"],
    description: "Filled: calendar page with two agenda lines.",
  },
  "camera-02-fill": {
    reference: "Filled variant of our own `camera-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "camera"],
    description: "Filled: camera with a round lens and a side viewfinder.",
  },
  "chart-02-fill": {
    reference: "Filled variant of our own `chart-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "chart"],
    description: "Filled: rising line chart in a frame.",
  },
  "chat-fill": {
    reference: "Filled variant of our own `chat`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "chat"],
    description: "Filled: round speech bubble with three dots in the secondary tone.",
  },
  "circle-lock-01-fill": {
    reference:
      "Filled variant of our own `circle-lock-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: round padlock with a keyhole in the secondary tone.",
  },
  "clipboard-clock": {
    labels: ["clipboard", "pending", "time"],
    description: "Clipboard with a clock badge.",
  },
  "clipboard-minus": {
    labels: ["clipboard", "remove", "minus"],
    description: "Clipboard with a minus badge.",
  },
  "clipboard-pen": {
    labels: ["clipboard", "edit", "write"],
    description: "Clipboard with a pencil badge.",
  },
  "clipboard-plus": {
    labels: ["clipboard", "add", "new"],
    description: "Clipboard with a plus badge.",
  },
  "clock-check": {
    labels: ["clock", "done", "on time"],
    description: "Clock with a check badge.",
  },
  "clock-plus": {
    labels: ["clock", "add", "time"],
    description: "Clock with a plus badge.",
  },
  "cloud-cog": {
    labels: ["cloud", "settings", "configure"],
    description: "Cloud with a cog badge.",
  },
  "coffee-03": {
    labels: ["coffee", "cup", "saucer"],
    description: "Cup of coffee on a saucer.",
  },
  "comment-03": {
    labels: ["comment", "note", "bubble"],
    description: "Square speech bubble with a centred tail and two lines of text.",
  },
  "comment-add-02": {
    labels: ["comment", "add", "new"],
    description: "Speech bubble with its tail on the right and a plus inside.",
  },
  "comment-add-03": {
    labels: ["comment", "add", "new"],
    description: "Square speech bubble with a centred tail and a plus inside.",
  },
  "comment-remove-01": {
    labels: ["comment", "remove", "delete"],
    description: "Speech bubble with its tail on the left and a minus inside.",
  },
  "comment-remove-02": {
    labels: ["comment", "remove", "delete"],
    description: "Speech bubble with its tail on the right and a minus inside.",
  },
  "comment-remove-03": {
    labels: ["comment", "remove", "delete"],
    description: "Square speech bubble with a centred tail and a minus inside.",
  },
  "computer-add": {
    labels: ["computer", "add", "monitor"],
    description: "Monitor with a plus on its screen.",
  },
  "computer-check": {
    labels: ["computer", "done", "monitor"],
    description: "Monitor with a check mark on its screen.",
  },
  "computer-cloud": {
    labels: ["computer", "cloud", "online"],
    description: "Monitor with a cloud on its screen.",
  },
  "computer-remove": {
    labels: ["computer", "remove", "monitor"],
    description: "Monitor with a minus on its screen.",
  },
  "computer-terminal-01": {
    labels: ["terminal", "console", "command"],
    description: "Monitor showing a prompt chevron and underscore.",
  },
  "computer-user": {
    labels: ["computer", "user", "account"],
    description: "Monitor showing a small person.",
  },
  "computer-video": {
    labels: ["computer", "video", "play"],
    description: "Monitor with a play triangle on its screen.",
  },
  "computer-video-call": {
    labels: ["video call", "meeting", "computer"],
    description: "Monitor showing a small video camera.",
  },
  "copy-02": {
    labels: ["copy", "duplicate", "text"],
    description: "Two sheets, the front one with two lines of text.",
  },
  "copy-check": {
    labels: ["copy", "copied", "done"],
    description: "Two sheets, the front one with a check mark.",
  },
  "copy-minus": {
    labels: ["copy", "remove", "duplicate"],
    description: "Two sheets, the front one with a minus.",
  },
  "copy-plus": {
    labels: ["copy", "add", "duplicate"],
    description: "Two sheets, the front one with a plus.",
  },
  "coupon-percent": {
    labels: ["coupon", "discount", "percent"],
    description: "Ticket with a percent sign.",
  },
  "dashboard-circle": {
    labels: ["gauge", "speedometer", "dashboard"],
    description: "Gauge: an arc open at the bottom with a hub and a needle.",
  },
  "dashboard-square-02": {
    labels: ["dashboard", "panels", "layout"],
    description: "A tall panel on the left and two panels on the right.",
  },
  "dashboard-square-03": {
    labels: ["dashboard", "panels", "layout"],
    description: "A wide panel on top of two squares.",
  },
  "dashboard-square-add": {
    labels: ["dashboard", "add", "widget"],
    description: "Three squares and a plus badge in the fourth place.",
  },
  "dashboard-square-edit": {
    labels: ["dashboard", "edit", "widget"],
    description: "Three squares and a pencil badge in the fourth place.",
  },
  "dashboard-square-remove": {
    labels: ["dashboard", "remove", "widget"],
    description: "Three squares and a minus badge in the fourth place.",
  },
  "dashboard-square-setting": {
    labels: ["dashboard", "settings", "widget"],
    description: "Three squares and a cog badge in the fourth place.",
  },
  "delete-01": {
    labels: ["delete", "bin", "trash"],
    description: "Bin with a lid and a plain tapered body.",
  },
  "delete-03": {
    labels: ["delete", "permanent", "trash"],
    description: "Bin with a cross inside, delete for good.",
  },
  "delivery-truck-02": {
    labels: ["delivery", "truck", "parcel"],
    description: "Lorry carrying a parcel.",
  },
  "diamond-01": {
    labels: ["diamond", "rhombus", "shape"],
    description: "Plain rhombus with two-pixel tips.",
  },
  "diamond-minus": {
    labels: ["gem", "remove", "premium"],
    description: "Gem with a minus badge.",
  },
  "diamond-plus": {
    labels: ["gem", "add", "premium"],
    description: "Gem with a plus badge.",
  },
  "dollar-01": {
    labels: ["dollar", "money", "price"],
    description: "Dollar sign on its own, two-pixel uprights.",
  },
  "download-02": {
    labels: ["download", "save", "get"],
    description: "Chevron-headed arrow down onto a baseline.",
  },
  "file-bookmark": {
    labels: ["file", "bookmark", "saved"],
    description: "File with a bookmark ribbon badge.",
  },
  "file-chart-line": {
    labels: ["file", "report", "chart"],
    description: "File with a rising line chart badge.",
  },
  "file-chart-pie": {
    labels: ["file", "report", "pie chart"],
    description: "File with a pie chart badge.",
  },
  "file-clock": {
    labels: ["file", "recent", "history"],
    description: "File with a clock badge.",
  },
  "file-cloud": {
    labels: ["file", "cloud", "online"],
    description: "File with a cloud badge.",
  },
  "file-cog": {
    labels: ["file", "settings", "configure"],
    description: "File with a cog badge.",
  },
  "file-euro": {
    labels: ["file", "invoice", "euro"],
    description: "File with a euro sign badge.",
  },
  "file-heart": {
    labels: ["file", "favourite", "love"],
    description: "File with a heart badge.",
  },
  "filter-mail": {
    labels: ["mail", "filter", "rules"],
    description: "Envelope with a funnel badge, a mail filter.",
  },
  "fire-02": {
    labels: ["fire", "flame", "hot"],
    description: "Solid flame with its core in the secondary tone.",
  },
  "fire-security": {
    labels: ["fire safety", "shield", "flame"],
    description: "Shield with a flame inside.",
  },
  "flag-02": {
    labels: ["pennant", "flag", "milestone"],
    description: "Triangular pennant on a pole.",
  },
  "comment-03-fill": {
    reference: "Filled variant of our own `comment-03`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "comment"],
    description: "Filled: square speech bubble with a centred tail and two lines of text.",
  },
  "comment-add-02-fill": {
    reference:
      "Filled variant of our own `comment-add-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "comment"],
    description: "Filled: speech bubble with its tail on the right and a plus inside.",
  },
  "comment-add-03-fill": {
    reference:
      "Filled variant of our own `comment-add-03`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "comment"],
    description: "Filled: square speech bubble with a centred tail and a plus inside.",
  },
  "comment-remove-01-fill": {
    reference:
      "Filled variant of our own `comment-remove-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "comment"],
    description: "Filled: speech bubble with its tail on the left and a minus inside.",
  },
  "comment-remove-02-fill": {
    reference:
      "Filled variant of our own `comment-remove-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "comment"],
    description: "Filled: speech bubble with its tail on the right and a minus inside.",
  },
  "comment-remove-03-fill": {
    reference:
      "Filled variant of our own `comment-remove-03`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "comment"],
    description: "Filled: square speech bubble with a centred tail and a minus inside.",
  },
  "computer-add-fill": {
    reference:
      "Filled variant of our own `computer-add`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "computer"],
    description: "Filled: monitor with a plus on its screen.",
  },
  "computer-remove-fill": {
    reference:
      "Filled variant of our own `computer-remove`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "computer"],
    description: "Filled: monitor with a minus on its screen.",
  },
  "computer-check-fill": {
    reference:
      "Filled variant of our own `computer-check`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "computer"],
    description: "Filled: monitor with a check mark on its screen.",
  },
  "computer-terminal-01-fill": {
    reference:
      "Filled variant of our own `computer-terminal-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "computer"],
    description: "Filled: monitor showing a prompt chevron and underscore.",
  },
  "computer-video-fill": {
    reference:
      "Filled variant of our own `computer-video`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "computer"],
    description: "Filled: monitor with a play triangle on its screen.",
  },
  "coupon-percent-fill": {
    reference:
      "Filled variant of our own `coupon-percent`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "coupon"],
    description: "Filled: ticket with a percent sign.",
  },
  "diamond-01-fill": {
    reference: "Filled variant of our own `diamond-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "diamond"],
    description: "Filled: plain rhombus with two-pixel tips.",
  },
  "fire-security-fill": {
    reference:
      "Filled variant of our own `fire-security`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "fire"],
    description: "Filled: shield with a flame inside.",
  },
  "folder-03": {
    labels: ["folder", "directory", "files"],
    description: "Folder with its tab on the right.",
  },
  "folder-clock": {
    labels: ["folder", "recent", "time"],
    description: "Folder with a clock badge.",
  },
  "folder-cog": {
    labels: ["folder", "settings", "configure"],
    description: "Folder with a cog badge.",
  },
  "folder-edit": {
    labels: ["folder", "edit", "rename"],
    description: "Folder with a pencil badge.",
  },
  "folder-heart": {
    labels: ["folder", "favourite", "love"],
    description: "Folder with a heart badge.",
  },
  "folder-key": {
    labels: ["folder", "key", "access"],
    description: "Folder with a key badge.",
  },
  "folder-music": {
    labels: ["folder", "music", "audio"],
    description: "Folder with a music-note badge.",
  },
  "folder-pin": {
    labels: ["folder", "pinned", "pin"],
    description: "Folder with a push-pin badge.",
  },
  fork: {
    labels: ["fork", "food", "restaurant"],
    description: "Fork with three tines.",
  },
  fuel: {
    labels: ["fuel", "jerrycan", "petrol"],
    description: "Jerrycan with an embossed X.",
  },
  "git-graph": {
    labels: ["git", "graph", "history"],
    description: "Commit graph: a trunk and a branch leaving it at 45\u00b0.",
  },
  goal: {
    labels: ["goal", "target", "aim"],
    description: "Target with an arrow in its centre.",
  },
  grid: {
    labels: ["grid", "table", "cells"],
    description: "Three by three grid in a frame.",
  },
  "grid-02": {
    labels: ["apps", "grid", "tiles"],
    description: "Nine small squares, an apps grid.",
  },
  group: {
    labels: ["group", "team", "people"],
    description: "Three people, one in front of two.",
  },
  happy: {
    labels: ["happy", "laugh", "emoji"],
    description: "Laughing face: two eyes and an open grin in the secondary tone.",
  },
  "happy-01": {
    labels: ["happy", "joy", "emoji"],
    description: "Happy face with closed, upturned eyes and a smile in the secondary tone.",
  },
  health: {
    labels: ["health", "medical", "care"],
    description: "Heart with a medical cross inside in the secondary tone.",
  },
  hexagon: {
    labels: ["hexagon", "shape", "polygon"],
    description: "Hexagon with a point on top.",
  },
  "hexagon-01": {
    labels: ["hexagon", "shape", "polygon"],
    description: "Hexagon lying on its side.",
  },
  "hospital-02": {
    labels: ["hospital", "H", "sign"],
    description: "Hospital sign: an H in a box.",
  },
  "id-card": {
    labels: ["badge", "id", "staff"],
    description: "Hanging ID badge with a portrait and a name line.",
  },
  "image-add-02": {
    labels: ["image", "add", "picture"],
    description: "Picture whose sun is replaced by a plus, to add an image.",
  },
  "image-delete-02": {
    labels: ["image", "delete", "picture"],
    description: "Picture whose sun is replaced by a cross, to delete an image.",
  },
  "image-download": {
    labels: ["image", "download", "save"],
    description: "Picture with a download arrow badge.",
  },
  "image-play": {
    labels: ["image", "play", "video"],
    description: "Picture with a play badge.",
  },
  "image-remove-02": {
    labels: ["image", "remove", "picture"],
    description: "Picture whose sun is replaced by a minus, to remove an image.",
  },
  "key-square": {
    labels: ["key", "access", "box"],
    description: "Key in a box, the key in the secondary tone.",
  },
  "laptop-add": {
    labels: ["laptop", "add", "computer"],
    description: "Laptop with a plus on its screen.",
  },
  "laptop-check": {
    labels: ["laptop", "done", "computer"],
    description: "Laptop with a check mark on its screen.",
  },
  "laptop-remove": {
    labels: ["laptop", "remove", "computer"],
    description: "Laptop with a minus on its screen.",
  },
  "laptop-video": {
    labels: ["laptop", "video", "play"],
    description: "Laptop with a play triangle on its screen.",
  },
  laugh: {
    labels: ["laugh", "face", "emoji"],
    description: "Laughing face: closed eyes and an open mouth in the secondary tone.",
  },
  "layout-02": {
    labels: ["layout", "columns", "split"],
    description: "Window split into a wide main column and a narrow right column cut in two.",
  },
  "layout-03": {
    labels: ["layout", "header", "footer"],
    description: "Window with a header and a footer band around the body.",
  },
  "layout-dashboard": {
    labels: ["dashboard", "layout", "panels"],
    description: "Window with a tall panel beside two tiles.",
  },
  "layout-grid": {
    labels: ["grid", "layout", "cells"],
    description: "Window divided into three by three cells.",
  },
  "layout-list": {
    labels: ["list", "layout", "rows"],
    description: "Window with two rows, each a bullet and a line.",
  },
  line: {
    labels: ["line", "draw", "vector"],
    description: "45\u00b0 line between two square handles.",
  },
  "link-forward": {
    labels: ["link", "forward", "share"],
    description: "Link bracket with an arrow leaving it.",
  },
  "list-filter-plus": {
    labels: ["filter", "list", "add"],
    description: "Lines getting shorter with a plus beside the shortest.",
  },
  "list-minus": {
    labels: ["list", "remove", "item"],
    description: "List with a minus after its last line.",
  },
  "list-plus": {
    labels: ["list", "add", "item"],
    description: "List with a plus after its last line.",
  },
  "list-setting": {
    labels: ["list", "settings", "configure"],
    description: "Three lines and a cog badge.",
  },
  "list-tree": {
    labels: ["tree", "hierarchy", "list"],
    description: "Root line and three child lines hanging from one connector.",
  },
  "list-video": {
    labels: ["video", "playlist", "list"],
    description: "Three lines and a play triangle.",
  },
  "magic-wand-02": {
    labels: ["magic", "wand", "auto"],
    description: "Magic wand with a diamond star at its tip.",
  },
  "mail-add-02": {
    labels: ["mail", "add", "new"],
    description: "Rounded envelope with a plus badge.",
  },
  "mail-check": {
    labels: ["mail", "read", "done"],
    description: "Envelope with a check badge.",
  },
  "mail-download-01": {
    labels: ["mail", "download", "receive"],
    description: "Envelope with a download arrow badge.",
  },
  "mail-download-02": {
    labels: ["mail", "download", "receive"],
    description: "Rounded envelope with a download arrow badge.",
  },
  "mail-edit-01": {
    labels: ["mail", "edit", "compose"],
    description: "Envelope with a pencil badge.",
  },
  "mail-edit-02": {
    labels: ["mail", "edit", "compose"],
    description: "Rounded envelope with a pencil badge.",
  },
  "mail-lock-02": {
    labels: ["mail", "locked", "encrypted"],
    description: "Rounded envelope with a padlock badge.",
  },
  "mail-minus-02": {
    labels: ["mail", "remove", "minus"],
    description: "Rounded envelope with a minus badge.",
  },
  "mail-remove-02": {
    labels: ["mail", "delete", "cross"],
    description: "Rounded envelope with a cross badge.",
  },
  "man-woman": {
    labels: ["people", "couple", "toilets"],
    description: "A man and a woman side by side.",
  },
  "folder-03-fill": {
    reference: "Filled variant of our own `folder-03`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "folder"],
    description: "Filled: folder with its tab on the right.",
  },
  "happy-fill": {
    reference: "Filled variant of our own `happy`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "happy"],
    description: "Filled: laughing face: two eyes and an open grin in the secondary tone.",
  },
  "happy-01-fill": {
    reference: "Filled variant of our own `happy-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "happy"],
    description: "Filled: happy face with closed, upturned eyes and a smile in the secondary tone.",
  },
  "health-fill": {
    reference: "Filled variant of our own `health`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "health"],
    description: "Filled: heart with a medical cross inside in the secondary tone.",
  },
  "hexagon-fill": {
    reference: "Filled variant of our own `hexagon`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "hexagon"],
    description: "Filled: hexagon with a point on top.",
  },
  "hexagon-01-fill": {
    reference: "Filled variant of our own `hexagon-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "hexagon"],
    description: "Filled: hexagon lying on its side.",
  },
  "hospital-02-fill": {
    reference: "Filled variant of our own `hospital-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "hospital"],
    description: "Filled: hospital sign: an H in a box.",
  },
  "id-card-fill": {
    reference: "Filled variant of our own `id-card`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "id"],
    description: "Filled: hanging ID badge with a portrait and a name line.",
  },
  "key-square-fill": {
    reference: "Filled variant of our own `key-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "key"],
    description: "Filled: key in a box, the key in the secondary tone.",
  },
  "laugh-fill": {
    reference: "Filled variant of our own `laugh`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "laugh"],
    description: "Filled: laughing face: closed eyes and an open mouth in the secondary tone.",
  },
  "layout-dashboard-fill": {
    reference:
      "Filled variant of our own `layout-dashboard`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "layout"],
    description: "Filled: window with a tall panel beside two tiles.",
  },
  "medal-03": {
    labels: ["medal", "first", "winner"],
    description: "Medal with a 1 on crossed ribbons.",
  },
  "medical-file": {
    labels: ["medical", "record", "health"],
    description: "File with a pulse line.",
  },
  "menu-restaurant": {
    labels: ["restaurant", "menu", "food"],
    description: "Fork and knife side by side.",
  },
  "message-02": {
    labels: ["message", "bubble", "reply"],
    description: "Speech bubble with its tail on the right.",
  },
  "message-cancel-02": {
    labels: ["message", "cancel", "delete"],
    description: "Speech bubble with a cross inside.",
  },
  "message-circle": {
    labels: ["message", "chat", "bubble"],
    description: "Round speech bubble.",
  },
  "message-circle-check": {
    labels: ["message", "read", "done"],
    description: "Round speech bubble with a check inside.",
  },
  "message-circle-heart": {
    labels: ["message", "love", "favourite"],
    description: "Round speech bubble with a heart inside.",
  },
  "message-circle-plus": {
    labels: ["message", "add", "new"],
    description: "Round speech bubble with a plus inside.",
  },
  "message-download-02": {
    labels: ["message", "download", "save"],
    description: "Speech bubble with a download arrow inside.",
  },
  "minus-plus-01": {
    labels: ["plus minus", "tolerance", "math"],
    description: "Plus-minus sign with two-pixel bars.",
  },
  "minus-plus-02": {
    labels: ["plus minus", "toggle sign", "calculator"],
    description: "Plus and minus split by a slash, a +/- key.",
  },
  "monitor-pause": {
    labels: ["monitor", "pause", "screen"],
    description: "Monitor with pause bars on its screen.",
  },
  "monitor-stop": {
    labels: ["monitor", "stop", "screen"],
    description: "Monitor with a stop square on its screen.",
  },
  "moon-star": {
    labels: ["night", "moon", "star"],
    description: "Crescent moon with a small star.",
  },
  "mouse-03": {
    labels: ["mouse", "wired", "cable"],
    description: "Wired mouse with its cable on top.",
  },
  "music-01": {
    labels: ["music", "note", "circle"],
    description: "Music note in a ring.",
  },
  "music-note-square-01": {
    labels: ["music", "note", "box"],
    description: "Music note in a box.",
  },
  network: {
    labels: ["network", "nodes", "connections"],
    description: "Three nodes linked in a triangle.",
  },
  "note-remove": {
    labels: ["note", "remove", "minus"],
    description: "Note with a minus badge.",
  },
  "notebook-pen": {
    labels: ["notebook", "write", "notes"],
    description: "Notebook with rings and a cover label, a pencil badge.",
  },
  "notification-03": {
    labels: ["bell", "ringing", "alert"],
    description: "Ringing bell with a tick on each side.",
  },
  "notification-circle": {
    labels: ["bell", "notification", "circle"],
    description: "Bell in the full-grid ring of `circle`.",
  },
  "percent-circle": {
    labels: ["percent", "discount", "rate"],
    description: "Percent sign in a full-grid ring.",
  },
  "percent-square": {
    labels: ["percent", "discount", "box"],
    description: "Percent sign in a rounded box.",
  },
  "message-02-fill": {
    reference: "Filled variant of our own `message-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "message"],
    description: "Filled: speech bubble with its tail on the right.",
  },
  "message-cancel-02-fill": {
    reference:
      "Filled variant of our own `message-cancel-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "message"],
    description: "Filled: speech bubble with a cross inside.",
  },
  "message-circle-fill": {
    reference:
      "Filled variant of our own `message-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "message"],
    description: "Filled: round speech bubble.",
  },
  "message-circle-check-fill": {
    reference:
      "Filled variant of our own `message-circle-check`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "message"],
    description: "Filled: round speech bubble with a check inside.",
  },
  "monitor-pause-fill": {
    reference:
      "Filled variant of our own `monitor-pause`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "monitor"],
    description: "Filled: monitor with pause bars on its screen.",
  },
  "monitor-stop-fill": {
    reference:
      "Filled variant of our own `monitor-stop`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "monitor"],
    description: "Filled: monitor with a stop square on its screen.",
  },
  "music-01-fill": {
    reference: "Filled variant of our own `music-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "music"],
    description: "Filled: music note in a ring.",
  },
  "music-note-square-01-fill": {
    reference:
      "Filled variant of our own `music-note-square-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "music"],
    description: "Filled: music note in a box.",
  },
  "notification-circle-fill": {
    reference:
      "Filled variant of our own `notification-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "notification"],
    description: "Filled: bell in the full-grid ring of `circle`.",
  },
  "percent-circle-fill": {
    reference:
      "Filled variant of our own `percent-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "percent"],
    description: "Filled: percent sign in a full-grid ring.",
  },
  "percent-square-fill": {
    reference:
      "Filled variant of our own `percent-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "percent"],
    description: "Filled: percent sign in a rounded box.",
  },
  "customer-support": {
    labels: ["support", "headset", "help"],
    description: "Headset with a microphone, for customer support.",
  },
  "note-01": {
    labels: ["note", "document", "text"],
    description: "Page with a folded corner and lines of text.",
  },
  "plug-03": {
    labels: ["plug", "power", "cable"],
    description: "Electric plug lying on its side, prongs pointing right.",
  },
  "plus-minus": {
    labels: ["plus minus", "tolerance", "math"],
    description: "Bold plus-minus sign.",
  },
  pound: {
    labels: ["pound", "currency", "money"],
    description: "Pound sign with two-pixel uprights.",
  },
  "pound-circle": {
    labels: ["pound", "currency", "coin"],
    description: "Pound sign in a ring.",
  },
  "pound-square": {
    labels: ["pound", "currency", "box"],
    description: "Pound sign in a box.",
  },
  "pulse-02": {
    labels: ["pulse", "vitals", "monitor"],
    description: "Pulse line in a box.",
  },
  "rain-drop": {
    labels: ["drop", "water", "rain"],
    description: "Water drop.",
  },
  receipt: {
    labels: ["receipt", "bill", "purchase"],
    description: "Receipt torn top and bottom with two lines.",
  },
  "robot-01": {
    labels: ["robot", "bot", "automation"],
    description: "Robot head with antenna and square eyes.",
  },
  "scissor-01": {
    labels: ["scissors", "cut", "trim"],
    description: "Open scissors with round handles.",
  },
  "search-circle": {
    labels: ["search", "find", "magnifier"],
    description: "Magnifier inside a circle.",
  },
  "search-list-01": {
    labels: ["search", "list", "filter"],
    description: "List lines with a magnifier badge.",
  },
  "search-square": {
    labels: ["search", "find", "magnifier"],
    description: "Magnifier inside a rounded square.",
  },
  "server-cog": {
    labels: ["server", "settings", "infrastructure"],
    description: "Server rack with a cog badge.",
  },
  "share-01": {
    labels: ["share", "network", "connect"],
    description: "Three nodes linked by two branches.",
  },
  "shield-minus": {
    labels: ["shield", "security", "remove"],
    description: "Shield with a minus in its centre.",
  },
  "shield-plus": {
    labels: ["shield", "security", "add"],
    description: "Shield with a cross in its centre.",
  },
  "shopping-basket-02": {
    labels: ["basket", "shopping", "cart"],
    description: "Shopping basket with a handle and slats.",
  },
  "square-circle": {
    labels: ["shape", "square", "circle"],
    description: "Circle inside a rounded square.",
  },
  "square-lock-01": {
    labels: ["lock", "secure", "private"],
    description: "Padlock inside a rounded square.",
  },
  "square-lock-02": {
    labels: ["lock", "secure", "private"],
    description: "Padlock outline inside a rounded square.",
  },
  "ticket-01": {
    labels: ["ticket", "event", "pass"],
    description: "Ticket with notched sides and a tear line.",
  },
  "pound-circle-fill": {
    reference:
      "Filled variant of our own `pound-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pound"],
    description: "Filled: pound sign in a ring.",
  },
  "pound-square-fill": {
    reference:
      "Filled variant of our own `pound-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pound"],
    description: "Filled: pound sign in a box.",
  },
  "pulse-02-fill": {
    reference: "Filled variant of our own `pulse-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pulse"],
    description: "Filled: pulse line in a box.",
  },
  "rain-drop-fill": {
    reference: "Filled variant of our own `rain-drop`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rain"],
    description: "Filled: water drop.",
  },
  "dish-01": {
    labels: ["cloche", "dish", "serving"],
    description: "A domed serving cover with a knob, resting on a plate.",
  },
  dock: {
    labels: ["dock", "taskbar", "apps"],
    description: "A screen with the app bar along its bottom.",
  },
  dot: {
    labels: ["dot", "point", "bullet"],
    description: "A single solid round dot.",
  },
  drill: {
    labels: ["drill", "power tool", "diy"],
    description: "A power drill with a pistol grip and its bit.",
  },
  drink: {
    labels: ["cocktail", "drink", "glass"],
    description: "A cocktail glass on a stem, holding a drink.",
  },
  drone: {
    labels: ["drone", "quadcopter", "aerial"],
    description: "A quadcopter seen from above, with four arms and propellers.",
  },
  fahrenheit: {
    labels: ["fahrenheit", "temperature", "degrees"],
    description: "A degree ring beside a capital F.",
  },
  "fan-01": {
    labels: ["fan", "ventilation", "cooling"],
    description: "Four fan blades turning around a hub.",
  },
  feather: {
    labels: ["feather", "quill", "light"],
    description: "A quill feather at 45\u00b0 with its shaft.",
  },
  "female-02": {
    labels: ["female", "venus", "gender"],
    description: "The female symbol: a ring over a short cross.",
  },
  "file-diff": {
    labels: ["file", "diff", "changes"],
    description: "A file with a plus over a minus badge.",
  },
  "file-key": {
    labels: ["file", "key", "credentials"],
    description: "A file with a small key badge.",
  },
  "file-spreadsheet": {
    labels: ["spreadsheet", "file", "table"],
    description: "A sheet with a folded corner and a grid of cells.",
  },
  "file-x": {
    labels: ["file", "cross", "invalid"],
    description: "A file with a cross badge.",
  },
  fish: {
    labels: ["fish", "seafood", "animal"],
    description: "A fish in side view with a forked tail.",
  },
  "flag-off": {
    labels: ["flag", "off", "unflag"],
    description: "A flag struck through by a slash.",
  },
  focus: {
    labels: ["focus", "viewfinder", "target"],
    description: "Four viewfinder corners around a solid dot.",
  },
  "dish-01-fill": {
    reference: "Filled variant of our own `dish-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "dish"],
    description: "Filled: a domed serving cover with a knob, resting on a plate.",
  },
  "fish-fill": {
    reference: "Filled variant of our own `fish`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "fish"],
    description: "Filled: a fish in side view with a forked tail.",
  },
  bubbles: {
    labels: ["bubbles"],
    description: "Three bubbles: a large ring, a medium ring and a small solid one.",
  },
  bucket: {
    labels: ["bucket"],
    description: "Bucket: a tapered pail with a rim and an arched handle.",
  },
  "cabinet-01": {
    labels: ["cabinet"],
    description: "Filing cabinet: two drawers with a handle each, on short feet.",
  },
  cactus: {
    labels: ["cactus"],
    description: "Cactus: a solid trunk with one arm on each side.",
  },
  "calendar-days": {
    labels: ["calendar", "days"],
    description: "Calendar with four day marks.",
  },
  "calendar-range": {
    labels: ["calendar", "range"],
    description: "Calendar with a date range in the secondary tone: two end marks joined by a bar.",
  },
  "calendar-search": {
    labels: ["calendar", "search"],
    description: "Calendar with a magnifier badge in the secondary tone.",
  },
  calendars: {
    labels: ["calendars"],
    description:
      "Two calendars, one behind the other; the front one marks a day in the secondary tone.",
  },
  camper: {
    labels: ["camper"],
    description:
      "Camper van: a long living box with windows and a lower cab at the front, on two wheels.",
  },
  campfire: {
    labels: ["campfire"],
    description: "Campfire: a flame in the secondary tone over two crossed logs.",
  },
  canvas: {
    labels: ["canvas"],
    description:
      "Canvas on an easel: a framed board with a small mountain in the secondary tone, on splayed legs.",
  },
  captions: {
    labels: ["captions"],
    description: "Captions: a rounded frame with two lines of subtitle text in the secondary tone.",
  },
  cast: {
    labels: ["cast"],
    description:
      "Cast: a screen with broadcast arcs in its lower-left corner in the secondary tone.",
  },
  cd: {
    labels: ["cd"],
    description: "Compact disc: a full ring with a small ring at its centre.",
  },
  celsius: {
    labels: ["celsius"],
    description: "Degrees Celsius: a small degree ring beside a capital C.",
  },
  "chair-01": {
    labels: ["chair"],
    description: "Chair seen from the side: a tall back, a seat and two legs.",
  },
  "chart-area": {
    labels: ["chart", "area"],
    description: "Area chart: axes with a filled area under a wavy line in the secondary tone.",
  },
  "chart-bubble-01": {
    labels: ["chart", "bubble"],
    description: "Bubble chart: axes with one large ring and two small solid bubbles.",
  },
  "chart-candlestick": {
    labels: ["chart", "candlestick"],
    description:
      "Candlestick chart: a hollow candle and a filled one in the secondary tone, each with wicks.",
  },
  "chart-gantt": {
    labels: ["chart", "gantt"],
    description:
      "Gantt chart: three staggered task bars on a time axis, the middle one in the secondary tone.",
  },
  "chart-histogram": {
    labels: ["chart", "histogram"],
    description: "Histogram: three adjacent bars sharing walls, the middle one tallest.",
  },
  chef: {
    labels: ["chef"],
    description: "Chef's toque: a puffed crown over a banded base.",
  },
  "circle-dashed": {
    labels: ["circle", "dashed"],
    description: "Dashed circle: the full-grid ring broken into eight dashes.",
  },
  "circle-dot": {
    labels: ["circle", "dot"],
    description: "Ring with a solid dot at its centre in the secondary tone.",
  },
  "circle-slash": {
    labels: ["circle", "slash"],
    description: "Ring crossed by a diagonal slash.",
  },
  clapperboard: {
    labels: ["clapperboard"],
    description: "Clapperboard: a board under a hinged bar with slanted stripes.",
  },
  "folder-zip": {
    labels: ["folder", "zip"],
    description:
      "Zipped folder: the folder-01 base with a zipper and its pull in the secondary tone.",
  },
  folders: {
    labels: ["folders"],
    description: "Two folders: a folder-01 in front of a second one offset up and right.",
  },
  "forward-01": {
    labels: ["forward"],
    description: "Fast forward: two solid triangles pointing right.",
  },
  frame: {
    labels: ["frame"],
    description: "Frame: two horizontal and two vertical lines crossing near the corners.",
  },
  function: {
    labels: ["function"],
    description: "Function: an f with a hooked top and foot, beside an x in the secondary tone.",
  },
  ghost: {
    labels: ["ghost"],
    description: "Ghost: a domed body with two eyes and a zigzag hem.",
  },
  "gif-01": {
    labels: ["gif"],
    description: "GIF: the three letters G, I and F.",
  },
  "gift-card": {
    labels: ["gift", "card"],
    description:
      "Gift card: the credit-card outline crossed by a ribbon with a bow, the ribbon in the secondary tone.",
  },
  glasses: {
    labels: ["glasses"],
    description: "Glasses: two square lenses joined by a bridge.",
  },
  hand: {
    labels: ["hand"],
    description:
      "An open hand: four one-pixel fingers, the thumb out at 45°, a solid palm and a cuff.",
  },
  hanger: {
    labels: ["hanger"],
    description: "Clothes hanger: a curled hook over a wide triangle.",
  },
  hd: {
    labels: ["hd"],
    description: "HD: the two letters H and D.",
  },
  heading1: {
    labels: ["heading1"],
    description: "Heading 1: a one-pixel H with a small 1 in the secondary tone.",
  },
  heading2: {
    labels: ["heading2"],
    description: "Heading 2: a one-pixel H with a small 2 in the secondary tone.",
  },
  heading3: {
    labels: ["heading3"],
    description: "Heading 3: a one-pixel H with a small 3 in the secondary tone.",
  },
  "heart-crack": {
    labels: ["heart", "crack"],
    description: "Broken heart: the heart outline split by a zigzag crack in the secondary tone.",
  },
  "heart-pulse": {
    labels: ["heart", "pulse"],
    description:
      "Heart with a pulse: the heart outline crossed by a heartbeat line in the secondary tone.",
  },
  "image-off": {
    labels: ["image", "off"],
    description: "Image off: the image-01 frame crossed by a slash in the secondary tone.",
  },
  images: {
    labels: ["images"],
    description: "Images: an image frame in front of a second one offset up and right.",
  },
  incognito: {
    labels: ["incognito"],
    description: "Incognito: a solid hat over two round dark lenses.",
  },
  jar: {
    labels: ["jar"],
    description: "Jar: a lid over a bottle-shaped glass jar.",
  },
  "joystick-01": {
    labels: ["joystick"],
    description: "Joystick: a ball on a stick over a base, the button in the secondary tone.",
  },
  kettle: {
    labels: ["kettle"],
    description:
      "Kettle: a body with a lid and knob, the spout on the left and the handle on the right.",
  },
  "folder-zip-fill": {
    reference: "Filled variant of our own `folder-zip`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "folder"],
    description:
      "Filled: zipped folder: the folder-01 base with a zipper and its pull in the secondary tone.",
  },
  "ghost-fill": {
    reference: "Filled variant of our own `ghost`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "ghost"],
    description: "Filled: ghost: a domed body with two eyes and a zigzag hem.",
  },
  "jar-fill": {
    reference: "Filled variant of our own `jar`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "jar"],
    description: "Filled: jar: a lid over a bottle-shaped glass jar.",
  },
  "kettle-fill": {
    reference: "Filled variant of our own `kettle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "kettle"],
    description:
      "Filled: kettle: a body with a lid and knob, the spout on the left and the handle on the right.",
  },
  "bucket-fill": {
    reference: "Filled variant of our own `bucket`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bucket"],
    description: "Filled: bucket: a tapered pail with a rim and an arched handle.",
  },
  "cabinet-01-fill": {
    reference: "Filled variant of our own `cabinet-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cabinet"],
    description: "Filled: filing cabinet: two drawers with a handle each, on short feet.",
  },
  "captions-fill": {
    reference: "Filled variant of our own `captions`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "captions"],
    description:
      "Filled: captions: a rounded frame with two lines of subtitle text in the secondary tone.",
  },
  "chart-histogram-fill": {
    reference:
      "Filled variant of our own `chart-histogram`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "chart"],
    description: "Filled: histogram: three adjacent bars sharing walls, the middle one tallest.",
  },
  "chef-fill": {
    reference: "Filled variant of our own `chef`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "chef"],
    description: "Filled: chef's toque: a puffed crown over a banded base.",
  },
  "clock-alert": {
    labels: ["clock", "alert"],
    description: "Clock of `clock-01` with an exclamation-mark badge in the secondary tone.",
  },
  "code-square": {
    labels: ["code", "square"],
    description: "Square with a pair of code chevrons inside in the secondary tone.",
  },
  colors: {
    labels: ["colors"],
    description: "Painter's palette with a thumb notch and three paint dots in the secondary tone.",
  },
  component: {
    labels: ["component"],
    description: "Four solid diamonds set in a diamond, the component mark of design tools.",
  },
  "cone-01": {
    labels: ["cone"],
    description:
      "Traffic cone: a stepped trapezoid with two stripes in the secondary tone on a flat base.",
  },
  container: {
    labels: ["container"],
    description:
      "Shipping container seen from the side: a long box with three panels of short ribs.",
  },
  contracts: {
    labels: ["contracts"],
    description:
      "Page with a dog-ear, two lines of text and a signature line in the secondary tone.",
  },
  contrast: {
    labels: ["contrast"],
    description: "Circle with its right half solid: the contrast symbol.",
  },
  cookie: {
    labels: ["cookie"],
    description: "Round cookie with three chocolate chips in the secondary tone.",
  },
  "copy-link": {
    labels: ["copy", "link"],
    description: "Two sheets of `copy-plus` with a link in the secondary tone on the front sheet.",
  },
  copyright: {
    labels: ["copyright"],
    description: "Circle with a C inside in the secondary tone.",
  },
  crane: {
    labels: ["crane"],
    description:
      "Tower crane: a mast, a long jib with a short counter-jib, a hook line and a load in the secondary tone.",
  },
  crosshair: {
    labels: ["crosshair"],
    description: "Crosshair: a ring crossed by four short ticks that stop before the centre.",
  },
  "cursor-pointer-01": {
    labels: ["cursor", "pointer"],
    description: "The pointing hand of the set with its index finger up.",
  },
  "cursor-text": {
    labels: ["cursor", "text"],
    description: "Text cursor: an I-beam with short serifs top and bottom.",
  },
  "database-add": {
    labels: ["database", "add"],
    description: "Database of `database-01` with a plus badge in the secondary tone.",
  },
  "database-export": {
    labels: ["database", "export"],
    description: "Database of `database-01` with an up arrow badge in the secondary tone.",
  },
  "database-import": {
    labels: ["database", "import"],
    description: "Database of `database-01` with a down arrow badge in the secondary tone.",
  },
  "database-locked": {
    labels: ["database", "locked"],
    description: "Database of `database-01` with the padlock badge of `folder-lock`.",
  },
  "database-search": {
    labels: ["database", "search"],
    description: "Database of `database-01` with the magnifier badge of `folder-search`.",
  },
  "delete-row": {
    labels: ["delete", "row"],
    description: "Two table rows, the lower one marked with a minus in the secondary tone.",
  },
  desk: {
    labels: ["desk"],
    description: "Desk: a top, a leg on the left and a two-drawer unit on the right with handles.",
  },
  "directions-01": {
    labels: ["directions"],
    description: "Road sign: a diamond with a turn-right arrow inside in the secondary tone.",
  },
  "code-square-fill": {
    reference: "Filled variant of our own `code-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "code"],
    description: "Filled: square with a pair of code chevrons inside in the secondary tone.",
  },
  "cone-01-fill": {
    reference: "Filled variant of our own `cone-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cone"],
    description:
      "Filled: traffic cone: a stepped trapezoid with two stripes in the secondary tone on a flat base.",
  },
  "copyright-fill": {
    reference: "Filled variant of our own `copyright`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "copyright"],
    description: "Filled: circle with a C inside in the secondary tone.",
  },
  "directions-01-fill": {
    reference:
      "Filled variant of our own `directions-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "directions"],
    description:
      "Filled: road sign: a diamond with a turn-right arrow inside in the secondary tone.",
  },
  airplay: {
    labels: ["airplay"],
    description:
      "Screen open at the bottom with a solid triangle entering it, the triangle in the secondary tone.",
  },
  "align-bottom": {
    labels: ["align", "bottom"],
    description:
      "Two bars of different heights standing on a horizontal axis at the bottom; the axis in the secondary tone.",
  },
  "align-left": {
    labels: ["align", "left"],
    description:
      "Two bars of different lengths aligned on a vertical axis at the left; the axis in the secondary tone.",
  },
  "align-right": {
    labels: ["align", "right"],
    description:
      "Two bars of different lengths aligned on a vertical axis at the right; the axis in the secondary tone.",
  },
  "align-top": {
    labels: ["align", "top"],
    description:
      "Two bars of different heights hanging from a horizontal axis at the top; the axis in the secondary tone.",
  },
  ambulance: {
    labels: ["ambulance"],
    description:
      "Ambulance van facing right with a cross on its body in the secondary tone, a slanted cab and two wheels.",
  },
  "archive-restore": {
    labels: ["archive", "restore"],
    description: "Archive box with an up arrow in the secondary tone on its body.",
  },
  armchair: {
    labels: ["armchair"],
    description: "Armchair seen from the front: a back, two arms, a seat and legs.",
  },
  asterisk: {
    labels: ["asterisk"],
    description: "Six-armed asterisk drawn as a solid shape.",
  },
  "backward-01": {
    labels: ["backward"],
    description: "Rewind: two solid triangles pointing left.",
  },
  badge: {
    labels: ["badge"],
    description: "Badge: a scalloped seal outline, empty.",
  },
  balloon: {
    labels: ["balloon"],
    description: "Balloon: an oval with a knot and a short string.",
  },
  bandage: {
    labels: ["bandage"],
    description: "Adhesive bandage on a diagonal with its pad in the secondary tone.",
  },
  "bathtub-01": {
    labels: ["bathtub"],
    description: "Bathtub seen from the side, with a tap rising on the left.",
  },
  binoculars: {
    labels: ["binoculars"],
    description: "Binoculars: two barrels joined by a bridge, ending in two round lenses.",
  },
  bird: {
    labels: ["bird"],
    description: "Small bird perched, solid silhouette facing right.",
  },
  blend: {
    labels: ["blend"],
    description: "Two overlapping circles with their overlap in the secondary tone.",
  },
  blocks: {
    labels: ["blocks"],
    description: "Three joined squares in an L, and a fourth one apart in the secondary tone.",
  },
  bomb: {
    labels: ["bomb"],
    description: "Round bomb with a cap and a lit spark in the secondary tone.",
  },
  "bone-01": {
    labels: ["bone"],
    description: "Bone lying flat, with two knobs at each end.",
  },
  "book-plus": {
    labels: ["book", "plus"],
    description: "Book with a plus badge in the secondary tone in the lower right corner.",
  },
  "book-search": {
    labels: ["book", "search"],
    description:
      "Book with a magnifying glass badge in the secondary tone in the lower right corner.",
  },
  "bookmark-off-01": {
    labels: ["bookmark", "off"],
    description: "Bookmark crossed out by a diagonal in the secondary tone.",
  },
  boxes: {
    labels: ["boxes"],
    description:
      "Three boxes stacked, one on two, each with a strip of tape in the secondary tone.",
  },
  braces: {
    labels: ["braces"],
    description: "Pair of curly braces.",
  },
  brackets: {
    labels: ["brackets"],
    description: "Pair of square brackets.",
  },
  "badge-fill": {
    reference: "Filled variant of our own `badge`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "badge"],
    description: "Filled: badge: a scalloped seal outline, empty.",
  },
  "balloon-fill": {
    reference: "Filled variant of our own `balloon`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "balloon"],
    description: "Filled: balloon: an oval with a knot and a short string.",
  },
  "bomb-fill": {
    reference: "Filled variant of our own `bomb`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bomb"],
    description: "Filled: round bomb with a cap and a lit spark in the secondary tone.",
  },
  "bone-01-fill": {
    reference: "Filled variant of our own `bone-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bone"],
    description: "Filled: bone lying flat, with two knobs at each end.",
  },
  "knife-01": {
    labels: ["knife"],
    description:
      "Kitchen knife on the diagonal: a solid blade tapering to a tip at top right, a gap, a handle.",
  },
  lantern: {
    labels: ["lantern"],
    description:
      "Lantern: a ring handle, a cap and a floor overhanging the glass, a flame in the secondary tone.",
  },
  "layout-bottom": {
    labels: ["layout", "bottom"],
    description: "Window with a panel along the bottom, the panel in the secondary tone.",
  },
  lifebuoy: {
    labels: ["lifebuoy"],
    description:
      "Lifebuoy: a ring with four bands in the secondary tone at top, bottom, left and right.",
  },
  "list-checks": {
    labels: ["list", "checks"],
    description: "Checklist: two check marks in the secondary tone, each with its line.",
  },
  locker: {
    labels: ["locker"],
    description: "Locker: a tall door with two vents and a handle in the secondary tone.",
  },
  "luggage-01": {
    labels: ["luggage"],
    description: "Suitcase standing up: a handle, a body with two straps, two small wheels.",
  },
  "mail-reply-01": {
    labels: ["mail", "reply"],
    description:
      "Envelope with a shallow 2:1 flap and a reply arrow badge in the secondary tone, lower right.",
  },
  "mail-search-01": {
    labels: ["mail", "search"],
    description:
      "Envelope with a shallow 2:1 flap and a magnifier badge in the secondary tone, lower right.",
  },
  "mail-x": {
    labels: ["mail", "x"],
    description:
      "Envelope with a shallow 2:1 flap and a cross badge in the secondary tone, lower right.",
  },
  "male-02": {
    labels: ["male"],
    description: "Male symbol: a ring with an arrow leaving it 1:1 to the upper right.",
  },
  manager: {
    labels: ["manager"],
    description: "Manager: the user's head and shoulders with a tie in the secondary tone.",
  },
  math: {
    labels: ["math"],
    description: "Math: plus, minus, times and equals in the four quarters.",
  },
  "megaphone-01": {
    labels: ["megaphone"],
    description:
      "Megaphone: a mouthpiece box, a cone opening to the right, a handle, sound in the secondary tone.",
  },
  "message-incoming-01": {
    labels: ["message", "incoming"],
    description:
      "Speech bubble with an arrow pointing in to the lower left, in the secondary tone.",
  },
  "message-outgoing-01": {
    labels: ["message", "outgoing"],
    description:
      "Speech bubble with an arrow pointing out to the upper right, in the secondary tone.",
  },
  metronome: {
    labels: ["metronome"],
    description:
      "Metronome: a pyramid body with 2:1 sides on a base, its pendulum in the secondary tone.",
  },
  microwave: {
    labels: ["microwave"],
    description:
      "Microwave: a box with a door on the left and two knobs in the secondary tone on the right.",
  },
  milestone: {
    labels: ["milestone"],
    description: "Milestone: a signpost board pointing right on a pole, on a base.",
  },
  "money-receive-01": {
    labels: ["money", "receive"],
    description: "Banknote with an arrow coming down into it, in the secondary tone.",
  },
  "money-send-01": {
    labels: ["money", "send"],
    description: "Banknote with an arrow leaving it upwards, in the secondary tone.",
  },
  "lantern-fill": {
    reference: "Filled variant of our own `lantern`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "lantern"],
    description:
      "Filled: lantern: a ring handle, a cap and a floor overhanging the glass, a flame in the secondary tone.",
  },
  "luggage-01-fill": {
    reference: "Filled variant of our own `luggage-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "luggage"],
    description:
      "Filled: suitcase standing up: a handle, a body with two straps, two small wheels.",
  },
  "microwave-fill": {
    reference: "Filled variant of our own `microwave`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "microwave"],
    description:
      "Filled: microwave: a box with a door on the left and two knobs in the secondary tone on the right.",
  },
  "milestone-fill": {
    reference: "Filled variant of our own `milestone`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "milestone"],
    description: "Filled: milestone: a signpost board pointing right on a pole, on a base.",
  },
  "radar-01": {
    labels: ["radar"],
    description:
      "Radar scope: the copyright ring, a centre dot and the sweep in the secondary tone.",
  },
  ranking: {
    labels: ["ranking"],
    description: "Ranking podium: three steps, the winner's step filled in the secondary tone.",
  },
  refrigerator: {
    labels: ["refrigerator"],
    description: "Refrigerator: a tall box, freezer door on top, two handles, small feet.",
  },
  register: {
    labels: ["register"],
    description: "Cash register: a display on a stand over a keyed body and a drawer.",
  },
  registered: {
    labels: ["registered"],
    description: "Registered mark: the copyright ring with an R in the secondary tone.",
  },
  replace: {
    labels: ["replace"],
    description:
      "Replace: two squares swapping places, two arrows in the secondary tone; half-turn symmetric.",
  },
  rhombus: {
    labels: ["rhombus"],
    description: "Rhombus: a 1:1 diamond outline with two-pixel tips.",
  },
  "rows-2": {
    labels: ["rows"],
    description: "Two rows: a frame split in two by one rule.",
  },
  salad: {
    labels: ["salad"],
    description: "Salad: a bowl with two leaves rising over the rim in the secondary tone.",
  },
  "scan-text": {
    labels: ["scan", "text"],
    description: "Scan text: the scan brackets with two text lines in the secondary tone.",
  },
  "search-check": {
    labels: ["search", "check"],
    description: "Search with a check: the search-remove lens with a check in the secondary tone.",
  },
  "select-01": {
    labels: ["select"],
    description: "Selection: a dashed square, two-pixel dashes and gaps, solid corners.",
  },
  "server-crash": {
    labels: ["server", "crash"],
    description:
      "Server crash: the server-stack-01 top unit with a lightning bolt in the secondary tone below.",
  },
  shapes: {
    labels: ["shapes"],
    description: "Shapes: a triangle over a square and a circle.",
  },
  "shield-alert": {
    labels: ["shield", "alert"],
    description: "Shield with an exclamation mark in the secondary tone; shield-plus base.",
  },
  "shield-off": {
    labels: ["shield", "off"],
    description: "Shield crossed by a 1:1 slash in the secondary tone; shield-plus base.",
  },
  "shield-x": {
    labels: ["shield", "x"],
    description: "Shield with a cross in the secondary tone; shield-plus base.",
  },
  shredder: {
    labels: ["shredder"],
    description:
      "Shredder: a sheet entering the machine, strips leaving below in the secondary tone.",
  },
  "refrigerator-fill": {
    reference:
      "Filled variant of our own `refrigerator`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "refrigerator"],
    description: "Filled: refrigerator: a tall box, freezer door on top, two handles, small feet.",
  },
  "registered-fill": {
    reference: "Filled variant of our own `registered`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "registered"],
    description: "Filled: registered mark: the copyright ring with an R in the secondary tone.",
  },
  "rhombus-fill": {
    reference: "Filled variant of our own `rhombus`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rhombus"],
    description: "Filled: rhombus: a 1:1 diamond outline with two-pixel tips.",
  },
  "shield-alert-fill": {
    reference:
      "Filled variant of our own `shield-alert`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "shield"],
    description: "Filled: shield with an exclamation mark in the secondary tone; shield-plus base.",
  },
  "shield-x-fill": {
    reference: "Filled variant of our own `shield-x`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "shield"],
    description: "Filled: shield with a cross in the secondary tone; shield-plus base.",
  },
  "monitor-off": {
    labels: ["monitor", "off"],
    description: "Monitor of `monitor-pause` with a slash across its screen in the secondary tone.",
  },
  "monitor-play": {
    labels: ["monitor", "play"],
    description:
      "Monitor of `monitor-pause` with a play triangle on its screen in the secondary tone.",
  },
  "monitor-smartphone": {
    labels: ["monitor", "smartphone"],
    description: "A small monitor on its stand and a phone beside it in the secondary tone.",
  },
  "motorbike-01": {
    labels: ["motorbike"],
    description: "Motorbike seen from the side: two wheels, a seat, a tank and the handlebar fork.",
  },
  necklace: {
    labels: ["necklace"],
    description: "Necklace: a chain hanging in a U with a diamond pendant in the secondary tone.",
  },
  octagon: {
    labels: ["octagon"],
    description: "Regular octagon: flat top and sides, one-pixel cut corners.",
  },
  option: {
    labels: ["option"],
    description:
      "The option key symbol: a left bar, a falling diagonal to a lower bar, a separate upper bar.",
  },
  oven: {
    labels: ["oven"],
    description:
      "Oven: a box with a control strip of two knobs in the secondary tone and a door window.",
  },
  "package-search": {
    labels: ["package", "search"],
    description: "Parcel of `package` with a magnifier badge in the shared lower-right corner.",
  },
  "pencil-ruler": {
    labels: ["pencil", "ruler"],
    description:
      "A ruler with ticks beside the pencil of `pencil`, its eraser in the secondary tone.",
  },
  pentagon: {
    labels: ["pentagon"],
    description: "Pentagon with a point on top: 1:1 upper sides, steeper lower sides, a flat base.",
  },
  perfume: {
    labels: ["perfume"],
    description: "Perfume bottle: a solid cap in the secondary tone, a short neck, a rounded body.",
  },
  pickaxe: {
    labels: ["pickaxe"],
    description: "Pickaxe upright: a curved solid head with pointed ends over a two-pixel handle.",
  },
  pilcrow: {
    labels: ["pilcrow"],
    description: "Pilcrow (paragraph mark): a solid bowl and two stems.",
  },
  "plant-01": {
    labels: ["plant"],
    description: "Potted plant: two leaves in the secondary tone on a stem over a tapered pot.",
  },
  pool: {
    labels: ["pool"],
    description:
      "Swimming pool: a ladder with hooked rails over two rows of waves in the secondary tone.",
  },
  popcorn: {
    labels: ["popcorn"],
    description:
      "Popcorn: a scalloped top of kernels over a tapered striped bucket, stripes in the secondary tone.",
  },
  potion: {
    labels: ["potion"],
    description: "Potion: a round-bottomed flask with a cork, liquid in the secondary tone.",
  },
  prescription: {
    labels: ["prescription"],
    description:
      "Prescription sign Rx: an R whose leg is crossed by a stroke in the secondary tone.",
  },
  projector: {
    labels: ["projector"],
    description: "Projector: a wide box with a round lens in the secondary tone and two feet.",
  },
  "octagon-fill": {
    reference: "Filled variant of our own `octagon`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "octagon"],
    description: "Filled: regular octagon: flat top and sides, one-pixel cut corners.",
  },
  "oven-fill": {
    reference: "Filled variant of our own `oven`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "oven"],
    description:
      "Filled: oven: a box with a control strip of two knobs in the secondary tone and a door window.",
  },
  "perfume-fill": {
    reference: "Filled variant of our own `perfume`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "perfume"],
    description:
      "Filled: perfume bottle: a solid cap in the secondary tone, a short neck, a rounded body.",
  },
  "projector-fill": {
    reference: "Filled variant of our own `projector`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "projector"],
    description:
      "Filled: projector: a wide box with a round lens in the secondary tone and two feet.",
  },
  "timer-reset": {
    labels: ["timer", "reset"],
    description:
      "Stopwatch reset: a stopwatch whose ring opens on the left into an arrowhead in the secondary tone.",
  },
  "toilet-01": {
    labels: ["toilet"],
    description: "Toilet seen from the side: a tank, the seat, a bowl narrowing to its foot.",
  },
  "tornado-01": {
    labels: ["tornado"],
    description: "Tornado: five stacked strokes shrinking and wandering down to a tip.",
  },
  trademark: {
    labels: ["trademark"],
    description: "Trademark sign: the letters TM.",
  },
  "tree-01": {
    labels: ["tree"],
    description: "Tree: a round canopy on a trunk in the secondary tone.",
  },
  ufo: {
    labels: ["ufo"],
    description: "UFO: a domed saucer, the light beam below in the secondary tone.",
  },
  "user-key": {
    labels: ["user", "key"],
    description: "Person with a key badge, the key of `folder-key`, lower right.",
  },
  variable: {
    labels: ["variable"],
    description: "Variable: an x in the secondary tone between two parentheses.",
  },
  vibrate: {
    labels: ["vibrate"],
    description: "Vibrate: a phone between two short strokes in the secondary tone.",
  },
  voice: {
    labels: ["voice"],
    description: "Voice: five sound bars, tallest in the middle.",
  },
  "wallet-cards": {
    labels: ["wallet", "cards"],
    description: "Wallet with a card in the secondary tone sticking out of the top.",
  },
  "wardrobe-01": {
    labels: ["wardrobe"],
    description: "Wardrobe: two doors with handles in the secondary tone, two feet.",
  },
  wave: {
    labels: ["wave"],
    description: "Waves: three wavy lines, the middle one in the secondary tone.",
  },
  weight: {
    labels: ["weight"],
    description: "Weight: a heavy trapezoid with a handle loop on top.",
  },
  whistle: {
    labels: ["whistle"],
    description: "Whistle seen from the side: a round chamber and the mouthpiece reaching right.",
  },
  "work-history": {
    labels: ["work", "history"],
    description: "Work history: a briefcase with a clock badge, as in `folder-clock`.",
  },
  zzz: {
    labels: ["zzz"],
    description: "Sleep: a big Z and a small Z above right.",
  },
  "toilet-01-fill": {
    reference: "Filled variant of our own `toilet-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "toilet"],
    description:
      "Filled: toilet seen from the side: a tank, the seat, a bowl narrowing to its foot.",
  },
  "tree-01-fill": {
    reference: "Filled variant of our own `tree-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "tree"],
    description: "Filled: tree: a round canopy on a trunk in the secondary tone.",
  },
  "weight-fill": {
    reference: "Filled variant of our own `weight`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "weight"],
    description: "Filled: weight: a heavy trapezoid with a handle loop on top.",
  },
  "whistle-fill": {
    reference: "Filled variant of our own `whistle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "whistle"],
    description:
      "Filled: whistle seen from the side: a round chamber and the mouthpiece reaching right.",
  },
  signpost: {
    labels: ["signpost"],
    description: "A signpost: a pole with a sign pointing right above one pointing left.",
  },
  "simcard-01": {
    labels: ["simcard"],
    description: "A SIM card: a card with the upper right corner cut and the chip in the middle.",
  },
  siren: {
    labels: ["siren"],
    description: "A siren: a domed light on its base, with light rays above.",
  },
  skull: {
    labels: ["skull"],
    description: "A skull: a round cranium, two eye sockets, a nose and a narrow jaw.",
  },
  slash: {
    labels: ["slash"],
    description: "A slash: one diagonal stroke, drawn like the chevrons with two-pixel runs.",
  },
  "sofa-01": {
    labels: ["sofa"],
    description: "A sofa: a wide back, two arms and a long seat on short legs.",
  },
  sparkle: {
    labels: ["sparkle"],
    description: "One sparkle: a four-pointed star with concave sides.",
  },
  split: {
    labels: ["split"],
    description: "Split: one stem forking into two arrows, up left and up right.",
  },
  sprout: {
    labels: ["sprout"],
    description: "A sprout: two leaves on a short stem above the ground.",
  },
  "square-dashed": {
    labels: ["square", "dashed"],
    description: "A dashed square: the outline of a square in dashes, corners kept.",
  },
  "stairs-01": {
    labels: ["stairs"],
    description: "Stairs: three steps rising to the right, closed by the wall and floor.",
  },
  stamp: {
    labels: ["stamp"],
    description: "A rubber stamp: a knob and neck over the block, with its print below.",
  },
  steering: {
    labels: ["steering"],
    description: "A steering wheel: the rim, a hub and three spokes.",
  },
  sticker: {
    labels: ["sticker"],
    description: "A sticker: a square with its lower right corner peeled back.",
  },
  subscript: {
    labels: ["subscript"],
    description: "Subscript: a letter X with a small 2 below on the right.",
  },
  sunglasses: {
    labels: ["sunglasses"],
    description: "Sunglasses: the glasses frame with tinted lenses.",
  },
  superscript: {
    labels: ["superscript"],
    description: "Superscript: a letter X with a small 2 above on the right.",
  },
  "sword-01": {
    labels: ["sword"],
    description: "A sword: a diagonal blade, a cross guard and a short grip.",
  },
  tags: {
    labels: ["tags"],
    description: "Tags: a price tag with its hole, the edge of a second tag behind it.",
  },
  telephone: {
    labels: ["telephone"],
    description: "A desk telephone: the handset resting on a base with a dial.",
  },
  "text-color": {
    labels: ["text", "color"],
    description: "Text color: a letter A over a bar of colour.",
  },
  "text-quote": {
    labels: ["text", "quote"],
    description: "Quoted text: a quote bar beside lines of text.",
  },
  "text-wrap": {
    labels: ["text", "wrap"],
    description: "Text wrap: a line of text that turns back under itself as an arrow.",
  },
  timeline: {
    labels: ["timeline"],
    description: "A timeline: three events strung on a vertical line, each with a label.",
  },
  "timer-off": {
    labels: ["timer", "off"],
    description:
      "A timer struck through: the timer-01 body without its hand, under a diagonal slash.",
  },
  "simcard-01-fill": {
    reference: "Filled variant of our own `simcard-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "simcard"],
    description:
      "Filled: a SIM card: a card with the upper right corner cut and the chip in the middle.",
  },
  "stairs-01-fill": {
    reference: "Filled variant of our own `stairs-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "stairs"],
    description: "Filled: stairs: three steps rising to the right, closed by the wall and floor.",
  },
  "sticker-fill": {
    reference: "Filled variant of our own `sticker`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "sticker"],
    description: "Filled: a sticker: a square with its lower right corner peeled back.",
  },
  "cards-01": {
    labels: ["cards"],
    description: "Cards.",
  },
  clover: {
    labels: ["clover"],
    description: "Clover.",
  },
  ear: {
    labels: ["ear"],
    description: "Ear.",
  },
  "file-code": {
    labels: ["file", "code"],
    description: "File code.",
  },
  fireworks: {
    labels: ["fireworks"],
    description: "Fireworks.",
  },
  "folder-git": {
    labels: ["folder", "git"],
    description: "Folder git.",
  },
  "folder-shared-01": {
    labels: ["folder", "shared"],
    description: "Folder shared.",
  },
  football: {
    labels: ["football"],
    description: "Football.",
  },
  guitar: {
    labels: ["guitar"],
    description: "Guitar.",
  },
  "hand-coins": {
    labels: ["hand", "coins"],
    description:
      "Hand holding coins: the offering hand of the set under a stack of coins in the secondary tone.",
  },
  "hand-heart": {
    labels: ["hand", "heart"],
    description:
      "Hand holding a heart: the offering hand of the set with a heart in the secondary tone above the fingers.",
  },
  kanban: {
    labels: ["kanban"],
    description: "Kanban.",
  },
  "keyboard-off": {
    labels: ["keyboard", "off"],
    description: "Keyboard off.",
  },
  "location-share-01": {
    labels: ["location", "share"],
    description: "The shared map pin with an up-right arrow badge in the secondary tone.",
  },
  mailbox: {
    labels: ["mailbox"],
    description: "Mailbox.",
  },
  mirror: {
    labels: ["mirror"],
    description: "Mirror.",
  },
  signature: {
    labels: ["signature"],
    description: "Signature.",
  },
  tickets: {
    labels: ["tickets"],
    description: "Tickets.",
  },
  tire: {
    labels: ["tire"],
    description: "Tire.",
  },
  "touchpad-01": {
    labels: ["touchpad"],
    description: "Touchpad.",
  },
  translate: {
    labels: ["translate"],
    description: "Translate.",
  },
  ungroup: {
    labels: ["ungroup"],
    description: "Ungroup.",
  },
  usb: {
    labels: ["usb"],
    description: "Usb.",
  },
  vote: {
    labels: ["vote"],
    description: "Vote.",
  },
  "cards-01-fill": {
    reference: "Filled variant of our own `cards-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cards"],
    description: "Filled: cards.",
  },
  "vote-fill": {
    reference: "Filled variant of our own `vote`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "vote"],
    description: "Filled: vote.",
  },
  "mailbox-fill": {
    reference: "Filled variant of our own `mailbox`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "mailbox"],
    description: "Filled: mailbox.",
  },
  "border-top-01": {
    labels: ["border", "top"],
    description: "Border top: a dotted square with its top edge drawn solid in the secondary tone.",
  },
  "border-vertical": {
    labels: ["border", "vertical"],
    description:
      "Border vertical: a dotted square with a solid vertical line through its middle in the secondary tone.",
  },
  "briefcase-conveyor-belt": {
    labels: ["briefcase", "conveyor", "belt"],
    description:
      "Baggage conveyor: a briefcase on a conveyor belt, the belt in the secondary tone.",
  },
  "briefcase-dollar": {
    labels: ["briefcase", "dollar"],
    description:
      "Briefcase dollar: the briefcase of briefcase-01 with a dollar sign in the secondary tone in the lower-right corner.",
  },
  "calendar-analysis": {
    labels: ["calendar", "analysis"],
    description:
      "Calendar: the calendar of calendar-add-01, a small bar chart in the secondary tone in the lower-right corner.",
  },
  "calendar-date-1": {
    labels: ["calendar", "date"],
    description: "Calendar date: a calendar page showing the number one in the secondary tone.",
  },
  "calendar-fold": {
    labels: ["calendar", "fold"],
    description:
      "Calendar fold: the calendar of calendar-01 with its lower-right corner folded, the flap in the secondary tone.",
  },
  "calendar-x2": {
    labels: ["calendar", "x2"],
    description:
      "Calendar: the calendar of calendar-add-01, a cross in the secondary tone in the lower-right corner.",
  },
  "call-done": {
    labels: ["call", "done"],
    description:
      "Call: the handset of call, a check mark in the secondary tone in the upper-right corner.",
  },
  "call-locked": {
    labels: ["call", "locked"],
    description:
      "Call: the handset of call, a lock in the secondary tone in the upper-right corner.",
  },
  "call-paused": {
    labels: ["call", "paused"],
    description:
      "Call: the handset of call, a pause sign in the secondary tone in the upper-right corner.",
  },
  "call-spark-01": {
    labels: ["call", "spark"],
    description:
      "Call: the handset of call, a spark in the secondary tone in the upper-right corner.",
  },
  "call-unlocked": {
    labels: ["call", "unlocked"],
    description:
      "Call: the handset of call, an open lock in the secondary tone in the upper-right corner.",
  },
  "camera-automatically-01": {
    labels: ["camera", "automatically"],
    description:
      "Camera automatic: the camera of camera-add-01 with a letter A in the secondary tone in the lower-right corner.",
  },
  "camera-lens": {
    labels: ["camera", "lens"],
    description: "Camera lens: a round lens, the inner glass ring in the secondary tone.",
  },
  "camera-tripod": {
    labels: ["camera", "tripod"],
    description:
      "Camera tripod: a small camera on a three-legged stand, the lens in the secondary tone.",
  },
  "car-alert": {
    labels: ["car", "alert"],
    description:
      "Car alert: the car of car-time with an exclamation mark in the secondary tone in the lower-right corner.",
  },
  "car-taxi-front": {
    labels: ["car", "taxi", "front"],
    description:
      "Taxi: the car of car-01 seen from the front with a roof sign in the secondary tone.",
  },
  "car-transmission": {
    labels: ["car", "transmission"],
    description:
      "Car transmission: the H pattern of a gear lever, the knob positions in the secondary tone.",
  },
  "chart-average": {
    labels: ["chart", "average"],
    description:
      "Chart average: bars on an axis with the average line across them in the secondary tone.",
  },
  "chart-bar-decreasing": {
    labels: ["chart", "bar", "decreasing"],
    description:
      "Bar chart decreasing: an axis with three horizontal bars getting shorter, the bars in the secondary tone.",
  },
  "chart-bar-increasing": {
    labels: ["chart", "bar", "increasing"],
    description:
      "Bar chart increasing: an axis with three horizontal bars getting longer, the bars in the secondary tone.",
  },
  "chart-bar-stacked": {
    labels: ["chart", "bar", "stacked"],
    description:
      "Stacked bar chart: an axis with two horizontal bars in two segments, the second segment in the secondary tone.",
  },
  "chart-breakout-circle": {
    labels: ["chart", "breakout", "circle"],
    description:
      "Chart breakout: a ring with a chart line breaking out of its upper-right side, the line in the secondary tone.",
  },
  "chart-breakout-square": {
    labels: ["chart", "breakout", "square"],
    description:
      "Chart breakout: a square frame with a chart line breaking out of its upper-right corner, the line in the secondary tone.",
  },
  "chart-column-decreasing": {
    labels: ["chart", "column", "decreasing"],
    description:
      "Column chart decreasing: an axis with three columns getting shorter, the columns in the secondary tone.",
  },
  "chart-column-dots": {
    labels: ["chart", "column", "dots"],
    description:
      "Dot column chart: an axis with three columns of dots, the dots in the secondary tone.",
  },
  "chart-column-increasing": {
    labels: ["chart", "column", "increasing"],
    description:
      "Column chart increasing: an axis with three columns getting taller, the columns in the secondary tone.",
  },
  "chat-blocked": {
    labels: ["chat", "blocked"],
    description:
      "Chat: a speech bubble, a blocked sign in the secondary tone in the lower-right corner.",
  },
  "chat-delay": {
    labels: ["chat", "delay"],
    description: "Chat: a speech bubble, a clock in the secondary tone in the lower-right corner.",
  },
  "chat-done": {
    labels: ["chat", "done"],
    description:
      "Chat: a speech bubble, a check mark in the secondary tone in the lower-right corner.",
  },
  "chat-favourite": {
    labels: ["chat", "favourite"],
    description: "Chat: a speech bubble, a star in the secondary tone in the lower-right corner.",
  },
  "chat-feedback": {
    labels: ["chat", "feedback"],
    description:
      "Chat: a speech bubble, an exclamation mark in the secondary tone in the lower-right corner.",
  },
  "chat-income": {
    labels: ["chat", "income"],
    description:
      "Chat: a speech bubble, an incoming arrow in the secondary tone in the lower-right corner.",
  },
  "chat-outcome": {
    labels: ["chat", "outcome"],
    description:
      "Chat: a speech bubble, an outgoing arrow in the secondary tone in the lower-right corner.",
  },
  "chat-preview": {
    labels: ["chat", "preview"],
    description: "Chat preview: a speech bubble with an eye inside, the eye in the secondary tone.",
  },
  "chat-secure": {
    labels: ["chat", "secure"],
    description: "Chat: a speech bubble, a shield in the secondary tone in the lower-right corner.",
  },
  "chat-spark": {
    labels: ["chat", "spark"],
    description: "Chat: a speech bubble, a spark in the secondary tone in the lower-right corner.",
  },
  "chat-translate": {
    labels: ["chat", "translate"],
    description:
      "Chat: a speech bubble, a translation glyph in the secondary tone in the lower-right corner.",
  },
  "chevron-first": {
    labels: ["chevron", "first"],
    description: "Chevron first: a left chevron against a bar.",
  },
  "chevron-last": {
    labels: ["chevron", "last"],
    description: "Chevron last: a right chevron against a bar.",
  },
  "chevrons-down-up": {
    labels: ["chevrons", "down", "up"],
    description: "Chevrons down up: two chevrons pointing towards each other, to collapse.",
  },
  "chevrons-left-right": {
    labels: ["chevrons", "left", "right"],
    description:
      "Chevrons left right: two chevrons pointing away from each other, to expand sideways.",
  },
  "chevrons-right-left": {
    labels: ["chevrons", "right", "left"],
    description:
      "Chevrons right left: two chevrons pointing towards each other, to collapse sideways.",
  },
  "circle-arrow-data-transfer-horizontal": {
    labels: ["circle", "arrow", "data"],
    description:
      "Data transfer: a ring with two opposite horizontal arrows, the arrows in the secondary tone.",
  },
  "calendar-date-1-fill": {
    reference:
      "Filled variant of our own `calendar-date-1`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "calendar"],
    description:
      "Filled: calendar date: a calendar page showing the number one in the secondary tone.",
  },
  "calendar-fold-fill": {
    reference:
      "Filled variant of our own `calendar-fold`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "calendar"],
    description:
      "Filled: calendar fold: the calendar of calendar-01 with its lower-right corner folded, the flap in the secondary tone.",
  },
  "camera-lens-fill": {
    reference: "Filled variant of our own `camera-lens`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "camera"],
    description: "Filled: camera lens: a round lens, the inner glass ring in the secondary tone.",
  },
  "car-taxi-front-fill": {
    reference:
      "Filled variant of our own `car-taxi-front`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "car"],
    description:
      "Filled: taxi: the car of car-01 seen from the front with a roof sign in the secondary tone.",
  },
  "circle-arrow-data-transfer-horizontal-fill": {
    reference:
      "Filled variant of our own `circle-arrow-data-transfer-horizontal`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description:
      "Filled: data transfer: a ring with two opposite horizontal arrows, the arrows in the secondary tone.",
  },
  "finger-print-scan": {
    labels: ["finger", "print", "scan"],
    description:
      "Fingerprint scan: the scan corners of `scan` around a small fingerprint of nested arcs.",
  },
  "flip-bottom": {
    labels: ["flip", "bottom"],
    description: "Flip to the bottom: the top half of a card drawn solid, its mirror below dashed.",
  },
  "flip-horizontal": {
    labels: ["flip", "horizontal"],
    description:
      "Flip horizontally: a solid triangle and its outlined mirror image across a dashed vertical axis.",
  },
  "flip-left": {
    labels: ["flip", "left"],
    description:
      "Flip to the left: the right half of a card drawn solid, its mirror on the left dashed.",
  },
  "flip-phone": {
    labels: ["flip", "phone"],
    description: "Flip phone: a handset with an antenna on the upper left and a small screen.",
  },
  "flip-right": {
    labels: ["flip", "right"],
    description:
      "Flip to the right: the left half of a card drawn solid, its mirror on the right dashed.",
  },
  "flip-top": {
    labels: ["flip", "top"],
    description: "Flip to the top: the bottom half of a card drawn solid, its mirror above dashed.",
  },
  "flip-vertical": {
    labels: ["flip", "vertical"],
    description:
      "Flip vertically: a solid triangle and its outlined mirror image across a dashed horizontal axis.",
  },
  "folder-attachment": {
    labels: ["folder", "attachment"],
    description:
      "Folder with a paperclip badge: `folder-01` one row up, the clip in the secondary tone at the lower right.",
  },
  "folder-block": {
    labels: ["folder", "block"],
    description:
      "Folder with a blocked badge: a ring crossed by a slash at the lower right, as on `user-block-01`.",
  },
  "folder-code": {
    labels: ["folder", "code"],
    description:
      "Folder with code brackets inside: `folder-01`, a `<` and a `>` in the secondary tone.",
  },
  "folder-details": {
    labels: ["folder", "details"],
    description:
      "Folder with an information badge: a serif `i` in the secondary tone at the lower right.",
  },
  "folder-dot": {
    labels: ["folder", "dot"],
    description:
      "Folder with a dot: `folder-01`, a two-by-two dot in the secondary tone at its centre.",
  },
  "folder-export": {
    labels: ["folder", "export"],
    description:
      "Folder with an export badge: an arrow leaving towards the upper right, at the lower right.",
  },
  "folder-file-storage": {
    labels: ["folder", "file", "storage"],
    description: "Folder with a file badge: a small sheet with a folded corner at the lower right.",
  },
  "gallery-horizontal": {
    labels: ["gallery", "horizontal"],
    description: "Horizontal gallery: a card between the edges of its two neighbours.",
  },
  "gallery-horizontal-end": {
    labels: ["gallery", "horizontal", "end"],
    description:
      "Gallery at its end: a card on the right, the edges of the previous cards stacked on the left.",
  },
  "gallery-thumbnails": {
    labels: ["gallery", "thumbnails"],
    description: "Gallery with thumbnails: a large card above a row of three small thumbnails.",
  },
  "gallery-vertical": {
    labels: ["gallery", "vertical"],
    description:
      "Vertical gallery: a card between the edges of its two neighbours, above and below.",
  },
  "gallery-vertical-end": {
    labels: ["gallery", "vertical", "end"],
    description:
      "Gallery at its end: a card at the bottom, the edges of the previous cards stacked above.",
  },
  "git-branch-minus": {
    labels: ["git", "branch", "minus"],
    description:
      "Git branch with a minus: `git-branch` with the minus badge in the secondary tone at the lower right.",
  },
  "git-branch-plus": {
    labels: ["git", "branch", "plus"],
    description:
      "Git branch with a plus: `git-branch` with the plus badge in the secondary tone at the lower right.",
  },
  "git-commit-vertical": {
    labels: ["git", "commit", "vertical"],
    description: "Commit on a vertical line: `git-commit` turned a quarter turn.",
  },
  "git-merge-conflict": {
    labels: ["git", "merge", "conflict"],
    description:
      "Merge conflict: `git-merge` with the merging branch ending in a cross in the secondary tone.",
  },
  "git-pull-request-arrow": {
    labels: ["git", "pull", "request"],
    description:
      "Pull request: the base branch on the left, the change on the right running up to an arrow that points back.",
  },
  "git-pull-request-create": {
    labels: ["git", "pull", "request"],
    description:
      "New pull request: the base branch on the left, a short line on the right and a plus below it.",
  },
  "git-pull-request-create-arrow": {
    labels: ["git", "pull", "request"],
    description:
      "New pull request: the base branch on the left, an arrow pointing back on the right and a plus below it.",
  },
  "git-pull-request-draft": {
    labels: ["git", "pull", "request"],
    description:
      "Draft pull request: the base branch on the left, a dashed change ending in a commit on the right.",
  },
  "global-editing": {
    labels: ["global", "editing"],
    description:
      "Globe with a pencil badge: the globe cut back at the lower right around a pencil in the secondary tone.",
  },
  "global-education": {
    labels: ["global", "education"],
    description: "Globe with a graduation cap badge at the lower right.",
  },
  "global-refresh": {
    labels: ["global", "refresh"],
    description:
      "Globe with a refresh badge: a circular arrow in the secondary tone at the lower right.",
  },
  "global-search": {
    labels: ["global", "search"],
    description:
      "Globe with a search badge: a small magnifier in the secondary tone at the lower right.",
  },
  "hand-bag-01": {
    labels: ["hand", "bag"],
    description:
      "Handbag: a rounded handle over a body that widens towards the base, a clasp in the secondary tone.",
  },
  "hand-fist": {
    labels: ["hand", "fist"],
    description:
      "Fist: four knuckles, the thumb folded along the side, a solid palm and the cuff of the open hand.",
  },
  "hand-grab": {
    labels: ["hand", "grab"],
    description:
      "Grabbing hand: the open hand with its four fingers bent short and level, the thumb out.",
  },
  "hand-metal": {
    labels: ["hand", "metal"],
    description:
      "Rock sign: the open hand with the index and little fingers raised, the middle fingers folded.",
  },
  "hand-platter": {
    labels: ["hand", "platter"],
    description:
      "Hand holding a platter: the offering hand of the set under a dome on a plate in the secondary tone.",
  },
  "hand-pointing-left-01": {
    labels: ["hand", "pointing", "left"],
    description: "Hand pointing left: the right-pointing hand mirrored.",
  },
  "hand-pointing-right-01": {
    labels: ["hand", "pointing", "right"],
    description:
      "Hand pointing right: the pointing hand of the set turned a quarter turn, cuff on the left.",
  },
  "house-heart": {
    labels: ["house", "heart"],
    description:
      "House with a heart inside: the outline of `home-01` without its door, a heart in the secondary tone.",
  },
  "house-plug": {
    labels: ["house", "plug"],
    description:
      "House with a plug inside: the outline of `home-01` without its door, a plug in the secondary tone.",
  },
  "house-plus": {
    labels: ["house", "plus"],
    description:
      "House with a plus inside: the outline of `home-01` without its door, a plus in the secondary tone.",
  },
  "house-wifi": {
    labels: ["house", "wifi"],
    description:
      "House with Wi-Fi inside: the outline of `home-01` without its door, a signal in the secondary tone.",
  },
  "image-actual-size": {
    labels: ["image", "actual", "size"],
    description: "Actual size: a landscape frame with `1:1` in the secondary tone.",
  },
  "image-counter-clockwise": {
    labels: ["image", "counter", "clockwise"],
    description:
      "Image rotated counter-clockwise: the picture of `image-add-01` with a counter-clockwise arrow badge at the lower right.",
  },
  "image-rotation-clockwise": {
    labels: ["image", "rotation", "clockwise"],
    description:
      "Image rotated clockwise: the picture of `image-add-01` with a clockwise arrow badge at the lower right.",
  },
  "input-numeric": {
    labels: ["input", "numeric"],
    description: "Numeric input: a field with the digits `12` in the secondary tone.",
  },
  "input-text": {
    labels: ["input", "text"],
    description: "Text input: a field with a letter and a text cursor in the secondary tone.",
  },
  "insert-bottom-image": {
    labels: ["insert", "bottom", "image"],
    description:
      "Image inserted at the bottom: two lines of text above a picture frame in the secondary tone.",
  },
  "insert-center-image": {
    labels: ["insert", "center", "image"],
    description:
      "Image inserted in the middle: a picture frame in the secondary tone between two lines of text.",
  },
  "flip-phone-fill": {
    reference: "Filled variant of our own `flip-phone`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "flip"],
    description:
      "Filled: flip phone: a handset with an antenna on the upper left and a small screen.",
  },
  "hand-bag-01-fill": {
    reference: "Filled variant of our own `hand-bag-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "hand"],
    description:
      "Filled: handbag: a rounded handle over a body that widens towards the base, a clasp in the secondary tone.",
  },
  "cursor-loading-01": {
    labels: ["cursor", "loading"],
    description: "A pointer arrow and a loading ring badge.",
  },
  "cursor-magic-selection-01": {
    labels: ["cursor", "magic", "selection"],
    description: "A pointer arrow and a sparkle badge: magic selection.",
  },
  "cursor-progress-01": {
    labels: ["cursor", "progress"],
    description: "A pointer arrow and an hourglass badge.",
  },
  "cursor-rectangle-selection-01": {
    labels: ["cursor", "rectangle", "selection"],
    description: "Dashed selection corners and a pointer arrow inside.",
  },
  "cursor-remove-selection-01": {
    labels: ["cursor", "remove", "selection"],
    description: "A pointer arrow and a cross badge: clear the selection.",
  },
  "dashboard-browsing": {
    labels: ["dashboard", "browsing"],
    description: "A browser window with a gauge inside.",
  },
  "dashboard-circle-add": {
    labels: ["dashboard", "circle", "add"],
    description: "Three circles of a grid and a plus badge in the fourth place.",
  },
  "dashboard-circle-edit": {
    labels: ["dashboard", "circle", "edit"],
    description: "Three circles of a grid and a pencil badge in the fourth place.",
  },
  "dashboard-circle-remove": {
    labels: ["dashboard", "circle", "remove"],
    description: "Three circles of a grid and a minus badge in the fourth place.",
  },
  "dashboard-circle-settings": {
    labels: ["dashboard", "circle", "settings"],
    description: "Three circles of a grid and a gear badge in the fourth place.",
  },
  "database-expand": {
    labels: ["database", "expand"],
    description: "A database cylinder and a two-way diagonal arrow badge.",
  },
  "database-lightning": {
    labels: ["database", "lightning"],
    description: "A database cylinder and a lightning bolt badge.",
  },
  "database-restore": {
    labels: ["database", "restore"],
    description: "A database cylinder and a counter-clockwise arrow badge.",
  },
  "database-setting": {
    labels: ["database", "setting"],
    description: "A database cylinder and a gear badge.",
  },
  "delivery-delay-01": {
    labels: ["delivery", "delay"],
    description: "A parcel and a clock badge: late delivery.",
  },
  "delivery-return-01": {
    labels: ["delivery", "return"],
    description: "A parcel and a left arrow badge: return.",
  },
  "delivery-secure-01": {
    labels: ["delivery", "secure"],
    description: "A parcel and a shield badge: insured delivery.",
  },
  "delivery-view-01": {
    labels: ["delivery", "view"],
    description: "A parcel and an eye badge: track the delivery.",
  },
  "distribute-horizontal-center": {
    labels: ["distribute", "horizontal", "center"],
    description: "Two boxes side by side, a guide through the centre of each.",
  },
  "distribute-horizontal-left": {
    labels: ["distribute", "horizontal", "left"],
    description: "Two boxes side by side, a guide on the left edge of each.",
  },
  "distribute-horizontal-right": {
    labels: ["distribute", "horizontal", "right"],
    description: "Two boxes side by side, a guide on the right edge of each.",
  },
  "distribute-vertical-bottom": {
    labels: ["distribute", "vertical", "bottom"],
    description: "Two boxes stacked, a guide on the bottom edge of each.",
  },
  "distribute-vertical-center": {
    labels: ["distribute", "vertical", "center"],
    description: "Two boxes stacked, a guide through the centre of each.",
  },
  "distribute-vertical-top": {
    labels: ["distribute", "vertical", "top"],
    description: "Two boxes stacked, a guide on the top edge of each.",
  },
  "dollar-square": {
    labels: ["dollar", "square"],
    description: "A dollar sign in a rounded square.",
  },
  "door-lock": {
    labels: ["door", "lock"],
    description: "A door frame and a padlock badge.",
  },
  "door-open": {
    labels: ["door", "open"],
    description: "A door frame with its leaf swung open.",
  },
  "edit-table": {
    labels: ["edit", "table"],
    description: "A table and a pencil badge.",
  },
  "electric-home-01": {
    labels: ["electric", "home"],
    description: "A house with a lightning bolt inside.",
  },
  "electric-plugs": {
    labels: ["electric", "plugs"],
    description: "A plug facing a socket, each on its cable.",
  },
  "electric-tower-01": {
    labels: ["electric", "tower"],
    description: "A power line pylon with its cross-arm.",
  },
  euro: {
    labels: ["euro"],
    description: "The euro sign.",
  },
  "euro-square": {
    labels: ["euro", "square"],
    description: "A euro sign in a rounded square.",
  },
  "exclamation-mark": {
    labels: ["exclamation", "mark"],
    description: "An exclamation mark.",
  },
  "exclamation-mark-big": {
    labels: ["exclamation", "mark", "big"],
    description: "A wide, bold exclamation mark.",
  },
  "exclamation-mark-big-slash": {
    labels: ["exclamation", "mark", "big"],
    description: "A bold exclamation mark struck through.",
  },
  "exclamation-mark-slash": {
    labels: ["exclamation", "mark", "slash"],
    description: "An exclamation mark struck through: alerts off.",
  },
  "file-axis-3d": {
    labels: ["file", "axis", "3d"],
    description: "A document and three axes badge.",
  },
  "file-badge": {
    labels: ["file", "badge"],
    description: "A document and a medal badge.",
  },
  "file-bitcoin": {
    labels: ["file", "bitcoin"],
    description: "A document and a bitcoin sign badge.",
  },
  "file-block": {
    labels: ["file", "block"],
    description: "A document and a no-entry badge.",
  },
  "file-box": {
    labels: ["file", "box"],
    description: "A document and a box badge.",
  },
  "file-braces": {
    labels: ["file", "braces"],
    description: "A document and curly braces badge.",
  },
  "file-chart-column": {
    labels: ["file", "chart", "column"],
    description: "A document and a column chart badge.",
  },
  "file-chart-column-increasing": {
    labels: ["file", "chart", "column"],
    description: "A document and rising columns badge.",
  },
  "filter-edit": {
    labels: ["filter", "edit"],
    description: "A funnel and a pencil badge.",
  },
  "filter-mail-circle": {
    labels: ["filter", "mail", "circle"],
    description: "Filter lines in a circle.",
  },
  "filter-mail-edit": {
    labels: ["filter", "mail", "edit"],
    description: "Filter lines, long to short, and a pencil badge.",
  },
  "filter-mail-remove": {
    labels: ["filter", "mail", "remove"],
    description: "Filter lines, long to short, and a cross badge.",
  },
  "filter-mail-square": {
    labels: ["filter", "mail", "square"],
    description: "Filter lines in a rounded square.",
  },
  "filter-vertical": {
    labels: ["filter", "vertical"],
    description: "Three vertical sliders.",
  },
  "finger-print": {
    labels: ["finger", "print"],
    description: "A fingerprint: nested arcs.",
  },
  "finger-print-add": {
    labels: ["finger", "print", "add"],
    description: "A fingerprint and a plus badge.",
  },
  "finger-print-check": {
    labels: ["finger", "print", "check"],
    description: "A fingerprint and a check badge.",
  },
  "finger-print-minus": {
    labels: ["finger", "print", "minus"],
    description: "A fingerprint and a minus badge.",
  },
  "finger-print-remove": {
    labels: ["finger", "print", "remove"],
    description: "A fingerprint and a cross badge.",
  },
  "dollar-square-fill": {
    reference:
      "Filled variant of our own `dollar-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "dollar"],
    description: "Filled: a dollar sign in a rounded square.",
  },
  "euro-square-fill": {
    reference: "Filled variant of our own `euro-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "euro"],
    description: "Filled: a euro sign in a rounded square.",
  },
  "filter-mail-circle-fill": {
    reference:
      "Filled variant of our own `filter-mail-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "filter"],
    description: "Filled: filter lines in a circle.",
  },
  "filter-mail-square-fill": {
    reference:
      "Filled variant of our own `filter-mail-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "filter"],
    description: "Filled: filter lines in a rounded square.",
  },
  "circle-arrow-data-transfer-vertical": {
    labels: ["circle", "arrow", "data"],
    description: "Up and down arrows side by side in a ring, the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-diagonal-01": {
    labels: ["circle", "arrow", "diagonal"],
    description:
      "Diagonal double arrow, lower left to upper right, in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-down-double": {
    labels: ["circle", "arrow", "down"],
    description: "Two chevrons pointing down in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-down-left": {
    labels: ["circle", "arrow", "down"],
    description: "Arrow pointing down and left in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-down-right": {
    labels: ["circle", "arrow", "down"],
    description: "Arrow pointing down and right in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-expand-01": {
    labels: ["circle", "arrow", "expand"],
    description:
      "Two corner arrows pointing out, upper right and lower left, in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-horizontal": {
    labels: ["circle", "arrow", "horizontal"],
    description: "Double-headed horizontal arrow in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-left-double": {
    labels: ["circle", "arrow", "left"],
    description: "Two chevrons pointing left in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-left-right": {
    labels: ["circle", "arrow", "left"],
    description: "An arrow left above an arrow right, in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-move-down-left": {
    labels: ["circle", "arrow", "move"],
    description: "Arrow that runs down then turns left, in the ring of `circle-arrow-down-01`.",
  },
  "clipboard-copy": {
    labels: ["clipboard", "copy"],
    description:
      "Clipboard with an arrow pointing left into it, the cut board of `clipboard-plus`.",
  },
  "clipboard-paste": {
    labels: ["clipboard", "paste"],
    description:
      "Clipboard with an arrow pointing right out of it, the cut board of `clipboard-plus`.",
  },
  "clipboard-pen-line": {
    labels: ["clipboard", "pen", "line"],
    description:
      "Clipboard with a pencil badge and a short written line, `clipboard-pen` with a line.",
  },
  "clipboard-type": {
    labels: ["clipboard", "type"],
    description: "Clipboard with a capital T in the secondary tone, the board of `clipboard`.",
  },
  "clipboard-x": {
    labels: ["clipboard", "x"],
    description: "Clipboard with a cross badge, the cut board of `clipboard-plus`.",
  },
  "clock-arrow-down": {
    labels: ["clock", "arrow", "down"],
    description: "Clock with an arrow-down badge, the cut clock of `clock-plus`.",
  },
  "clock-arrow-up": {
    labels: ["clock", "arrow", "up"],
    description: "Clock with an arrow-up badge, the cut clock of `clock-plus`.",
  },
  "clock-fading": {
    labels: ["clock", "fading"],
    description: "Clock of `clock-01` whose left half fades into dashes.",
  },
  "clock-hour-1": {
    labels: ["clock", "hour"],
    description:
      "Clock of `clock-01` reading one o'clock: the long hand up, the short hand towards one.",
  },
  "cloud-alert": {
    labels: ["cloud", "alert"],
    description:
      "Cloud of `rain` with an exclamation mark in the secondary tone running out of its base.",
  },
  "cloud-big-rain": {
    labels: ["cloud", "big", "rain"],
    description:
      "Cloud of `rain` with three long straight streaks of heavy rain in the secondary tone.",
  },
  "cloud-drizzle": {
    labels: ["cloud", "drizzle"],
    description: "Cloud of `rain` with four short drizzle dashes in the secondary tone.",
  },
  "cloud-fast-wind": {
    labels: ["cloud", "fast", "wind"],
    description:
      "Cloud of `rain` with two speed lines trailing to the left, in the secondary tone.",
  },
  "cloud-fog": {
    labels: ["cloud", "fog"],
    description: "Cloud of `rain` over two fog bands in the secondary tone.",
  },
  "cloud-hail": {
    labels: ["cloud", "hail"],
    description: "Cloud of `rain` with three hailstones in the secondary tone.",
  },
  "cloud-hailstone": {
    labels: ["cloud", "hailstone"],
    description: "Cloud of `rain` with one big round hailstone in the secondary tone.",
  },
  "cloud-little-rain": {
    labels: ["cloud", "little", "rain"],
    description: "Cloud of `rain` with two drops instead of three.",
  },
  "cloud-little-snow": {
    labels: ["cloud", "little", "snow"],
    description: "Cloud of `cloud-snow` with one flake instead of two.",
  },
  "coins-bitcoin": {
    labels: ["coins", "bitcoin"],
    description: "Two coins, the front one with a bitcoin B in the secondary tone.",
  },
  "coins-pound": {
    labels: ["coins", "pound"],
    description: "Two coins, the front one with a pound sign in the secondary tone.",
  },
  "coins-swap": {
    labels: ["coins", "swap"],
    description: "Two coins, the front one with a left and a right arrow in the secondary tone.",
  },
  "coins-yen": {
    labels: ["coins", "yen"],
    description: "Two coins, the front one with a yen sign in the secondary tone.",
  },
  "computer-activity": {
    labels: ["computer", "activity"],
    description: "Monitor of `computer-add` showing a pulse line in the secondary tone.",
  },
  "computer-arrow-down": {
    labels: ["computer", "arrow", "down"],
    description: "Monitor of `computer-add` showing an arrow down in the secondary tone.",
  },
  "computer-arrow-up": {
    labels: ["computer", "arrow", "up"],
    description: "Monitor of `computer-add` showing an arrow up in the secondary tone.",
  },
  "computer-chart-down": {
    labels: ["computer", "chart", "down"],
    description: "Monitor of `computer-add` showing a falling chart line with an arrowhead.",
  },
  "computer-chart-up": {
    labels: ["computer", "chart", "up"],
    description: "Monitor of `computer-add` showing a rising chart line with an arrowhead.",
  },
  "computer-ethernet": {
    labels: ["computer", "ethernet"],
    description: "Monitor of `computer-add` showing an ethernet port in the secondary tone.",
  },
  "computer-programming-01": {
    labels: ["computer", "programming"],
    description: "Monitor of `computer-add` showing angle brackets in the secondary tone.",
  },
  "computer-protection": {
    labels: ["computer", "protection"],
    description: "Monitor of `computer-add` showing a solid shield in the secondary tone.",
  },
  "corner-down-left": {
    labels: ["corner", "down", "left"],
    description:
      "Line down then left, arrowhead pointing left: `arrow-turn-backward` flipped upside down.",
  },
  "corner-down-right": {
    labels: ["corner", "down", "right"],
    description: "Line down then right, arrowhead pointing right: `corner-down-left` mirrored.",
  },
  "corner-left-down": {
    labels: ["corner", "left", "down"],
    description: "Line left then down, arrowhead pointing down: `corner-left-up` flipped.",
  },
  "corner-left-up": {
    labels: ["corner", "left", "up"],
    description:
      "Line left then up, arrowhead pointing up: `arrow-turn-backward` turned a quarter.",
  },
  "corner-right-down": {
    labels: ["corner", "right", "down"],
    description: "Line right then down, arrowhead pointing down: `corner-left-down` mirrored.",
  },
  "corner-right-up": {
    labels: ["corner", "right", "up"],
    description: "Line right then up, arrowhead pointing up: `corner-left-up` mirrored.",
  },
  "credit-card-accept": {
    labels: ["credit", "card", "accept"],
    description: "Card of `credit-card` with a check-mark badge.",
  },
  "credit-card-add": {
    labels: ["credit", "card", "add"],
    description: "Card of `credit-card` with a plus badge.",
  },
  "credit-card-defrost": {
    labels: ["credit", "card", "defrost"],
    description: "Card of `credit-card` with a water-drop badge: the ice has melted.",
  },
  "credit-card-freeze": {
    labels: ["credit", "card", "freeze"],
    description: "Card of `credit-card` with a snowflake badge.",
  },
  "credit-card-not-accept": {
    labels: ["credit", "card", "not"],
    description: "Card of `credit-card` with a cross badge.",
  },
  "credit-card-not-found": {
    labels: ["credit", "card", "not"],
    description: "Card of `credit-card` with a question-mark badge.",
  },
  "cursor-add-selection-01": {
    labels: ["cursor", "add", "selection"],
    description: "Pointer of `cursor-01` with a plus badge in the upper right.",
  },
  "cursor-circle-selection-01": {
    labels: ["cursor", "circle", "selection"],
    description: "Pointer of `cursor-01` with a small ring selection in the upper right.",
  },
  "cursor-disabled-01": {
    labels: ["cursor", "disabled"],
    description: "Pointer of `cursor-01` with a no-entry badge: a ring and its slash.",
  },
  "cursor-edit-01": {
    labels: ["cursor", "edit"],
    description: "Pointer of `cursor-01` with a pencil badge in the upper right.",
  },
  "cursor-in-window": {
    labels: ["cursor", "in", "window"],
    description: "Window with a title bar and a small pointer inside, in the secondary tone.",
  },
  "cursor-info-01": {
    labels: ["cursor", "info"],
    description: "Pointer of `cursor-01` with a letter i badge in the upper right.",
  },
  "circle-arrow-data-transfer-vertical-fill": {
    reference:
      "Filled variant of our own `circle-arrow-data-transfer-vertical`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description:
      "Filled: up and down arrows side by side in a ring, the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-diagonal-01-fill": {
    reference:
      "Filled variant of our own `circle-arrow-diagonal-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description:
      "Filled: diagonal double arrow, lower left to upper right, in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-down-double-fill": {
    reference:
      "Filled variant of our own `circle-arrow-down-double`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: two chevrons pointing down in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-down-left-fill": {
    reference:
      "Filled variant of our own `circle-arrow-down-left`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: arrow pointing down and left in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-down-right-fill": {
    reference:
      "Filled variant of our own `circle-arrow-down-right`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: arrow pointing down and right in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-expand-01-fill": {
    reference:
      "Filled variant of our own `circle-arrow-expand-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description:
      "Filled: two corner arrows pointing out, upper right and lower left, in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-horizontal-fill": {
    reference:
      "Filled variant of our own `circle-arrow-horizontal`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: double-headed horizontal arrow in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-left-double-fill": {
    reference:
      "Filled variant of our own `circle-arrow-left-double`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: two chevrons pointing left in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-left-right-fill": {
    reference:
      "Filled variant of our own `circle-arrow-left-right`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description:
      "Filled: an arrow left above an arrow right, in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-move-down-left-fill": {
    reference:
      "Filled variant of our own `circle-arrow-move-down-left`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description:
      "Filled: arrow that runs down then turns left, in the ring of `circle-arrow-down-01`.",
  },
  "clipboard-type-fill": {
    reference:
      "Filled variant of our own `clipboard-type`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "clipboard"],
    description:
      "Filled: clipboard with a capital T in the secondary tone, the board of `clipboard`.",
  },
  "clock-hour-1-fill": {
    reference:
      "Filled variant of our own `clock-hour-1`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "clock"],
    description:
      "Filled: clock of `clock-01` reading one o'clock: the long hand up, the short hand towards one.",
  },
  "cursor-in-window-fill": {
    reference:
      "Filled variant of our own `cursor-in-window`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cursor"],
    description:
      "Filled: window with a title bar and a small pointer inside, in the secondary tone.",
  },
  "add-circle-half-dot": {
    labels: ["add", "circle", "half"],
    description:
      "Add, half done: the add-circle ring, its left half dotted, the plus in the secondary tone.",
  },
  "add-female": {
    labels: ["add", "female"],
    description: "Add a woman: a small female sign, a plus badge in the secondary tone.",
  },
  "add-male": {
    labels: ["add", "male"],
    description: "Add a man: a small male sign, a plus badge in the secondary tone.",
  },
  "add-money-circle": {
    labels: ["add", "money", "circle"],
    description:
      "Add money: a coin with a dollar sign, cut around a plus badge in the secondary tone.",
  },
  "airplane-landing-01": {
    labels: ["airplane", "landing"],
    description: "Landing: a plane seen from above, nose down and to the right, over the runway.",
  },
  "airplane-mode-off": {
    labels: ["airplane", "mode", "off"],
    description:
      "Airplane mode off: the airplane-01 plane crossed by a slash in the secondary tone.",
  },
  "airplane-seat": {
    labels: ["airplane", "seat"],
    description:
      "Airplane seat: a seat in profile, tall back, pedestal, armrest in the secondary tone.",
  },
  "airplane-take-off-01": {
    labels: ["airplane", "take", "off"],
    description: "Take-off: a plane seen from above, nose up and to the right, over the runway.",
  },
  "align-horizontal-center": {
    labels: ["align", "horizontal", "center"],
    description:
      "Align horizontal centres: two bars centred on a vertical axis in the secondary tone.",
  },
  "align-horizontal-distribute-center": {
    labels: ["align", "horizontal", "distribute"],
    description:
      "Distribute by centres: two bars with lines through their centres in the secondary tone.",
  },
  "align-horizontal-distribute-end": {
    labels: ["align", "horizontal", "distribute"],
    description:
      "Distribute by right edges: two bars whose right edges run on lines in the secondary tone.",
  },
  "align-horizontal-distribute-start": {
    labels: ["align", "horizontal", "distribute"],
    description:
      "Distribute by left edges: two bars whose left edges run on lines in the secondary tone.",
  },
  "align-horizontal-justify-center": {
    labels: ["align", "horizontal", "justify"],
    description:
      "Justify centre: two bars packed on both sides of a centre line in the secondary tone.",
  },
  "align-horizontal-justify-end": {
    labels: ["align", "horizontal", "justify"],
    description: "Justify end: two bars packed against a line on the right, in the secondary tone.",
  },
  "align-horizontal-justify-start": {
    labels: ["align", "horizontal", "justify"],
    description:
      "Justify start: two bars packed against a line on the left, in the secondary tone.",
  },
  "align-horizontal-space-around": {
    labels: ["align", "horizontal", "space"],
    description: "Space around: one bar centred between two edge lines in the secondary tone.",
  },
  "align-horizontal-space-between": {
    labels: ["align", "horizontal", "space"],
    description: "Space between: two bars pushed to the edge lines in the secondary tone.",
  },
  "archive-arrow-down": {
    labels: ["archive", "arrow", "down"],
    description: "Archive down: the archive box with a down arrow in the secondary tone.",
  },
  "archive-off": {
    labels: ["archive", "off"],
    description: "Archive off: the archive box crossed by a slash in the secondary tone.",
  },
  "archive-x": {
    labels: ["archive", "x"],
    description: "Archive remove: the archive box with a cross in the secondary tone.",
  },
  "arrow-all-direction": {
    labels: ["arrow", "all", "direction"],
    description: "Move in every direction: a cross with an arrowhead at each end.",
  },
  "arrow-big-down-dash": {
    labels: ["arrow", "big", "down"],
    description:
      "Big arrow down under a dash: a dash in the secondary tone, a block arrow outline below.",
  },
  "arrow-big-left-dash": {
    labels: ["arrow", "big", "left"],
    description:
      "Big arrow left beside a dash: a block arrow outline, a dash on its right in the secondary tone.",
  },
  "arrow-big-right-dash": {
    labels: ["arrow", "big", "right"],
    description:
      "Big arrow right beside a dash: a dash in the secondary tone, a block arrow outline on its right.",
  },
  "arrow-big-up-dash": {
    labels: ["arrow", "big", "up"],
    description:
      "Big arrow up over a dash: a block arrow outline, a dash below in the secondary tone.",
  },
  "arrow-data-transfer-diagonal": {
    labels: ["arrow", "data", "transfer"],
    description: "Diagonal transfer: two parallel arrows, one up-right, one down-left.",
  },
  "arrow-diagonal": {
    labels: ["arrow", "diagonal"],
    description: "Diagonal: one line with an arrowhead at each end, lower left to upper right.",
  },
  "arrow-down-a-z": {
    labels: ["arrow", "down", "a"],
    description: "Sort A to Z: a down arrow in the secondary tone beside the letters A and Z.",
  },
  "arrow-down-big": {
    labels: ["arrow", "down", "big"],
    description: "Big arrow down: a block arrow outline.",
  },
  "audio-lines": {
    labels: ["audio", "lines"],
    description: "Audio level: four vertical lines of different heights.",
  },
  "audio-waveform": {
    labels: ["audio", "waveform"],
    description: "Waveform: a line that swings up and down, wider each time.",
  },
  "badge-alert": {
    labels: ["badge", "alert"],
    description: "Badge alert: the badge rosette with an exclamation mark in the secondary tone.",
  },
  "badge-cent": {
    labels: ["badge", "cent"],
    description: "Badge cent: the badge rosette with a cent sign in the secondary tone.",
  },
  "badge-dollar-sign": {
    labels: ["badge", "dollar", "sign"],
    description: "Badge dollar: the badge rosette with a dollar sign in the secondary tone.",
  },
  "badge-euro": {
    labels: ["badge", "euro"],
    description: "Badge euro: the badge rosette with a euro sign in the secondary tone.",
  },
  "badge-info": {
    labels: ["badge", "info"],
    description: "Badge info: the badge rosette with an i in the secondary tone.",
  },
  "badge-minus": {
    labels: ["badge", "minus"],
    description: "Badge minus: the badge rosette with a minus in the secondary tone.",
  },
  "badge-percent": {
    labels: ["badge", "percent"],
    description: "Badge percent: the badge rosette with a percent sign in the secondary tone.",
  },
  "badge-plus": {
    labels: ["badge", "plus"],
    description: "Badge plus: the badge rosette with a plus in the secondary tone.",
  },
  "badge-pound-sterling": {
    labels: ["badge", "pound", "sterling"],
    description: "Badge pound: the badge rosette with a pound sign in the secondary tone.",
  },
  "bluetooth-connected": {
    labels: ["bluetooth", "connected"],
    description:
      "Bluetooth connected: the Bluetooth rune with a dot on each side in the secondary tone.",
  },
  "bluetooth-not-connected": {
    labels: ["bluetooth", "not", "connected"],
    description:
      "Bluetooth not connected: the Bluetooth rune with a cross badge in the secondary tone.",
  },
  "bluetooth-off": {
    labels: ["bluetooth", "off"],
    description:
      "Bluetooth off: the Bluetooth rune crossed by a slash in the secondary tone that passes behind it.",
  },
  "book-a": {
    labels: ["book", "a"],
    description: "Book A: the book with a letter A badge in the secondary tone.",
  },
  "book-alert": {
    labels: ["book", "alert"],
    description: "Book alert: the book with an exclamation mark badge in the secondary tone.",
  },
  "book-image": {
    labels: ["book", "image"],
    description: "Book image: the book with a small picture badge in the secondary tone.",
  },
  "book-minus": {
    labels: ["book", "minus"],
    description: "Book minus: the book with a minus badge in the secondary tone.",
  },
  "book-type": {
    labels: ["book", "type"],
    description: "Book type: the book with a letter T badge in the secondary tone.",
  },
  "book-upload": {
    labels: ["book", "upload"],
    description: "Book upload: the book with an up arrow badge in the secondary tone.",
  },
  "border-all-01": {
    labels: ["border", "all"],
    description: "Every border: a square split in four, all lines solid.",
  },
  "border-bottom-01": {
    labels: ["border", "bottom"],
    description: "Bottom border: the bottom side solid in the secondary tone, the rest dotted.",
  },
  "border-full": {
    labels: ["border", "full"],
    description:
      "Outer border: the square outline solid in the secondary tone, the inner lines dotted.",
  },
  "border-horizontal": {
    labels: ["border", "horizontal"],
    description:
      "Horizontal inner border: the middle row line solid in the secondary tone, the rest dotted.",
  },
  "border-inner": {
    labels: ["border", "inner"],
    description: "Inner borders: the inner cross solid in the secondary tone, the outline dotted.",
  },
  "border-left-01": {
    labels: ["border", "left"],
    description: "Left border: the left side solid in the secondary tone, the rest dotted.",
  },
  "border-none-01": {
    labels: ["border", "none"],
    description: "No border: a square split in four, all lines dotted.",
  },
  "border-right-01": {
    labels: ["border", "right"],
    description: "Right border: the right side solid in the secondary tone, the rest dotted.",
  },
  "arrow-big-down-dash-fill": {
    reference:
      "Filled variant of our own `arrow-big-down-dash`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "arrow"],
    description:
      "Filled: big arrow down under a dash: a dash in the secondary tone, a block arrow outline below.",
  },
  "arrow-big-left-dash-fill": {
    reference:
      "Filled variant of our own `arrow-big-left-dash`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "arrow"],
    description:
      "Filled: big arrow left beside a dash: a block arrow outline, a dash on its right in the secondary tone.",
  },
  "arrow-big-right-dash-fill": {
    reference:
      "Filled variant of our own `arrow-big-right-dash`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "arrow"],
    description:
      "Filled: big arrow right beside a dash: a dash in the secondary tone, a block arrow outline on its right.",
  },
  "arrow-big-up-dash-fill": {
    reference:
      "Filled variant of our own `arrow-big-up-dash`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "arrow"],
    description:
      "Filled: big arrow up over a dash: a block arrow outline, a dash below in the secondary tone.",
  },
  "arrow-down-big-fill": {
    reference:
      "Filled variant of our own `arrow-down-big`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "arrow"],
    description: "Filled: big arrow down: a block arrow outline.",
  },
  "badge-alert-fill": {
    reference: "Filled variant of our own `badge-alert`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "badge"],
    description:
      "Filled: badge alert: the badge rosette with an exclamation mark in the secondary tone.",
  },
  "badge-info-fill": {
    reference: "Filled variant of our own `badge-info`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "badge"],
    description: "Filled: badge info: the badge rosette with an i in the secondary tone.",
  },
  "badge-minus-fill": {
    reference: "Filled variant of our own `badge-minus`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "badge"],
    description: "Filled: badge minus: the badge rosette with a minus in the secondary tone.",
  },
  "badge-percent-fill": {
    reference:
      "Filled variant of our own `badge-percent`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "badge"],
    description:
      "Filled: badge percent: the badge rosette with a percent sign in the secondary tone.",
  },
  "badge-plus-fill": {
    reference: "Filled variant of our own `badge-plus`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "badge"],
    description: "Filled: badge plus: the badge rosette with a plus in the secondary tone.",
  },
  "insert-column": {
    labels: ["insert", "column"],
    description: "Table of three columns with a plus over the new middle column.",
  },
  "insert-column-left": {
    labels: ["insert", "column", "left"],
    description: "Table of two columns with a plus on its left: insert a column before.",
  },
  "insert-column-right": {
    labels: ["insert", "column", "right"],
    description: "Table of two columns with a plus on its right: insert a column after.",
  },
  "insert-pi": {
    labels: ["insert", "pi"],
    description: "The pi sign, to insert a formula.",
  },
  "insert-row": {
    labels: ["insert", "row"],
    description: "Table of three rows with a plus beside the new middle row.",
  },
  "insert-row-down": {
    labels: ["insert", "row", "down"],
    description: "Table of two rows with a plus below it: insert a row after.",
  },
  "insert-row-up": {
    labels: ["insert", "row", "up"],
    description: "Table of two rows with a plus above it: insert a row before.",
  },
  "insert-top-image": {
    labels: ["insert", "top", "image"],
    description: "Picture above two lines of text: insert an image at the top.",
  },
  "lamp-ceiling": {
    labels: ["lamp", "ceiling"],
    description: "Pendant lamp hanging from the ceiling, its bulb under the shade.",
  },
  "lamp-desk": {
    labels: ["lamp", "desk"],
    description: "Desk lamp: a base, a jointed arm and a shade with its bulb.",
  },
  "lamp-floor": {
    labels: ["lamp", "floor"],
    description: "Floor lamp: a shade on a tall pole with a small foot.",
  },
  "laptop-charging": {
    labels: ["laptop", "charging"],
    description: "Laptop with a lightning bolt on its screen: charging.",
  },
  "laptop-cloud": {
    labels: ["laptop", "cloud"],
    description: "Laptop with a cloud on its screen.",
  },
  "laptop-issue": {
    labels: ["laptop", "issue"],
    description: "Laptop with an exclamation mark on its screen.",
  },
  "laptop-performance": {
    labels: ["laptop", "performance"],
    description: "Laptop with a gauge on its screen.",
  },
  "laptop-programming": {
    labels: ["laptop", "programming"],
    description: "Laptop with a command prompt on its screen.",
  },
  "layer-bring-forward": {
    labels: ["layer", "bring", "forward"],
    description: "Two overlapping squares, the highlighted one in front.",
  },
  "layer-bring-to-front": {
    labels: ["layer", "bring", "to"],
    description: "Three stacked squares, the highlighted one on top.",
  },
  "layer-mask-01": {
    labels: ["layer", "mask"],
    description: "Square layer with a round mask inside.",
  },
  "layer-send-backward": {
    labels: ["layer", "send", "backward"],
    description: "Two overlapping squares, the highlighted one behind.",
  },
  "layer-send-to-back": {
    labels: ["layer", "send", "to"],
    description: "Three stacked squares, the highlighted one at the back.",
  },
  "layout-2-column": {
    labels: ["layout", "column"],
    description: "Frame split into two columns.",
  },
  "layout-3-column": {
    labels: ["layout", "column"],
    description: "Frame split into three columns.",
  },
  "layout-3-row": {
    labels: ["layout", "row"],
    description: "Frame split into three rows.",
  },
  "layout-panel-left": {
    labels: ["layout", "panel", "left"],
    description: "Frame with a highlighted panel down its left side.",
  },
  "layout-table-01": {
    labels: ["layout", "table"],
    description: "Table with a highlighted header row.",
  },
  "layout-top": {
    labels: ["layout", "top"],
    description: "Frame with its top band highlighted.",
  },
  "list-chevrons-down-up": {
    labels: ["list", "chevrons", "down"],
    description: "List with two chevrons pointing at each other: collapse.",
  },
  "list-end": {
    labels: ["list", "end"],
    description: "List with a return arrow on its last line: add at the end.",
  },
  "list-indent-decrease": {
    labels: ["list", "indent", "decrease"],
    description: "Lines of text with an arrow pointing left: decrease the indent.",
  },
  "list-music": {
    labels: ["list", "music"],
    description: "Lines of a playlist with a music note.",
  },
  "list-ordered-az": {
    labels: ["list", "ordered", "az"],
    description: "Letters A and Z with a down arrow: sort from A to Z.",
  },
  "list-start": {
    labels: ["list", "start"],
    description: "List with a return arrow on its first line: add at the start.",
  },
  "list-x": {
    labels: ["list", "x"],
    description: "List with a cross on its last line: clear the list.",
  },
  "location-add-01": {
    labels: ["location", "add"],
    description: "The shared map pin with a plus badge in the secondary tone.",
  },
  "location-favourite-01": {
    labels: ["location", "favourite"],
    description: "The shared map pin with a solid heart badge in the secondary tone.",
  },
  "location-offline-01": {
    labels: ["location", "offline"],
    description:
      "The shared map pin with a no-entry badge (a ring crossed by a bar) in the secondary tone.",
  },
  "location-remove-01": {
    labels: ["location", "remove"],
    description: "The shared map pin with a minus badge in the secondary tone.",
  },
  "location-star-01": {
    labels: ["location", "star"],
    description: "The shared map pin with a solid star badge in the secondary tone.",
  },
  "location-user-01": {
    labels: ["location", "user"],
    description:
      "The shared map pin with a person badge (a round head over shoulders) in the secondary tone.",
  },
  "lock-computer": {
    labels: ["lock", "computer"],
    description: "Desktop computer with a padlock on its screen.",
  },
  "mail-account-01": {
    labels: ["mail", "account"],
    description: "Envelope with a person: mail account.",
  },
  "mail-block-01": {
    labels: ["mail", "block"],
    description: "Envelope with a no-entry sign: block a sender.",
  },
  "mail-love-01": {
    labels: ["mail", "love"],
    description: "Envelope with a heart: a loving message.",
  },
  "mail-open-love": {
    labels: ["mail", "open", "love"],
    description: "Open envelope holding a heart.",
  },
  "mail-question-mark": {
    labels: ["mail", "question", "mark"],
    description: "Envelope with a question mark: mail help.",
  },
  "mail-secure-01": {
    labels: ["mail", "secure"],
    description: "Envelope with a shield: secure mail.",
  },
  "mail-setting-01": {
    labels: ["mail", "setting"],
    description: "Envelope with a cog: mail settings.",
  },
  "mail-unlock-01": {
    labels: ["mail", "unlock"],
    description: "Envelope with an open padlock: unlocked mail.",
  },
  "mail-upload-01": {
    labels: ["mail", "upload"],
    description: "Envelope with an up arrow: upload mail.",
  },
  "shopping-basket-add-01": {
    labels: ["shopping", "basket", "add"],
    description: "A shopping basket with a plus badge. Base from `shopping-basket-02`.",
  },
  "shopping-basket-check-in-01": {
    labels: ["shopping", "basket", "check"],
    description: "A shopping basket with an arrow pointing in. Base from `shopping-basket-02`.",
  },
  "shopping-basket-check-out-01": {
    labels: ["shopping", "basket", "check"],
    description: "A shopping basket with an arrow pointing out. Base from `shopping-basket-02`.",
  },
  "shopping-basket-done-01": {
    labels: ["shopping", "basket", "done"],
    description: "A shopping basket with a check badge. Base from `shopping-basket-02`.",
  },
  "shopping-basket-favorite-01": {
    labels: ["shopping", "basket", "favorite"],
    description: "A shopping basket with a star badge. Base from `shopping-basket-02`.",
  },
  "shopping-basket-remove-01": {
    labels: ["shopping", "basket", "remove"],
    description: "A shopping basket with a minus badge. Base from `shopping-basket-02`.",
  },
  "shopping-basket-secure-01": {
    labels: ["shopping", "basket", "secure"],
    description: "A shopping basket with a shield badge. Base from `shopping-basket-02`.",
  },
  "shopping-cart-check-in-01": {
    labels: ["shopping", "cart", "check"],
    description: "A shopping cart with an arrow pointing in. Base from `shopping-cart-add-01`.",
  },
  "shopping-cart-check-out-01": {
    labels: ["shopping", "cart", "check"],
    description: "A shopping cart with an arrow pointing out. Base from `shopping-cart-add-01`.",
  },
  "shopping-cart-favorite-01": {
    labels: ["shopping", "cart", "favorite"],
    description: "A shopping cart with a star badge. Base from `shopping-cart-add-01`.",
  },
  "signal-low-01": {
    labels: ["signal", "low"],
    description:
      "Signal bars, one of four lit; the unlit bars in the secondary tone. Bars of `signal`.",
  },
  "signal-low-medium": {
    labels: ["signal", "low", "medium"],
    description:
      "Signal bars, two of four lit; the unlit bars in the secondary tone. Bars of `signal`.",
  },
  "signal-medium-01": {
    labels: ["signal", "medium"],
    description:
      "Signal bars, three of four lit; the unlit bars in the secondary tone. Bars of `signal`.",
  },
  "signal-no-01": {
    labels: ["signal", "no"],
    description: "Signal bars, all unlit, with a cross: no signal. Bars of `signal`.",
  },
  "signal-zero": {
    labels: ["signal", "zero"],
    description: "Signal bars, none lit: all four in the secondary tone. Bars of `signal`.",
  },
  "smart-ac": {
    labels: ["smart", "ac"],
    description: "An air conditioner unit with angled air flow below.",
  },
  "smart-phone-landscape": {
    labels: ["smart", "phone", "landscape"],
    description: "A smartphone turned on its side; `smart-phone-01` rotated.",
  },
  "smart-watch-01": {
    labels: ["smart", "watch"],
    description: "A smart watch: square face with a screen and a crown, straps above and below.",
  },
  "smartphone-charging": {
    labels: ["smartphone", "charging"],
    description: "A smartphone with a charging bolt beside it.",
  },
  "smartphone-nfc": {
    labels: ["smartphone", "nfc"],
    description: "A smartphone with contactless waves beside it.",
  },
  "smartphone-wifi": {
    labels: ["smartphone", "wifi"],
    description: "A smartphone with a wifi sign beside it.",
  },
  "sorting-a-z-01": {
    labels: ["sorting", "a", "z"],
    description: "A above Z, with a down arrow: sort from A to Z.",
  },
  "sorting-z-a-01": {
    labels: ["sorting", "z", "a"],
    description: "Z above A, with a down arrow: sort from Z to A.",
  },
  "square-activity": {
    labels: ["square", "activity"],
    description: "A pulse line in the frame of `square`.",
  },
  "square-arrow-data-transfer-horizontal": {
    labels: ["square", "arrow", "data"],
    description: "Two opposite arrows, right above left, in the frame of `square`.",
  },
  "square-arrow-data-transfer-vertical": {
    labels: ["square", "arrow", "data"],
    description: "Two opposite arrows, up and down, in the frame of `square`.",
  },
  "square-arrow-diagonal-01": {
    labels: ["square", "arrow", "diagonal"],
    description: "A diagonal double-headed arrow in the frame of `square`.",
  },
  "square-arrow-down-double": {
    labels: ["square", "arrow", "down"],
    description: "A double down chevron in the frame of `square`.",
  },
  "square-arrow-down-left": {
    labels: ["square", "arrow", "down"],
    description: "An arrow pointing down and left in the frame of `square`.",
  },
  "square-arrow-down-right": {
    labels: ["square", "arrow", "down"],
    description: "An arrow pointing down and right in the frame of `square`.",
  },
  "square-arrow-expand-01": {
    labels: ["square", "arrow", "expand"],
    description: "Two corner arrows pointing out in the frame of `square`.",
  },
  "square-arrow-horizontal": {
    labels: ["square", "arrow", "horizontal"],
    description: "A double-headed horizontal arrow in the frame of `square`.",
  },
  "square-arrow-left-double": {
    labels: ["square", "arrow", "left"],
    description: "A double left chevron in the frame of `square`.",
  },
  "square-arrow-left-right": {
    labels: ["square", "arrow", "left"],
    description: "Two opposite arrows, left above right, in the frame of `square`.",
  },
  "star-circle": {
    labels: ["star", "circle"],
    description: "A solid star in a ring.",
  },
  "star-square": {
    labels: ["star", "square"],
    description: "A solid star in the frame of `square`.",
  },
  "step-into": {
    labels: ["step", "into"],
    description: "An arrow pointing down into a dot: debugger step into.",
  },
  "step-out": {
    labels: ["step", "out"],
    description: "An arrow rising up from a dot: debugger step out.",
  },
  "step-over": {
    labels: ["step", "over"],
    description: "A curved arrow jumping over a dot: debugger step over.",
  },
  "store-add-01": {
    labels: ["store", "add"],
    description: "A shop front with a plus badge. Base from `store-02`.",
  },
  "store-location-01": {
    labels: ["store", "location"],
    description: "A shop front with a location pin badge. Base from `store-02`.",
  },
  "store-management-01": {
    labels: ["store", "management"],
    description: "A shop front with a cog badge. Base from `store-02`.",
  },
  "store-remove-01": {
    labels: ["store", "remove"],
    description: "A shop front with a minus badge. Base from `store-02`.",
  },
  "store-verified-01": {
    labels: ["store", "verified"],
    description: "A shop front with a check badge. Base from `store-02`.",
  },
  "sun-cloud-angled-rain-01": {
    labels: ["sun", "cloud", "angled"],
    description: "Sun behind a cloud with slanted rain. Sun and cloud of `sun-cloud-01`, raised.",
  },
  "sun-cloud-big-rain-01": {
    labels: ["sun", "cloud", "big"],
    description: "Sun behind a cloud with heavy rain. Sun and cloud of `sun-cloud-01`, raised.",
  },
  "sun-cloud-fast-wind-01": {
    labels: ["sun", "cloud", "fast"],
    description:
      "Sun behind a cloud with fast wind lines. Sun and cloud of `sun-cloud-01`, raised.",
  },
  "sun-cloud-hailstone-01": {
    labels: ["sun", "cloud", "hailstone"],
    description: "Sun behind a cloud with hailstones. Sun and cloud of `sun-cloud-01`, raised.",
  },
  "sun-cloud-little-rain-01": {
    labels: ["sun", "cloud", "little"],
    description: "Sun behind a cloud with light rain. Sun and cloud of `sun-cloud-01`, raised.",
  },
  "sun-cloud-little-snow-01": {
    labels: ["sun", "cloud", "little"],
    description: "Sun behind a cloud with a snowflake. Sun and cloud of `sun-cloud-01`, raised.",
  },
  "sun-cloud-mid-rain-01": {
    labels: ["sun", "cloud", "mid"],
    description: "Sun behind a cloud with moderate rain. Sun and cloud of `sun-cloud-01`, raised.",
  },
  "sun-cloud-mid-snow-01": {
    labels: ["sun", "cloud", "mid"],
    description: "Sun behind a cloud with snowflakes. Sun and cloud of `sun-cloud-01`, raised.",
  },
  "sun-cloud-slow-wind-01": {
    labels: ["sun", "cloud", "slow"],
    description:
      "Sun behind a cloud with short wind lines. Sun and cloud of `sun-cloud-01`, raised.",
  },
  "swipe-down-01": {
    labels: ["swipe", "down"],
    description: "Swipe down: the pointing hand of the set beside an arrow down.",
  },
  "swipe-left-01": {
    labels: ["swipe", "left"],
    description: "Swipe left: the right-swipe hand mirrored.",
  },
  "swipe-right-01": {
    labels: ["swipe", "right"],
    description: "Swipe right: the pointing hand of the set under an arrow to the right.",
  },
  "swipe-up-01": {
    labels: ["swipe", "up"],
    description: "Swipe up: the pointing hand of the set beside an arrow up.",
  },
  "table-cells-merge": {
    labels: ["table", "cells", "merge"],
    description: "A table whose middle row is one merged cell.",
  },
  "table-cells-split": {
    labels: ["table", "cells", "split"],
    description: "A table whose middle row is split into cells.",
  },
  "table-columns-split": {
    labels: ["table", "columns", "split"],
    description: "A table split into three columns.",
  },
  "smart-phone-landscape-fill": {
    reference:
      "Filled variant of our own `smart-phone-landscape`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "smart"],
    description: "Filled: a smartphone turned on its side; `smart-phone-01` rotated.",
  },
  "square-activity-fill": {
    reference:
      "Filled variant of our own `square-activity`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: a pulse line in the frame of `square`.",
  },
  "square-arrow-data-transfer-horizontal-fill": {
    reference:
      "Filled variant of our own `square-arrow-data-transfer-horizontal`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: two opposite arrows, right above left, in the frame of `square`.",
  },
  "square-arrow-data-transfer-vertical-fill": {
    reference:
      "Filled variant of our own `square-arrow-data-transfer-vertical`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: two opposite arrows, up and down, in the frame of `square`.",
  },
  "square-arrow-diagonal-01-fill": {
    reference:
      "Filled variant of our own `square-arrow-diagonal-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: a diagonal double-headed arrow in the frame of `square`.",
  },
  "square-arrow-down-double-fill": {
    reference:
      "Filled variant of our own `square-arrow-down-double`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: a double down chevron in the frame of `square`.",
  },
  "square-arrow-down-left-fill": {
    reference:
      "Filled variant of our own `square-arrow-down-left`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: an arrow pointing down and left in the frame of `square`.",
  },
  "square-arrow-down-right-fill": {
    reference:
      "Filled variant of our own `square-arrow-down-right`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: an arrow pointing down and right in the frame of `square`.",
  },
  "square-arrow-expand-01-fill": {
    reference:
      "Filled variant of our own `square-arrow-expand-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: two corner arrows pointing out in the frame of `square`.",
  },
  "square-arrow-horizontal-fill": {
    reference:
      "Filled variant of our own `square-arrow-horizontal`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: a double-headed horizontal arrow in the frame of `square`.",
  },
  "square-arrow-left-double-fill": {
    reference:
      "Filled variant of our own `square-arrow-left-double`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: a double left chevron in the frame of `square`.",
  },
  "square-arrow-left-right-fill": {
    reference:
      "Filled variant of our own `square-arrow-left-right`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: two opposite arrows, left above right, in the frame of `square`.",
  },
  "mouse-right-click-01": {
    labels: ["mouse", "right", "click"],
    description: "Mouse of `mouse-01` with the right button lit in the secondary tone.",
  },
  "mouse-scroll-01": {
    labels: ["mouse", "scroll"],
    description: "Mouse of `mouse-01` beside an up-and-down scroll arrow in the secondary tone.",
  },
  "move-3d": {
    labels: ["move", "3d"],
    description:
      "Three axes from one corner: up, right, and a depth diagonal in the secondary tone.",
  },
  "move-bottom": {
    labels: ["move", "bottom"],
    description: "Arrow pointing down to a bar at the bottom, the bar in the secondary tone.",
  },
  "move-diagonal": {
    labels: ["move", "diagonal"],
    description: "Diagonal double arrow from top right to bottom left.",
  },
  "move-diagonal2": {
    labels: ["move", "diagonal2"],
    description: "Diagonal double arrow from top left to bottom right.",
  },
  "move-horizontal": {
    labels: ["move", "horizontal"],
    description: "Horizontal double arrow.",
  },
  "move-to": {
    labels: ["move", "to"],
    description: "A list of two lines and a third moving right, its arrow in the secondary tone.",
  },
  "move-top": {
    labels: ["move", "top"],
    description: "Arrow pointing up to a bar at the top, the bar in the secondary tone.",
  },
  "new-job": {
    labels: ["new", "job"],
    description: "Briefcase of `briefcase-01` with a plus badge in the shared lower-right corner.",
  },
  "new-office": {
    labels: ["new", "office"],
    description: "Building of `building-01` with a plus badge in the shared lower-right corner.",
  },
  "node-add": {
    labels: ["node", "add"],
    description:
      "Node tree: a stem branching to two boxes, a plus in the secondary tone at its top.",
  },
  "node-edit": {
    labels: ["node", "edit"],
    description:
      "Node tree: a stem branching to two boxes, a pencil in the secondary tone at its top.",
  },
  "node-move-down": {
    labels: ["node", "move", "down"],
    description: "Node tree of two boxes beside a down arrow in the secondary tone.",
  },
  "node-move-up": {
    labels: ["node", "move", "up"],
    description: "Node tree of two boxes beside an up arrow in the secondary tone.",
  },
  "node-remove": {
    labels: ["node", "remove"],
    description:
      "Node tree: a stem branching to two boxes, a cross in the secondary tone at its top.",
  },
  "package-dimensions-01": {
    labels: ["package", "dimensions"],
    description: "Box with its width and height marked by dimension lines in the secondary tone.",
  },
  "package-moving": {
    labels: ["package", "moving"],
    description: "Box rushing left, three speed lines behind it in the secondary tone.",
  },
  "package-process": {
    labels: ["package", "process"],
    description: "Parcel of `package` with a clock badge in the shared lower-right corner.",
  },
  "package-x": {
    labels: ["package", "x"],
    description: "Parcel of `package` with a cross badge in the shared lower-right corner.",
  },
  "panel-bottom": {
    labels: ["panel", "bottom"],
    description: "Square panel with its bottom strip in the secondary tone.",
  },
  "panel-bottom-close": {
    labels: ["panel", "bottom", "close"],
    description: "Panel of `panel-bottom` with a chevron pointing down, to close it.",
  },
  "panel-bottom-dashed": {
    labels: ["panel", "bottom", "dashed"],
    description: "Square panel split at the bottom by a dashed line in the secondary tone.",
  },
  "panel-bottom-open": {
    labels: ["panel", "bottom", "open"],
    description: "Panel of `panel-bottom` with a chevron pointing up, to open it.",
  },
  "panel-left-dashed": {
    labels: ["panel", "left", "dashed"],
    description: "Square panel split on the left by a dashed line in the secondary tone.",
  },
  "panel-left-open": {
    labels: ["panel", "left", "open"],
    description: "Panel of `panel-left-close` with the chevron pointing right, to open it.",
  },
  "panel-left-right-dashed": {
    labels: ["panel", "left", "right"],
    description: "Square panel with dashed lines in the secondary tone on both sides.",
  },
  "panel-right-close": {
    labels: ["panel", "right", "close"],
    description:
      "Mirror of `panel-left-close`: the right panel in the secondary tone, the chevron pointing to it.",
  },
  "panel-right-dashed": {
    labels: ["panel", "right", "dashed"],
    description: "Square panel split on the right by a dashed line in the secondary tone.",
  },
  "panel-right-open": {
    labels: ["panel", "right", "open"],
    description:
      "Mirror of `panel-left-open`: the right panel in the secondary tone, the chevron pointing away.",
  },
  "pen-line": {
    labels: ["pen", "line"],
    description: "Pen writing a line, the line in the secondary tone.",
  },
  "phone-arrow-down": {
    labels: ["phone", "arrow", "down"],
    description: "Smartphone with a down-arrow badge in the shared lower-right corner.",
  },
  "phone-arrow-up": {
    labels: ["phone", "arrow", "up"],
    description: "Smartphone with an up-arrow badge in the shared lower-right corner.",
  },
  "phone-check": {
    labels: ["phone", "check"],
    description: "Smartphone with a check badge in the shared lower-right corner.",
  },
  "phone-erase": {
    labels: ["phone", "erase"],
    description: "Smartphone with a cross badge in the shared lower-right corner.",
  },
  "phone-forwarded": {
    labels: ["phone", "forwarded"],
    description:
      "Handset of `call-add` with a right arrow in the secondary tone: the call is forwarded.",
  },
  "phone-lock": {
    labels: ["phone", "lock"],
    description: "Smartphone with a padlock badge in the shared lower-right corner.",
  },
  "play-list": {
    labels: ["play", "list"],
    description: "Video list: a clapper-topped square with a play triangle in the secondary tone.",
  },
  "play-list-add": {
    labels: ["play", "list", "add"],
    description:
      "Clapper-topped square of `play-list` with a plus badge in the shared lower-right corner.",
  },
  "play-list-favourite-01": {
    labels: ["play", "list", "favourite"],
    description:
      "Clapper-topped square of `play-list` with a heart badge in the shared lower-right corner.",
  },
  "play-list-minus": {
    labels: ["play", "list", "minus"],
    description:
      "Clapper-topped square of `play-list` with a minus badge in the shared lower-right corner.",
  },
  "play-list-remove": {
    labels: ["play", "list", "remove"],
    description:
      "Clapper-topped square of `play-list` with a cross badge in the shared lower-right corner.",
  },
  "printer-check": {
    labels: ["printer", "check"],
    description: "Printer of `printer` with a check badge in the shared lower-right corner.",
  },
  "printer-off": {
    labels: ["printer", "off"],
    description: "Printer of `printer` crossed out by a slash in the secondary tone.",
  },
  "printer-x": {
    labels: ["printer", "x"],
    description: "Printer of `printer` with a cross badge in the shared lower-right corner.",
  },
  "property-add": {
    labels: ["property", "add"],
    description:
      "Property sheet of `property-new` with a plus badge in the shared lower-right corner.",
  },
  "property-delete": {
    labels: ["property", "delete"],
    description:
      "Property sheet of `property-new` with a cross badge in the shared lower-right corner.",
  },
  "property-edit": {
    labels: ["property", "edit"],
    description:
      "Property sheet of `property-new` with a pencil badge in the shared lower-right corner.",
  },
  "property-new": {
    labels: ["property", "new"],
    description: "Property sheet: a window with a title bar and two dotted entries.",
  },
  "property-search": {
    labels: ["property", "search"],
    description:
      "Property sheet of `property-new` with a magnifier badge in the shared lower-right corner.",
  },
  "property-view": {
    labels: ["property", "view"],
    description:
      "Property sheet of `property-new` with an eye badge in the shared lower-right corner.",
  },
  "receipt-cent": {
    labels: ["receipt", "cent"],
    description: "Receipt of `receipt-dollar` with a cent sign in the secondary tone.",
  },
  "receipt-euro": {
    labels: ["receipt", "euro"],
    description: "Receipt of `receipt-dollar` with a euro sign in the secondary tone.",
  },
  "play-list-fill": {
    reference: "Filled variant of our own `play-list`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "play"],
    description:
      "Filled: video list: a clapper-topped square with a play triangle in the secondary tone.",
  },
  "map-pin-check": {
    labels: ["map", "pin", "check"],
    description: "The shared map pin with a check badge in the secondary tone.",
  },
  "map-pin-house": {
    labels: ["map", "pin", "house"],
    description: "The shared map pin with a small house badge in the secondary tone.",
  },
  "map-pin-minus": {
    labels: ["map", "pin", "minus"],
    description: "The shared map pin with a minus badge in the secondary tone.",
  },
  "map-pin-pen": {
    labels: ["map", "pin", "pen"],
    description: "The shared map pin with a pen badge in the secondary tone.",
  },
  "map-pin-plus": {
    labels: ["map", "pin", "plus"],
    description: "The shared map pin with a plus badge in the secondary tone.",
  },
  "map-pin-search": {
    labels: ["map", "pin", "search"],
    description: "The shared map pin with a magnifier badge in the secondary tone.",
  },
  "message-blocked": {
    labels: ["message", "blocked"],
    description:
      "Square speech bubble, cut at the lower right for a blocked sign in the secondary tone.",
  },
  "message-circle-code": {
    labels: ["message", "circle", "code"],
    description: "Round speech bubble with code brackets inside in the secondary tone.",
  },
  "message-circle-dashed": {
    labels: ["message", "circle", "dashed"],
    description: "Round speech bubble drawn as a dashed outline.",
  },
  "message-circle-more": {
    labels: ["message", "circle", "more"],
    description: "Round speech bubble with three dots inside in the secondary tone.",
  },
  "message-circle-off": {
    labels: ["message", "circle", "off"],
    description: "Round speech bubble struck through by a diagonal in the secondary tone.",
  },
  "message-circle-question-mark": {
    labels: ["message", "circle", "question"],
    description:
      "Round speech bubble, cut at the lower right for a question mark in the secondary tone.",
  },
  "message-circle-reply": {
    labels: ["message", "circle", "reply"],
    description: "Round speech bubble with a reply arrow inside in the secondary tone.",
  },
  "message-circle-warning": {
    labels: ["message", "circle", "warning"],
    description: "Round speech bubble with an exclamation mark inside in the secondary tone.",
  },
  "message-circle-x": {
    labels: ["message", "circle", "x"],
    description: "Round speech bubble with a cross inside in the secondary tone.",
  },
  "message-delay-01": {
    labels: ["message", "delay"],
    description: "Square speech bubble, cut at the lower right for a clock in the secondary tone.",
  },
  "message-favourite-01": {
    labels: ["message", "favourite"],
    description: "Square speech bubble, cut at the lower right for a star in the secondary tone.",
  },
  "mobile-navigator-01": {
    labels: ["mobile", "navigator"],
    description: "Phone, cut at the lower right for a navigation arrow in the secondary tone.",
  },
  "mobile-programming-01": {
    labels: ["mobile", "programming"],
    description: "Phone, cut at the lower right for code brackets in the secondary tone.",
  },
  "mobile-protection": {
    labels: ["mobile", "protection"],
    description: "Phone, cut at the lower right for a shield in the secondary tone.",
  },
  "mobile-security": {
    labels: ["mobile", "security"],
    description: "Phone, cut at the lower right for a padlock in the secondary tone.",
  },
  "money-add-01": {
    labels: ["money", "add"],
    description: "A plus in the secondary tone above a banknote.",
  },
  "money-bag-time": {
    labels: ["money", "bag", "time"],
    description: "Money bag, cut at the lower right for a clock in the secondary tone.",
  },
  "money-exchange-01": {
    labels: ["money", "exchange"],
    description: "Two arrows forming a banknote, with a coin inside in the secondary tone.",
  },
  "money-lock": {
    labels: ["money", "lock"],
    description: "Banknote, cut at the lower right for a padlock in the secondary tone.",
  },
  "money-not-found-01": {
    labels: ["money", "not", "found"],
    description: "Banknote, cut at the lower right for a cross in the secondary tone.",
  },
  "money-remove-01": {
    labels: ["money", "remove"],
    description: "A minus in the secondary tone above a banknote.",
  },
  "money-safe": {
    labels: ["money", "safe"],
    description: "Safe with a dollar mark on its door in the secondary tone.",
  },
  "money-saving-jar": {
    labels: ["money", "saving", "jar"],
    description: "Jar with a coin inside in the secondary tone.",
  },
  "money-security": {
    labels: ["money", "security"],
    description: "Banknote, cut at the lower right for a shield in the secondary tone.",
  },
  "monitor-dot": {
    labels: ["monitor", "dot"],
    description: "Monitor with a notification dot at its upper right corner in the secondary tone.",
  },
  "monitor-speaker": {
    labels: ["monitor", "speaker"],
    description: "Monitor beside a speaker in the secondary tone.",
  },
  "monitor-x": {
    labels: ["monitor", "x"],
    description: "Monitor with a cross on its screen in the secondary tone.",
  },
  "moon-cloud-angled-rain": {
    labels: ["moon", "cloud", "angled"],
    description: "Crescent moon behind a cloud, slanted rain in the secondary tone.",
  },
  "moon-cloud-angled-zap": {
    labels: ["moon", "cloud", "angled"],
    description: "Crescent moon behind a cloud, a lightning bolt in the secondary tone.",
  },
  "moon-cloud-big-rain": {
    labels: ["moon", "cloud", "big"],
    description: "Crescent moon behind a cloud, heavy rain in the secondary tone.",
  },
  "moon-cloud-fast-wind": {
    labels: ["moon", "cloud", "fast"],
    description: "Crescent moon behind a cloud, two long wind lines in the secondary tone.",
  },
  "moon-cloud-hailstone": {
    labels: ["moon", "cloud", "hailstone"],
    description: "Crescent moon behind a cloud, a hailstone in the secondary tone.",
  },
  "moon-cloud-little-rain": {
    labels: ["moon", "cloud", "little"],
    description: "Crescent moon behind a cloud, two short slanted drops in the secondary tone.",
  },
  "moon-cloud-little-snow": {
    labels: ["moon", "cloud", "little"],
    description: "Crescent moon behind a cloud, one snowflake in the secondary tone.",
  },
  "moon-cloud-mid-rain": {
    labels: ["moon", "cloud", "mid"],
    description: "Crescent moon behind a cloud, three short slanted drops in the secondary tone.",
  },
  "moon-cloud-mid-snow": {
    labels: ["moon", "cloud", "mid"],
    description: "Crescent moon behind a cloud, two snowflakes in the secondary tone.",
  },
  "moon-cloud-slow-wind": {
    labels: ["moon", "cloud", "slow"],
    description: "Crescent moon behind a cloud, two short wind lines in the secondary tone.",
  },
  "more-horizontal-circle-01": {
    labels: ["more", "horizontal", "circle"],
    description: "Circle with three dots in a row in the secondary tone.",
  },
  "more-or-less-circle": {
    labels: ["more", "or", "less"],
    description: "Circle with a plus over a minus inside in the secondary tone.",
  },
  "more-vertical-circle-01": {
    labels: ["more", "vertical", "circle"],
    description: "Circle with three dots in a column in the secondary tone.",
  },
  "mouse-left": {
    labels: ["mouse", "left"],
    description: "Mouse with its left button highlighted in the secondary tone.",
  },
  "mouse-left-click-01": {
    labels: ["mouse", "left", "click"],
    description:
      "Mouse with its left button highlighted and two click rays at its upper left, in the secondary tone.",
  },
  "mouse-off": {
    labels: ["mouse", "off"],
    description: "Mouse struck through by a diagonal in the secondary tone.",
  },
  "mouse-pointer-click": {
    labels: ["mouse", "pointer", "click"],
    description: "Mouse pointer with three click rays at its tip in the secondary tone.",
  },
  "mouse-right": {
    labels: ["mouse", "right"],
    description: "Mouse with its right button highlighted in the secondary tone.",
  },
  "money-safe-fill": {
    reference: "Filled variant of our own `money-safe`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "money"],
    description: "Filled: safe with a dollar mark on its door in the secondary tone.",
  },
  "more-horizontal-circle-01-fill": {
    reference:
      "Filled variant of our own `more-horizontal-circle-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "more"],
    description: "Filled: circle with three dots in a row in the secondary tone.",
  },
  "more-vertical-circle-01-fill": {
    reference:
      "Filled variant of our own `more-vertical-circle-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "more"],
    description: "Filled: circle with three dots in a column in the secondary tone.",
  },
  "more-or-less-circle-fill": {
    reference:
      "Filled variant of our own `more-or-less-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "more"],
    description: "Filled: circle with a plus over a minus inside in the secondary tone.",
  },
  "receipt-indian-rupee": {
    labels: ["receipt", "indian", "rupee"],
    description:
      "Receipt: the sheet of `receipt-dollar` with an Indian rupee sign in the secondary tone.",
  },
  "receipt-japanese-yen": {
    labels: ["receipt", "japanese", "yen"],
    description: "Receipt: the sheet of `receipt-dollar` with a yen sign in the secondary tone.",
  },
  "receipt-pound-sterling": {
    labels: ["receipt", "pound", "sterling"],
    description: "Receipt: the sheet of `receipt-dollar` with a pound sign in the secondary tone.",
  },
  "receipt-russian-ruble": {
    labels: ["receipt", "russian", "ruble"],
    description: "Receipt: the sheet of `receipt-dollar` with a ruble sign in the secondary tone.",
  },
  "receipt-swiss-franc": {
    labels: ["receipt", "swiss", "franc"],
    description: "Receipt: the sheet of `receipt-dollar` with a franc sign in the secondary tone.",
  },
  "receipt-turkish-lira": {
    labels: ["receipt", "turkish", "lira"],
    description: "Receipt: the sheet of `receipt-dollar` with a lira sign in the secondary tone.",
  },
  "rectangle-circle": {
    labels: ["rectangle", "circle"],
    description: "A wide rectangle with a small ring inside in the secondary tone.",
  },
  "rectangle-horizontal": {
    labels: ["rectangle", "horizontal"],
    description:
      "A wide rectangle with rounded corners, the outline of `square` stretched sideways.",
  },
  "rectangle-vertical": {
    labels: ["rectangle", "vertical"],
    description: "A tall rectangle with rounded corners, `rectangle-horizontal` turned upright.",
  },
  "remove-circle-half-dot": {
    labels: ["remove", "circle", "half"],
    description:
      "Remove, half done: the ring of `add-circle-half-dot`, its left half dotted, a minus in the secondary tone.",
  },
  "remove-female": {
    labels: ["remove", "female"],
    description:
      "Remove a woman: the female sign of `add-female`, a minus badge in the secondary tone.",
  },
  "remove-formatting": {
    labels: ["remove", "formatting"],
    description:
      "Clear formatting: the T of `text`, a small cross in the secondary tone at its foot.",
  },
  "remove-male": {
    labels: ["remove", "male"],
    description: "Remove a man: the male sign of `add-male`, a minus badge in the secondary tone.",
  },
  "remove-pi": {
    labels: ["remove", "pi"],
    description: "Remove pi: a pi sign, a minus badge in the secondary tone.",
  },
  "rotate-bottom-left": {
    labels: ["rotate", "bottom", "left"],
    description:
      "Rotate towards the bottom left: a square, a quarter arc in the secondary tone curling round it from its arrowhead at the right.",
  },
  "rotate-bottom-right": {
    labels: ["rotate", "bottom", "right"],
    description: "Rotate towards the bottom right: `rotate-bottom-left` mirrored.",
  },
  "rotate-ccw-square": {
    labels: ["rotate", "ccw", "square"],
    description:
      "Rotate a square anticlockwise: the box of `square`, its top edge ending in an arrowhead in the secondary tone.",
  },
  "rotate-crop": {
    labels: ["rotate", "crop"],
    description:
      "Rotate and crop: the two frames of `crop`, two arcs with arrowheads in the secondary tone at opposite corners.",
  },
  "rotate-cw-square": {
    labels: ["rotate", "cw", "square"],
    description: "Rotate a square clockwise: `rotate-ccw-square` mirrored.",
  },
  "rotate-top-left": {
    labels: ["rotate", "top", "left"],
    description:
      "Rotate towards the top left: a square low on the left, an arc in the secondary tone over it ending in a leftward arrowhead.",
  },
  "rss-connected-01": {
    labels: ["rss", "connected"],
    description:
      "RSS feed connected: the arcs of `rss` drawn smaller, with a check badge in the secondary tone in the lower right corner.",
  },
  "rss-error": {
    labels: ["rss", "error"],
    description:
      "RSS feed error: the arcs of `rss` drawn smaller, with an exclamation badge in the secondary tone in the lower right corner.",
  },
  "rss-locked": {
    labels: ["rss", "locked"],
    description:
      "RSS feed locked: the arcs of `rss` drawn smaller, with a padlock badge in the secondary tone in the lower right corner.",
  },
  "rss-unlocked": {
    labels: ["rss", "unlocked"],
    description:
      "RSS feed unlocked: the arcs of `rss` drawn smaller, with an open padlock badge in the secondary tone in the lower right corner.",
  },
  "save-all": {
    labels: ["save", "all"],
    description: "Save all: a small floppy disk in front of the corner of a second one.",
  },
  "save-energy-01": {
    labels: ["save", "energy"],
    description: "The offering hand of the set under a lightning bolt in the secondary tone.",
  },
  "save-money-dollar": {
    labels: ["save", "money", "dollar"],
    description: "The offering hand of the set under a dollar sign in the secondary tone.",
  },
  "save-money-euro": {
    labels: ["save", "money", "euro"],
    description: "The offering hand of the set under a euro sign in the secondary tone.",
  },
  "save-money-pound": {
    labels: ["save", "money", "pound"],
    description: "The offering hand of the set under a pound sign in the secondary tone.",
  },
  "save-money-yen": {
    labels: ["save", "money", "yen"],
    description: "The offering hand of the set under a yen sign in the secondary tone.",
  },
  "save-off": {
    labels: ["save", "off"],
    description:
      "Saving off: the floppy disk of `floppy-disk` crossed by a 1:1 slash in the secondary tone.",
  },
  "scan-heart": {
    labels: ["scan", "heart"],
    description: "Scan a heart: the brackets of `scan` round a heart in the secondary tone.",
  },
  "scan-image": {
    labels: ["scan", "image"],
    description:
      "Scan a picture: the brackets of `scan` round a sun and two peaks in the secondary tone.",
  },
  "scan-search": {
    labels: ["scan", "search"],
    description:
      "Scan and search: the brackets of `scan` round a small magnifier in the secondary tone.",
  },
  "school-bell-01": {
    labels: ["school", "bell"],
    description:
      "School bell: a hand bell with a wooden handle, the clapper in the secondary tone.",
  },
  "school-report-card": {
    labels: ["school", "report", "card"],
    description: "Report card: a card with a grade A in the secondary tone over a line.",
  },
  "screen-add-to-home": {
    labels: ["screen", "add", "to"],
    description:
      "Add to home screen: a phone, an arrow in the secondary tone entering it through a gap in its side.",
  },
  "screen-lock-rotation": {
    labels: ["screen", "lock", "rotation"],
    description:
      "Lock the screen rotation: the phone and arc of `screen-rotation`, a padlock badge in the secondary tone.",
  },
  "screen-rotation": {
    labels: ["screen", "rotation"],
    description:
      "Rotate the screen: a phone, a quarter arc in the secondary tone over its corner ending in a downward arrowhead.",
  },
  "screen-share-off": {
    labels: ["screen", "share", "off"],
    description:
      "Stop sharing the screen: the monitor of `screen-share` with a cross in the secondary tone.",
  },
  "search-alert": {
    labels: ["search", "alert"],
    description:
      "Search alert: the lens of `search-add` with an exclamation mark in the secondary tone.",
  },
  "search-area": {
    labels: ["search", "area"],
    description:
      "Search an area: the corners and dashed edges of a frame, a magnifier in the secondary tone at its lower right.",
  },
  "search-code": {
    labels: ["search", "code"],
    description:
      "Search code: the lens of `search-add` with two small angle brackets in the secondary tone.",
  },
  "search-dollar": {
    labels: ["search", "dollar"],
    description:
      "Search money: the lens of `search-add` with a narrow dollar sign in the secondary tone.",
  },
  "search-focus": {
    labels: ["search", "focus"],
    description:
      "Search focus: the lens of `search-add` with a solid dot at its centre in the secondary tone.",
  },
  "search-slash": {
    labels: ["search", "slash"],
    description:
      "Search off: the lens of `search-add` crossed inside by a short slash in the secondary tone.",
  },
  "security-key-usb": {
    labels: ["security", "key", "usb"],
    description:
      "USB security key: a small plug on a body with a round touch pad in the secondary tone.",
  },
  "security-wifi": {
    labels: ["security", "wifi"],
    description: "Shield with Wi-Fi arcs over a dot in the secondary tone; the shield-plus base.",
  },
  "shield-ban": {
    labels: ["shield", "ban"],
    description:
      "Shield with a no-entry sign (a ring and a slash) in the secondary tone; the shield-plus base.",
  },
  "shield-cog": {
    labels: ["shield", "cog"],
    description: "Shield with a small cog in the secondary tone; the shield-plus base.",
  },
  "shield-cog-corner": {
    labels: ["shield", "cog", "corner"],
    description:
      "Shield with a cog badge in the secondary tone: the outline of `shield-01` stopped short of the lower-right corner.",
  },
  "shield-ellipsis": {
    labels: ["shield", "ellipsis"],
    description: "Shield with three dots in the secondary tone; the shield-plus base.",
  },
  "shield-energy": {
    labels: ["shield", "energy"],
    description: "Shield with a lightning bolt in the secondary tone; the shield-plus base.",
  },
  "shield-half": {
    labels: ["shield", "half"],
    description:
      "Half a shield: the outline of `shield-01`, its right half filled in the secondary tone.",
  },
  "shield-question-mark": {
    labels: ["shield", "question", "mark"],
    description: "Shield with a question mark in the secondary tone; the shield-plus base.",
  },
  "rectangle-circle-fill": {
    reference:
      "Filled variant of our own `rectangle-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rectangle"],
    description: "Filled: a wide rectangle with a small ring inside in the secondary tone.",
  },
  "rectangle-horizontal-fill": {
    reference:
      "Filled variant of our own `rectangle-horizontal`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rectangle"],
    description:
      "Filled: a wide rectangle with rounded corners, the outline of `square` stretched sideways.",
  },
  "rectangle-vertical-fill": {
    reference:
      "Filled variant of our own `rectangle-vertical`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rectangle"],
    description:
      "Filled: a tall rectangle with rounded corners, `rectangle-horizontal` turned upright.",
  },
  "school-bell-01-fill": {
    reference:
      "Filled variant of our own `school-bell-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "school"],
    description:
      "Filled: school bell: a hand bell with a wooden handle, the clapper in the secondary tone.",
  },
  "shield-ellipsis-fill": {
    reference:
      "Filled variant of our own `shield-ellipsis`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "shield"],
    description: "Filled: shield with three dots in the secondary tone; the shield-plus base.",
  },
  "shield-energy-fill": {
    reference:
      "Filled variant of our own `shield-energy`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "shield"],
    description:
      "Filled: shield with a lightning bolt in the secondary tone; the shield-plus base.",
  },
  "shield-question-mark-fill": {
    reference:
      "Filled variant of our own `shield-question-mark`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "shield"],
    description: "Filled: shield with a question mark in the secondary tone; the shield-plus base.",
  },
  "table-of-contents": {
    labels: ["table", "of", "contents"],
    description:
      "Contents list: three entry lines, their page numbers in the secondary tone at the right.",
  },
  "table-round": {
    labels: ["table", "round"],
    description:
      "Round pedestal table seen from the side: an oval top on a single column and a foot.",
  },
  "table-rows-split": {
    labels: ["table", "rows", "split"],
    description: "Table split in two between its rows, the cut in the secondary tone.",
  },
  "tablet-connected-bluetooth": {
    labels: ["tablet", "connected", "bluetooth"],
    description:
      "Tablet with a Bluetooth rune in the secondary tone, lower right. Built on `tablet-01`.",
  },
  "tablet-connected-usb": {
    labels: ["tablet", "connected", "usb"],
    description:
      "Tablet with a USB plug and cable badge in the secondary tone, lower right. Built on `tablet-01`.",
  },
  "tablet-connected-wifi": {
    labels: ["tablet", "connected", "wifi"],
    description:
      "Tablet with a Wi-Fi badge in the secondary tone, lower right. Built on `tablet-01`.",
  },
  "tablet-pen": {
    labels: ["tablet", "pen"],
    description:
      "Tablet with a pen badge in the secondary tone, lower right. Built on `tablet-01`.",
  },
  "tablet-smartphone": {
    labels: ["tablet", "smartphone"],
    description:
      "Tablet beside a phone, the phone in the secondary tone. Same composition as `monitor-smartphone`.",
  },
  "text-align-justify": {
    labels: ["text", "align", "justify"],
    description: "Four full-width lines of justified text. Same rows as `text-align-left`.",
  },
  "text-align-justify-center": {
    labels: ["text", "align", "justify"],
    description: "Justified text whose last line is short and centred.",
  },
  "text-align-justify-left": {
    labels: ["text", "align", "justify"],
    description: "Justified text whose last line is short and flush left.",
  },
  "text-align-justify-right": {
    labels: ["text", "align", "justify"],
    description: "Justified text whose last line is short and flush right.",
  },
  "text-all-caps": {
    labels: ["text", "all", "caps"],
    description: "Two capital T letters side by side: text set in capitals.",
  },
  "text-centerline-center-top": {
    labels: ["text", "centerline", "center"],
    description:
      "Box centred at the top above two rules, margin ticks either side: the box in the secondary tone.",
  },
  "text-centerline-left": {
    labels: ["text", "centerline", "left"],
    description:
      "Box anchored to the right of two short text lines, between two rules: the box in the secondary tone.",
  },
  "text-centerline-middle": {
    labels: ["text", "centerline", "middle"],
    description:
      "Box centred between two rules, margin ticks either side: the box in the secondary tone.",
  },
  "text-centerline-right": {
    labels: ["text", "centerline", "right"],
    description:
      "Box anchored to the left of two short text lines, between two rules: the box in the secondary tone.",
  },
  "text-check": {
    labels: ["text", "check"],
    description: "Three lines of text with a check badge in the secondary tone, lower right.",
  },
  "thumbs-down-ellipse": {
    labels: ["thumbs", "down", "ellipse"],
    description:
      "Thumb down inside a circle, the thumb in the secondary tone. Built on `add-circle`.",
  },
  "thumbs-down-rectangle": {
    labels: ["thumbs", "down", "rectangle"],
    description:
      "Thumb down inside a rounded square, the thumb in the secondary tone. Built on `search-square`.",
  },
  "thumbs-up-ellipse": {
    labels: ["thumbs", "up", "ellipse"],
    description:
      "Thumb up inside a circle, the thumb in the secondary tone. Built on `add-circle`.",
  },
  "thumbs-up-rectangle": {
    labels: ["thumbs", "up", "rectangle"],
    description:
      "Thumb up inside a rounded square, the thumb in the secondary tone. Built on `search-square`.",
  },
  "ticket-check": {
    labels: ["ticket", "check"],
    description:
      "Ticket with a check in the secondary tone in place of the tear line. Built on `ticket-01`.",
  },
  "ticket-minus": {
    labels: ["ticket", "minus"],
    description:
      "Ticket with a minus in the secondary tone in place of the tear line. Built on `ticket-01`.",
  },
  "ticket-plus": {
    labels: ["ticket", "plus"],
    description:
      "Ticket with a plus in the secondary tone in place of the tear line. Built on `ticket-01`.",
  },
  "ticket-slash": {
    labels: ["ticket", "slash"],
    description:
      "Ticket struck through by a diagonal in the secondary tone: no ticket. Built on `ticket-01`.",
  },
  "ticket-star": {
    labels: ["ticket", "star"],
    description:
      "Ticket with a star in the secondary tone in place of the tear line. Built on `ticket-01`.",
  },
  "ticket-x": {
    labels: ["ticket", "x"],
    description:
      "Ticket with a cross in the secondary tone in place of the tear line. Built on `ticket-01`.",
  },
  "time-half-pass": {
    labels: ["time", "half", "pass"],
    description:
      "Clock whose right half is drawn in the secondary tone, hands at twelve and six: half the time passed. Built on `time-quarter-pass`.",
  },
  "time-management": {
    labels: ["time", "management"],
    description:
      "Small clock above a line that branches to two boxes: time shared between tasks. Hands in the secondary tone.",
  },
  "time-management-circle": {
    labels: ["time", "management", "circle"],
    description:
      "Small clock above a line that branches to two circles: time shared between people. Hands in the secondary tone.",
  },
  "time-schedule": {
    labels: ["time", "schedule"],
    description:
      "Clock with a play arrow badge in the secondary tone, lower right. Built on `clock-check`.",
  },
  "time-setting-01": {
    labels: ["time", "setting"],
    description:
      "Cog with clock hands in the secondary tone in its hole: timing settings. Built on `settings-01`.",
  },
  "unfold-horizontal": {
    labels: ["unfold", "horizontal"],
    description:
      "Two arrows pointing away from a fold line in the secondary tone: unfold sideways.",
  },
  "unfold-more": {
    labels: ["unfold", "more"],
    description: "Two chevrons pointing away from each other, up and down: expand.",
  },
  "unfold-more-down": {
    labels: ["unfold", "more", "down"],
    description:
      "Up and down triangles, the down one filled in the secondary tone: sort descending.",
  },
  "unfold-more-up": {
    labels: ["unfold", "more", "up"],
    description: "Up and down triangles, the up one filled in the secondary tone: sort ascending.",
  },
  "unfold-vertical": {
    labels: ["unfold", "vertical"],
    description:
      "Two arrows pointing away from a fold line in the secondary tone: unfold up and down.",
  },
  "usb-bugs": {
    labels: ["usb", "bugs"],
    description:
      "USB plug with a bug badge in the secondary tone, lower right: an infected drive. Built on `usb`.",
  },
  "usb-connected-01": {
    labels: ["usb", "connected"],
    description: "USB plug with its cable in the secondary tone: plugged in.",
  },
  "usb-error": {
    labels: ["usb", "error"],
    description:
      "USB plug with an exclamation mark in the secondary tone on its body. Built on `usb`.",
  },
  "usb-memory-01": {
    labels: ["usb", "memory"],
    description: "USB memory stick standing up, its light in the secondary tone.",
  },
  "usb-not-connected-01": {
    labels: ["usb", "not", "connected"],
    description:
      "USB plug and cable struck through by a diagonal in the secondary tone: not connected.",
  },
  "user-ai": {
    labels: ["user", "ai"],
    description:
      "Person with an AI sparkle badge in the secondary tone, lower right. Built on `user-check-01`.",
  },
  "user-arrow-left-right": {
    labels: ["user", "arrow", "left"],
    description:
      "Person with two opposite arrows in the secondary tone, lower right: swap or transfer. Built on `user-check-01`.",
  },
  "user-dollar": {
    labels: ["user", "dollar"],
    description:
      "Person with a dollar badge in the secondary tone, lower right. Built on `user-check-01`.",
  },
  "user-full-view": {
    labels: ["user", "full", "view"],
    description: "Whole standing person, head to feet.",
  },
  "web-design-01": {
    labels: ["web", "design"],
    description: "Browser window with a sidebar and two layout lines in the secondary tone.",
  },
  "web-programming": {
    labels: ["web", "programming"],
    description: "Browser window with code brackets in the secondary tone.",
  },
  "web-protection": {
    labels: ["web", "protection"],
    description: "Browser window with a shield badge in the secondary tone, lower right.",
  },
  "web-security": {
    labels: ["web", "security"],
    description: "Browser window with a padlock badge in the secondary tone, lower right.",
  },
  "web-validation": {
    labels: ["web", "validation"],
    description: "Browser window with a check badge in the secondary tone, lower right.",
  },
  "wifi-circle": {
    labels: ["wifi", "circle"],
    description: "Small Wi-Fi in the secondary tone inside a circle. Built on `bluetooth-circle`.",
  },
  "wifi-connected-01": {
    labels: ["wifi", "connected"],
    description:
      "Wi-Fi arcs with a check in the secondary tone in place of the dot: connected. Built on `wifi-01`.",
  },
  "wifi-disconnected-01": {
    labels: ["wifi", "disconnected"],
    description:
      "Wi-Fi arcs with a cross in the secondary tone in place of the dot: disconnected. Built on `wifi-01`.",
  },
  "wifi-low": {
    labels: ["wifi", "low"],
    description: "Wi-Fi with one arc above the dot: low strength. Built on `wifi-01`.",
  },
  "wifi-low-signal": {
    labels: ["wifi", "low", "signal"],
    description:
      "Wi-Fi with both arcs faded in the secondary tone, only the dot strong: low signal. Built on `wifi-01`.",
  },
  "wifi-medium-signal": {
    labels: ["wifi", "medium", "signal"],
    description:
      "Wi-Fi with its outer arc faded in the secondary tone: medium signal. Built on `wifi-01`.",
  },
  "wifi-no-signal": {
    labels: ["wifi", "no", "signal"],
    description: "Wi-Fi drawn entirely in the secondary tone: no signal. Built on `wifi-01`.",
  },
  "wifi-pen": {
    labels: ["wifi", "pen"],
    description:
      "Wi-Fi with a pen badge in the secondary tone, lower right: edit the network. Built on `wifi-01`.",
  },
  "zoom-circle": {
    labels: ["zoom", "circle"],
    description:
      "Video camera in the secondary tone inside a circle: the Zoom app mark, drawn generically.",
  },
  "zoom-out-area": {
    labels: ["zoom", "out", "area"],
    description:
      "Four corners of a frame around a minus in the secondary tone: zoom out of the area. Built on `zoom-in-area`.",
  },
  "zoom-square": {
    labels: ["zoom", "square"],
    description:
      "Video camera in the secondary tone inside a rounded square: the Zoom app mark, drawn generically.",
  },
  "thumbs-down-ellipse-fill": {
    reference:
      "Filled variant of our own `thumbs-down-ellipse`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "thumbs"],
    description:
      "Filled: thumb down inside a circle, the thumb in the secondary tone. Built on `add-circle`.",
  },
  "thumbs-up-ellipse-fill": {
    reference:
      "Filled variant of our own `thumbs-up-ellipse`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "thumbs"],
    description:
      "Filled: thumb up inside a circle, the thumb in the secondary tone. Built on `add-circle`.",
  },
  "ticket-check-fill": {
    reference:
      "Filled variant of our own `ticket-check`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "ticket"],
    description:
      "Filled: ticket with a check in the secondary tone in place of the tear line. Built on `ticket-01`.",
  },
  "ticket-minus-fill": {
    reference:
      "Filled variant of our own `ticket-minus`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "ticket"],
    description:
      "Filled: ticket with a minus in the secondary tone in place of the tear line. Built on `ticket-01`.",
  },
  "ticket-plus-fill": {
    reference: "Filled variant of our own `ticket-plus`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "ticket"],
    description:
      "Filled: ticket with a plus in the secondary tone in place of the tear line. Built on `ticket-01`.",
  },
  "ticket-x-fill": {
    reference: "Filled variant of our own `ticket-x`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "ticket"],
    description:
      "Filled: ticket with a cross in the secondary tone in place of the tear line. Built on `ticket-01`.",
  },
  "usb-memory-01-fill": {
    reference:
      "Filled variant of our own `usb-memory-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "usb"],
    description: "Filled: uSB memory stick standing up, its light in the secondary tone.",
  },
  "zoom-circle-fill": {
    reference: "Filled variant of our own `zoom-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "zoom"],
    description:
      "Filled: video camera in the secondary tone inside a circle: the Zoom app mark, drawn generically.",
  },
  "zoom-square-fill": {
    reference: "Filled variant of our own `zoom-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "zoom"],
    description:
      "Filled: video camera in the secondary tone inside a rounded square: the Zoom app mark, drawn generically.",
  },
  belt: {
    labels: ["belt"],
    description: "Belt: a strap through a square buckle, the prong in the secondary tone.",
  },
  beta: {
    labels: ["beta"],
    description: "The Greek letter beta: a tall stem with two bowls on its right.",
  },
  birdhouse: {
    labels: ["birdhouse"],
    description:
      "Birdhouse: a pitched roof over a box with a round entrance hole in the secondary tone, on a post.",
  },
  biscuit: {
    labels: ["biscuit"],
    description:
      "Biscuit: a square cracker with rounded corners and four docking holes in the secondary tone.",
  },
  "blood-bag": {
    labels: ["blood", "bag"],
    description: "Blood bag: a hanging pouch with a drop in the secondary tone and a tube below.",
  },
  "blood-bottle": {
    labels: ["blood", "bottle"],
    description: "Blood sample: a test tube with a rim, filled halfway in the secondary tone.",
  },
  "board-math": {
    labels: ["board", "math"],
    description:
      "Maths board: a board on two legs with a plus and an equals sign in the secondary tone.",
  },
  "body-armor": {
    labels: ["body", "armor"],
    description:
      "Body armour: a sleeveless vest with straps and a V neck, two plates in the secondary tone.",
  },
  "book-user": {
    labels: ["book", "user"],
    description: "Book with a person badge in the lower-right corner.",
  },
  "book-x": {
    labels: ["book", "x"],
    description: "Book with a cross badge in the lower-right corner.",
  },
  "bookmark-x": {
    labels: ["bookmark", "x"],
    description: "Bookmark ribbon with a cross in the secondary tone.",
  },
  "boom-box": {
    labels: ["boom", "box"],
    description:
      "Boom box: a carrying handle over a wide case with two speakers in the secondary tone.",
  },
  "bottle-wine": {
    labels: ["bottle", "wine"],
    description: "Wine bottle: a long neck, rounded shoulders and a label in the secondary tone.",
  },
  "bounding-box": {
    labels: ["bounding", "box"],
    description: "Bounding box: a square frame with a handle in the secondary tone at each corner.",
  },
  "bow-arrow": {
    labels: ["bow", "arrow"],
    description: "Bow and arrow: a curved bow with its string, the arrow in the secondary tone.",
  },
  bowling: {
    labels: ["bowling"],
    description: "Bowling: a pin with a stripe in the secondary tone beside a ball.",
  },
  "bowling-ball": {
    labels: ["bowling", "ball"],
    description: "Bowling ball: a full circle with three finger holes in the secondary tone.",
  },
  "brick-wall": {
    labels: ["brick", "wall"],
    description: "Brick wall: three courses of bricks with staggered joints.",
  },
  "broken-bone": {
    labels: ["broken", "bone"],
    description:
      "Broken bone: a bone with a jagged crack through its middle in the secondary tone.",
  },
  "cable-car": {
    labels: ["cable", "car"],
    description: "Cable car: a cabin hanging from a cable, its windows in the secondary tone.",
  },
  "cake-slice": {
    labels: ["cake", "slice"],
    description:
      "Cake slice: a wedge seen from above and the side, a filling layer in the secondary tone.",
  },
  candy: {
    labels: ["candy"],
    description: "Wrapped candy: a round sweet with a twisted wrapper end on each side.",
  },
  "candy-cane": {
    labels: ["candy", "cane"],
    description: "Candy cane: a hooked stick with diagonal stripes in the secondary tone.",
  },
  "candy-off": {
    labels: ["candy", "off"],
    description: "Wrapped candy crossed by a diagonal slash in the secondary tone.",
  },
  "cap-round": {
    labels: ["cap", "round"],
    description:
      "Round line cap: the end of a thick stroke rounded off, its centre line in the secondary tone.",
  },
  "cap-straight": {
    labels: ["cap", "straight"],
    description:
      "Square line cap: the end of a thick stroke cut square, its centre line in the secondary tone.",
  },
  "captions-off": {
    labels: ["captions", "off"],
    description: "Captions crossed by a diagonal slash in the secondary tone.",
  },
  cardigan: {
    labels: ["cardigan"],
    description: "Cardigan: a long-sleeved knit with a V neck and buttons in the secondary tone.",
  },
  "cargo-ship": {
    labels: ["cargo", "ship"],
    description:
      "Cargo ship: a hull with a bridge tower and two stacks of containers in the secondary tone.",
  },
  "case-lower": {
    labels: ["case", "lower"],
    description: "Lower case: the letters a and b in small letters.",
  },
  "case-upper": {
    labels: ["case", "upper"],
    description: "Upper case: the letters A and B in capitals.",
  },
  cat: {
    labels: ["cat"],
    description:
      "Cat: a round head with two pointed ears, eyes in the secondary tone and a small nose.",
  },
  "cctv-camera": {
    labels: ["cctv", "camera"],
    description:
      "Security camera: a box camera with its lens in the secondary tone, on an arm fixed to a wall.",
  },
  "cctv-off": {
    labels: ["cctv", "off"],
    description: "Security camera crossed by a diagonal slash in the secondary tone.",
  },
  centralized: {
    labels: ["centralized"],
    description: "Centralised: four corner nodes linked to one central node in the secondary tone.",
  },
  "chat-unlock": {
    labels: ["chat", "unlock"],
    description: "Speech bubble with an open padlock badge in the lower-right corner.",
  },
  "chat-user": {
    labels: ["chat", "user"],
    description: "Speech bubble with a person badge in the lower-right corner.",
  },
  "chess-bishop": {
    labels: ["chess", "bishop"],
    description: "Chess bishop: a mitre with a diagonal slit, a collar and a flared base.",
  },
  "chess-king": {
    labels: ["chess", "king"],
    description: "Chess king: a cross on top of a tall body with a flared base.",
  },
  "chess-knight": {
    labels: ["chess", "knight"],
    description: "Chess knight: a horse head in profile over a base.",
  },
  "chess-pawn": {
    labels: ["chess", "pawn"],
    description: "Chess pawn: a round head over a collar and a flared base.",
  },
  chimney: {
    labels: ["chimney"],
    description: "Chimney: a stack on a pitched roof with smoke rising in the secondary tone.",
  },
  "birdhouse-fill": {
    reference: "Filled variant of our own `birdhouse`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "birdhouse"],
    description:
      "Filled: birdhouse: a pitched roof over a box with a round entrance hole in the secondary tone, on a post.",
  },
  "bookmark-x-fill": {
    reference: "Filled variant of our own `bookmark-x`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bookmark"],
    description: "Filled: bookmark ribbon with a cross in the secondary tone.",
  },
  "bottle-wine-fill": {
    reference: "Filled variant of our own `bottle-wine`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bottle"],
    description:
      "Filled: wine bottle: a long neck, rounded shoulders and a label in the secondary tone.",
  },
  "bowling-ball-fill": {
    reference:
      "Filled variant of our own `bowling-ball`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bowling"],
    description:
      "Filled: bowling ball: a full circle with three finger holes in the secondary tone.",
  },
  "chess-pawn-fill": {
    reference: "Filled variant of our own `chess-pawn`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "chess"],
    description: "Filled: chess pawn: a round head over a collar and a flared base.",
  },
  "chess-king-fill": {
    reference: "Filled variant of our own `chess-king`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "chess"],
    description: "Filled: chess king: a cross on top of a tall body with a flared base.",
  },
  "chess-knight-fill": {
    reference:
      "Filled variant of our own `chess-knight`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "chess"],
    description: "Filled: chess knight: a horse head in profile over a base.",
  },
  "3d-printer": {
    labels: ["3d", "printer"],
    description:
      "3D printer: a frame, the nozzle hanging from the gantry, the printed part in the secondary tone on the bed.",
  },
  "3d-scale": {
    labels: ["3d", "scale"],
    description:
      "3D scale: a cube in oblique view and an arrow out of its top corner in the secondary tone.",
  },
  "4k": {
    labels: ["4k"],
    description: "4K: the digit 4 and the letter K, like `hd`.",
  },
  absolute: {
    labels: ["absolute"],
    description: "Absolute value: two vertical bars around an x in the secondary tone.",
  },
  acceleration: {
    labels: ["acceleration"],
    description:
      "Acceleration: an arrow to the right with speed lines behind it in the secondary tone.",
  },
  acute: {
    labels: ["acute"],
    description: "Acute angle: a base line and a steep 2:1 side, the arc in the secondary tone.",
  },
  advertisiment: {
    labels: ["advertisiment"],
    description: "Advertisement: the letters A and D in a rounded frame.",
  },
  "ai-art": {
    labels: ["ai", "art"],
    description:
      "AI art: a picture with a sun and a peak, the AI sparkle badge in the secondary tone.",
  },
  "ai-audio": {
    labels: ["ai", "audio"],
    description:
      "AI audio: a sound wave of vertical bars, the AI sparkle badge in the secondary tone.",
  },
  "air-vent": {
    labels: ["air", "vent"],
    description:
      "Air conditioner: a wall unit with a vent slot, the airflow in the secondary tone.",
  },
  "alarm-smoke": {
    labels: ["alarm", "smoke"],
    description:
      "Smoke alarm: a dome on the ceiling, the smoke rising into it in the secondary tone.",
  },
  "all-bookmark": {
    labels: ["all", "bookmark"],
    description: "All bookmarks: a bookmark in front of a second one.",
  },
  alpha: {
    labels: ["alpha"],
    description: "Alpha: the Greek letter \u03b1.",
  },
  ammo: {
    labels: ["ammo"],
    description: "Ammunition: two cartridges standing side by side.",
  },
  ampersand: {
    labels: ["ampersand"],
    description: "Ampersand: the & sign.",
  },
  ampersands: {
    labels: ["ampersands"],
    description: "Double ampersand: two & signs side by side, logical and.",
  },
  ampoule: {
    labels: ["ampoule"],
    description:
      "Ampoule: a sealed tip, a narrow waist, a body holding liquid in the secondary tone.",
  },
  "anchor-point": {
    labels: ["anchor", "point"],
    description: "Anchor point: a square node on a tangent, its two handles at the ends.",
  },
  angle: {
    labels: ["angle"],
    description:
      "Angle: a base line and a 45\u00b0 side meeting in a corner, the arc in the secondary tone.",
  },
  annoyed: {
    labels: ["annoyed"],
    description:
      "Annoyed face: the ring of `smile`, half-closed eyes and a flat mouth in the secondary tone.",
  },
  "api-gateway": {
    labels: ["api", "gateway"],
    description:
      "API gateway: a gate of two pillars under a beam, angle brackets in the secondary tone between them.",
  },
  "app-window": {
    labels: ["app", "window"],
    description: "App window: a frame with a title bar and two dots.",
  },
  apron: {
    labels: ["apron"],
    description: "Apron: a neck loop, a bib, two waist ties and a pocket in the secondary tone.",
  },
  archer: {
    labels: ["archer"],
    description:
      "Archer's bow: a curved bow and its string, an arrow drawn across it in the secondary tone.",
  },
  "armored-boot": {
    labels: ["armored", "boot"],
    description: "Armoured boot: a tall shaft and a foot, the plates marked by lines.",
  },
  "aspect-ratio": {
    labels: ["aspect", "ratio"],
    description: "Aspect ratio: a frame with two corner marks in the secondary tone.",
  },
  avocado: {
    labels: ["avocado"],
    description: "Avocado: a pear-shaped half with its round stone in the secondary tone.",
  },
  axe: {
    labels: ["axe"],
    description: "Axe: a broad solid head on a handle in the secondary tone.",
  },
  "baby-bottle": {
    labels: ["baby", "bottle"],
    description: "Baby bottle: a teat, a collar, a body with milk in the secondary tone.",
  },
  background: {
    labels: ["background"],
    description:
      "Background: a rounded square filled with diagonal hatching in the secondary tone.",
  },
  banana: {
    labels: ["banana"],
    description: "Banana: a curved fruit with a stem at the top.",
  },
  "banknote-x": {
    labels: ["banknote", "x"],
    description: "A cross in the secondary tone above a banknote, like `money-remove-01`.",
  },
  barrel: {
    labels: ["barrel"],
    description: "Barrel: a bulging body between two hoops.",
  },
  baseball: {
    labels: ["baseball"],
    description: "Baseball: the ring of `circle` with two curved seams in the secondary tone.",
  },
  "baseball-bat": {
    labels: ["baseball", "bat"],
    description: "Baseball bat: a bat at 45\u00b0 with a ball beside it in the secondary tone.",
  },
  beach: {
    labels: ["beach"],
    description: "Beach: a parasol planted on a wavy shore in the secondary tone.",
  },
  beaker: {
    labels: ["beaker"],
    description: "Beaker: a lip, straight walls, the liquid in the secondary tone.",
  },
  "bed-bunk": {
    labels: ["bed", "bunk"],
    description:
      "Bunk bed seen from the side: two posts, two bunks, a pillow on each in the secondary tone.",
  },
  "bed-double": {
    labels: ["bed", "double"],
    description:
      "Double bed seen from the front: a headboard, two pillows in the secondary tone, a mattress and legs.",
  },
  "beer-off": {
    labels: ["beer", "off"],
    description: "Beer crossed out: the mug of `beer` and a diagonal in the secondary tone.",
  },
  "advertisiment-fill": {
    reference:
      "Filled variant of our own `advertisiment`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "advertisiment"],
    description: "Filled: advertisement: the letters A and D in a rounded frame.",
  },
  "ammo-fill": {
    reference: "Filled variant of our own `ammo`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "ammo"],
    description: "Filled: ammunition: two cartridges standing side by side.",
  },
  "baseball-fill": {
    reference: "Filled variant of our own `baseball`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "baseball"],
    description:
      "Filled: baseball: the ring of `circle` with two curved seams in the secondary tone.",
  },
  chocolate: {
    labels: ["chocolate"],
    description: "Chocolate bar: a grid of six squares, its wrapper in the secondary tone.",
  },
  chopsticks: {
    labels: ["chopsticks"],
    description: "Chopsticks: two parallel sticks resting in a bowl.",
  },
  citrus: {
    labels: ["citrus"],
    description: "Citrus fruit: a round orange with a leaf in the secondary tone.",
  },
  "code-circle": {
    labels: ["code", "circle"],
    description: "Code in a circle: two angle brackets in the secondary tone inside a ring.",
  },
  "code-simple": {
    labels: ["code", "simple"],
    description: "Code: a pair of angle brackets.",
  },
  complaint: {
    labels: ["complaint"],
    description: "Complaint: a speech bubble with an exclamation mark in the secondary tone.",
  },
  confused: {
    labels: ["confused"],
    description: "Confused face: two eyes and a wavy mouth in the secondary tone.",
  },
  constellation: {
    labels: ["constellation"],
    description: "Constellation: four stars in the secondary tone joined by lines.",
  },
  "cook-book": {
    labels: ["cook", "book"],
    description: "Cook book: a bound book with a fork on its cover in the secondary tone.",
  },
  "cooking-pot": {
    labels: ["cooking", "pot"],
    description: "Cooking pot: a lid with its knob over a pot with two handles.",
  },
  "copy-slash": {
    labels: ["copy", "slash"],
    description:
      "Copy with a slash: the copy drawing, a diagonal through the front sheet in the secondary tone.",
  },
  "copy-x": {
    labels: ["copy", "x"],
    description:
      "Copy with a cross: the copy drawing, an x on the front sheet in the secondary tone.",
  },
  copyleft: {
    labels: ["copyleft"],
    description: "Copyleft: the copyright ring with its C mirrored.",
  },
  corn: {
    labels: ["corn"],
    description: "Corn: a cob with kernel rows between two husks in the secondary tone.",
  },
  cottage: {
    labels: ["cottage"],
    description: "Cottage: a house with a pitched roof, a chimney and a door.",
  },
  "court-house": {
    labels: ["court", "house"],
    description: "Court house: a pediment on four columns over a stepped base.",
  },
  cpp: {
    labels: ["cpp"],
    description: "C++: a letter C followed by two plus signs in the secondary tone.",
  },
  "cpu-charge": {
    labels: ["cpu", "charge"],
    description:
      "Processor charging: the cpu drawing with a lightning badge in the secondary tone.",
  },
  "cpu-settings": {
    labels: ["cpu", "settings"],
    description: "Processor settings: the cpu drawing with a cog badge in the secondary tone.",
  },
  "crane-tower": {
    labels: ["crane", "tower"],
    description:
      "Tower crane: a mast, a long jib with its counterweight and a hanging load in the secondary tone.",
  },
  "crown-minus": {
    labels: ["crown", "minus"],
    description: "Crown with a minus: the crown drawing with a minus badge in the secondary tone.",
  },
  "crown-plus": {
    labels: ["crown", "plus"],
    description: "Crown with a plus: the crown drawing with a plus badge in the secondary tone.",
  },
  crying: {
    labels: ["crying"],
    description: "Crying face: two eyes, a tear in the secondary tone and a frown.",
  },
  cuboid: {
    labels: ["cuboid"],
    description: "Cuboid: a rectangular box drawn in oblique projection.",
  },
  "cup-soda": {
    labels: ["cup", "soda"],
    description: "Soda cup: a tapered cup with a lid and a straw in the secondary tone.",
  },
  "dark-mode": {
    labels: ["dark", "mode"],
    description: "Dark mode: a circle with its left half filled.",
  },
  "dental-care": {
    labels: ["dental", "care"],
    description: "Dental care: the tooth drawing with a plus in the secondary tone.",
  },
  "dental-tooth": {
    labels: ["dental", "tooth"],
    description: "Tooth: a molar with two bumps on top and two roots.",
  },
  diameter: {
    labels: ["diameter"],
    description: "Diameter: a circle crossed by a diagonal in the secondary tone.",
  },
  dirham: {
    labels: ["dirham"],
    description: "Dirham: a letter D with two bars across it.",
  },
  displeased: {
    labels: ["displeased"],
    description: "Displeased face: half-closed eyes and a flat mouth in the secondary tone.",
  },
  dome: {
    labels: ["dome"],
    description: "Domed building: a dome over a row of columns on a base.",
  },
  domino: {
    labels: ["domino"],
    description:
      "Domino: an upright tile split in two, one pip in each half in the secondary tone.",
  },
  "code-circle-fill": {
    reference: "Filled variant of our own `code-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "code"],
    description:
      "Filled: code in a circle: two angle brackets in the secondary tone inside a ring.",
  },
  "cooking-pot-fill": {
    reference: "Filled variant of our own `cooking-pot`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cooking"],
    description: "Filled: cooking pot: a lid with its knob over a pot with two handles.",
  },
  "cottage-fill": {
    reference: "Filled variant of our own `cottage`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cottage"],
    description: "Filled: cottage: a house with a pitched roof, a chimney and a door.",
  },
  "dental-tooth-fill": {
    reference:
      "Filled variant of our own `dental-tooth`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "dental"],
    description: "Filled: tooth: a molar with two bumps on top and two roots.",
  },
  "domino-fill": {
    reference: "Filled variant of our own `domino`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "domino"],
    description:
      "Filled: domino: an upright tile split in two, one pip in each half in the secondary tone.",
  },
  "funnel-x": {
    labels: ["funnel", "x"],
    description: "Funnel with a cross: `filter` with a small cross in the secondary tone.",
  },
  "give-blood": {
    labels: ["give", "blood"],
    description: "The offering hand of the set under a blood drop in the secondary tone.",
  },
  "glass-water": {
    labels: ["glass", "water"],
    description: "Glass of water: a straight tumbler, the water line in the secondary tone.",
  },
  "globe-lock": {
    labels: ["globe", "lock"],
    description:
      "Globe with a padlock: `globe` in the primary tone, a padlock in the lower-right corner.",
  },
  "globe-off": {
    labels: ["globe", "off"],
    description:
      "Globe off: `globe` in the primary tone, struck by a 45\u00b0 slash in the secondary tone.",
  },
  "globe-x": {
    labels: ["globe", "x"],
    description:
      "Globe with a cross: `globe` in the primary tone, a cross in the lower-right corner.",
  },
  "golf-hole": {
    labels: ["golf", "hole"],
    description: "Golf hole: a pin with a pennant in the secondary tone, standing in the hole.",
  },
  "green-house": {
    labels: ["green", "house"],
    description:
      "Greenhouse: the outline of `home-01` without its door, a sprout in the secondary tone.",
  },
  "grid-off": {
    labels: ["grid", "off"],
    description: "Grid off: `grid`, struck by a 45\u00b0 slash in the secondary tone.",
  },
  "grid2x2-x": {
    labels: ["grid2x2", "x"],
    description:
      "Two-by-two grid with a cross: `grid-view` with the lower-right square replaced by a cross.",
  },
  grimacing: {
    labels: ["grimacing"],
    description:
      "Grimacing face: the ring of `smile`, two eyes, clenched teeth in the secondary tone.",
  },
  grinning: {
    labels: ["grinning"],
    description:
      "Grinning face: the ring of `smile`, open eyes and a wide open mouth in the secondary tone.",
  },
  "group-items": {
    labels: ["group", "items"],
    description: "Group items: four small squares inside selection corners in the secondary tone.",
  },
  "guest-house": {
    labels: ["guest", "house"],
    description:
      "Guest house: the outline of `home-01` without its door, a guest in the secondary tone.",
  },
  gymnastic: {
    labels: ["gymnastic"],
    description: "Gymnast in a star jump: arms and legs spread at 45\u00b0.",
  },
  "hair-dryer": {
    labels: ["hair", "dryer"],
    description:
      "Hair dryer: a round back with its vent in the secondary tone, a barrel and a handle.",
  },
  handcuffs: {
    labels: ["handcuffs"],
    description: "Handcuffs: two rings joined by a short chain in the secondary tone.",
  },
  "hard-hat": {
    labels: ["hard", "hat"],
    description: "Hard hat: a dome on a wide brim, the ridge in the secondary tone.",
  },
  "hdmi-port": {
    labels: ["hdmi", "port"],
    description: "HDMI port: the trapezoid socket, the pin strip in the secondary tone.",
  },
  "headset-off": {
    labels: ["headset", "off"],
    description:
      "Headset off: `headset` in the primary tone, struck by a 45\u00b0 slash in the secondary tone.",
  },
  "heart-off": {
    labels: ["heart", "off"],
    description: "Heart off: `heart`, struck by a 45\u00b0 slash in the secondary tone.",
  },
  hoodie: {
    labels: ["hoodie"],
    description:
      "Hoodie: the body of `shirt-01` under a hood, the front pocket in the secondary tone.",
  },
  "hot-price": {
    labels: ["hot", "price"],
    description: "Hot price: the tag of `tag-01` with a flame in the secondary tone.",
  },
  "hotel-bell": {
    labels: ["hotel", "bell"],
    description: "Hotel bell: a dome on a base, the push button in the secondary tone.",
  },
  hut: {
    labels: ["hut"],
    description: "Hut: a steep roof with a wide eave over low walls and a door.",
  },
  "hydro-power": {
    labels: ["hydro", "power"],
    description:
      "Hydro power: the drop of `rain-drop` with a lightning bolt in the secondary tone.",
  },
  "ice-cubes": {
    labels: ["ice", "cubes"],
    description:
      "Ice cubes: two overlapping cubes, a glint in the secondary tone on the front one.",
  },
  "hard-hat-fill": {
    reference: "Filled variant of our own `hard-hat`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "hard"],
    description: "Filled: hard hat: a dome on a wide brim, the ridge in the secondary tone.",
  },
  "hotel-bell-fill": {
    reference: "Filled variant of our own `hotel-bell`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "hotel"],
    description: "Filled: hotel bell: a dome on a base, the push button in the secondary tone.",
  },
  donut: {
    labels: ["donut"],
    description:
      "Doughnut seen from above: the ring of `circle`, a round hole, two sprinkles in the secondary tone.",
  },
  "drawing-mode": {
    labels: ["drawing", "mode"],
    description: "Drawing: a pencil at 45\u00b0 and the wavy line it draws, in the secondary tone.",
  },
  "droplet-off": {
    labels: ["droplet", "off"],
    description:
      "Water drop struck through: `rain-drop` with a 45\u00b0 slash in the secondary tone.",
  },
  droplets: {
    labels: ["droplets"],
    description: "Two water drops: a large one and a small one above it to the right.",
  },
  "earth-lock": {
    labels: ["earth", "lock"],
    description:
      "Locked globe: `globe` cut at the lower right for a lock badge in the secondary tone.",
  },
  "ease-in": {
    labels: ["ease", "in"],
    description:
      "Ease-in curve: flat at the start, steepening to the end, with a handle dot at each end in the secondary tone.",
  },
  "eco-lab": {
    labels: ["eco", "lab"],
    description: "Green lab: the flask of `flask-conical`, a sprout in the secondary tone inside.",
  },
  "edge-style": {
    labels: ["edge", "style"],
    description:
      "Corner style: a rounded corner, the square corner it replaces marked in the secondary tone.",
  },
  "egg-fried": {
    labels: ["egg", "fried"],
    description: "Fried egg: an irregular white with a round yolk in the secondary tone.",
  },
  "egg-off": {
    labels: ["egg", "off"],
    description: "Egg struck through: `egg` outline with a 45\u00b0 slash in the secondary tone.",
  },
  "eight-circle": {
    labels: ["eight", "circle"],
    description: "The digit 8 in a ring: the ring of `circle`, the digit in the secondary tone.",
  },
  "eight-square": {
    labels: ["eight", "square"],
    description: "The digit 8 in a box: the box of `square`, the digit in the secondary tone.",
  },
  ellipse: {
    labels: ["ellipse"],
    description: "Ellipse: a wide oval outline that uses the full width of the grid.",
  },
  "equal-not": {
    labels: ["equal", "not"],
    description:
      "Not equal: the bars of `equal-sign` crossed by a steep slash in the secondary tone.",
  },
  "file-corrupt": {
    labels: ["file", "corrupt"],
    description:
      "Corrupted file: the sheet of `file-01` with a jagged crack in the secondary tone.",
  },
  "file-digit": {
    labels: ["file", "digit"],
    description:
      "File with a digit: the sheet of `file-x`, a numeral 1 in the secondary tone at the lower right.",
  },
  "fish-off": {
    labels: ["fish", "off"],
    description: "Fish struck through: `fish` with a 45\u00b0 slash in the secondary tone.",
  },
  "fishing-hook": {
    labels: ["fishing", "hook"],
    description: "Fishing hook: an eye, a shank and a barbed bend.",
  },
  "five-circle": {
    labels: ["five", "circle"],
    description: "The digit 5 in a ring: the ring of `circle`, the digit in the secondary tone.",
  },
  "five-square": {
    labels: ["five", "square"],
    description: "The digit 5 in a box: the box of `square`, the digit in the secondary tone.",
  },
  "flask-round": {
    labels: ["flask", "round"],
    description: "Round-bottom flask: a neck over a round bulb, the liquid in the secondary tone.",
  },
  "floor-plan": {
    labels: ["floor", "plan"],
    description: "Floor plan: an outer wall with inner walls and two door gaps.",
  },
  "flow-circle": {
    labels: ["flow", "circle"],
    description:
      "Flow between circles: a node, a connector and a second node in the secondary tone.",
  },
  "folder-input": {
    labels: ["folder", "input"],
    description:
      "Folder input: `folder-01` with an arrow in the secondary tone entering through its left side.",
  },
  "four-circle": {
    labels: ["four", "circle"],
    description: "The digit 4 in a ring: the ring of `circle`, the digit in the secondary tone.",
  },
  "four-square": {
    labels: ["four", "square"],
    description: "The digit 4 in a box: the box of `square`, the digit in the secondary tone.",
  },
  fry: {
    labels: ["fry"],
    description: "Frying pan: a round pan with an egg yolk in the secondary tone and a handle.",
  },
  "droplets-fill": {
    reference: "Filled variant of our own `droplets`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "droplets"],
    description: "Filled: two water drops: a large one and a small one above it to the right.",
  },
  "ellipse-fill": {
    reference: "Filled variant of our own `ellipse`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "ellipse"],
    description: "Filled: ellipse: a wide oval outline that uses the full width of the grid.",
  },
  "five-circle-fill": {
    reference: "Filled variant of our own `five-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "five"],
    description:
      "Filled: the digit 5 in a ring: the ring of `circle`, the digit in the secondary tone.",
  },
  "five-square-fill": {
    reference: "Filled variant of our own `five-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "five"],
    description:
      "Filled: the digit 5 in a box: the box of `square`, the digit in the secondary tone.",
  },
  "four-circle-fill": {
    reference: "Filled variant of our own `four-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "four"],
    description:
      "Filled: the digit 4 in a ring: the ring of `circle`, the digit in the secondary tone.",
  },
  "four-square-fill": {
    reference: "Filled variant of our own `four-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "four"],
    description:
      "Filled: the digit 4 in a box: the box of `square`, the digit in the secondary tone.",
  },
  matches: {
    labels: ["matches"],
    description: "Two matchsticks standing side by side, their heads in the secondary tone.",
  },
  matrix: {
    labels: ["matrix"],
    description:
      "A matrix: square brackets around a two-by-two grid of entries in the secondary tone.",
  },
  mentoring: {
    labels: ["mentoring"],
    description: "Mentoring: a person beside a board, the board in the secondary tone.",
  },
  "menu-circle": {
    labels: ["menu", "circle"],
    description:
      "Three menu lines in a ring: the ring of `circle`, the lines in the secondary tone.",
  },
  "menu-square": {
    labels: ["menu", "square"],
    description:
      "Three menu lines in a square: the frame of `square`, the lines in the secondary tone.",
  },
  milk: {
    labels: ["milk"],
    description:
      "A glass of milk: the glass of `glass-water`, filled with milk in the secondary tone.",
  },
  "milk-bottle": {
    labels: ["milk", "bottle"],
    description: "A milk bottle with a wide neck, filled with milk in the secondary tone.",
  },
  "modern-tv": {
    labels: ["modern", "tv"],
    description: "A wide flat-screen television on a central stand.",
  },
  molecules: {
    labels: ["molecules"],
    description: "Molecules: three atoms joined by bonds.",
  },
  neutral: {
    labels: ["neutral"],
    description: "A neutral face: the face of `smile` with a straight mouth in the secondary tone.",
  },
  "nine-circle": {
    labels: ["nine", "circle"],
    description: "The digit 9 in a ring: the ring of `circle`, the digit in the secondary tone.",
  },
  "nine-square": {
    labels: ["nine", "square"],
    description: "The digit 9 in a square: the frame of `square`, the digit in the secondary tone.",
  },
  "note-done": {
    labels: ["note", "done"],
    description: "A done note: the note of `note-add` with a check badge in the secondary tone.",
  },
  "note-edit": {
    labels: ["note", "edit"],
    description:
      "A note being edited: the note of `note-add` with a pencil badge in the secondary tone.",
  },
  nut: {
    labels: ["nut"],
    description:
      "A hex nut: the hexagon of `hexagon-01` with the threaded hole in the secondary tone.",
  },
  obtuse: {
    labels: ["obtuse"],
    description:
      "Obtuse angle: a base line and a 2:1 side leaning back, the arc in the secondary tone.",
  },
  omega: {
    labels: ["omega"],
    description: "The Greek capital letter omega.",
  },
  "one-circle": {
    labels: ["one", "circle"],
    description: "The digit 1 in a ring: the ring of `circle`, the digit in the secondary tone.",
  },
  "one-square": {
    labels: ["one", "square"],
    description: "The digit 1 in a square: the frame of `square`, the digit in the secondary tone.",
  },
  orange: {
    labels: ["orange"],
    description: "An orange: a round fruit with a leaf in the secondary tone on its stem.",
  },
  oval: {
    labels: ["oval"],
    description: "An oval: a horizontal ellipse outline.",
  },
  parallelogram: {
    labels: ["parallelogram"],
    description: "A parallelogram: four sides leaning at a steady 1:2 slope.",
  },
  parentheses: {
    labels: ["parentheses"],
    description: "A pair of round parentheses.",
  },
  passport: {
    labels: ["passport"],
    description: "A passport: a booklet with a globe in the secondary tone and a line of text.",
  },
  "paw-print": {
    labels: ["paw", "print"],
    description: "A paw print: four toe pads over the main pad.",
  },
  "pc-case": {
    labels: ["pc", "case"],
    description: "A PC tower case with two drive bays and the power button in the secondary tone.",
  },
  pepper: {
    labels: ["pepper"],
    description: "A bell pepper with its stem in the secondary tone.",
  },
  pi: {
    labels: ["pi"],
    description: "The Greek letter pi.",
  },
  "menu-circle-fill": {
    reference: "Filled variant of our own `menu-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "menu"],
    description:
      "Filled: three menu lines in a ring: the ring of `circle`, the lines in the secondary tone.",
  },
  "menu-square-fill": {
    reference: "Filled variant of our own `menu-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "menu"],
    description:
      "Filled: three menu lines in a square: the frame of `square`, the lines in the secondary tone.",
  },
  "nine-circle-fill": {
    reference: "Filled variant of our own `nine-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "nine"],
    description:
      "Filled: the digit 9 in a ring: the ring of `circle`, the digit in the secondary tone.",
  },
  "nine-square-fill": {
    reference: "Filled variant of our own `nine-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "nine"],
    description:
      "Filled: the digit 9 in a square: the frame of `square`, the digit in the secondary tone.",
  },
  "one-circle-fill": {
    reference: "Filled variant of our own `one-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "one"],
    description:
      "Filled: the digit 1 in a ring: the ring of `circle`, the digit in the secondary tone.",
  },
  "one-square-fill": {
    reference: "Filled variant of our own `one-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "one"],
    description:
      "Filled: the digit 1 in a square: the frame of `square`, the digit in the secondary tone.",
  },
  "nut-fill": {
    reference: "Filled variant of our own `nut`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "nut"],
    description:
      "Filled: a hex nut: the hexagon of `hexagon-01` with the threaded hole in the secondary tone.",
  },
  "oval-fill": {
    reference: "Filled variant of our own `oval`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "oval"],
    description: "Filled: an oval: a horizontal ellipse outline.",
  },
  "parallelogram-fill": {
    reference:
      "Filled variant of our own `parallelogram`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "parallelogram"],
    description: "Filled: a parallelogram: four sides leaning at a steady 1:2 slope.",
  },
  "pi-circle": {
    labels: ["pi", "circle"],
    description: "The `dollar-circle` ring with a pi sign inside in the secondary tone.",
  },
  "pi-square": {
    labels: ["pi", "square"],
    description: "The `square` box with a pi sign inside in the secondary tone.",
  },
  "piggy-bank": {
    labels: ["piggy", "bank"],
    description:
      "Piggy bank seen from the side: ear, snout, tail and legs, a coin dropping into the slot in the secondary tone.",
  },
  "pill-off": {
    labels: ["pill", "off"],
    description: "Capsule in outline, crossed by a slash in the secondary tone.",
  },
  "plug-zap": {
    labels: ["plug", "zap"],
    description:
      "The `plug-01` plug, moved left, with a lightning bolt badge in the secondary tone.",
  },
  "pointer-off": {
    labels: ["pointer", "off"],
    description: "The `cursor-01` arrow crossed by a slash in the secondary tone.",
  },
  popsicle: {
    labels: ["popsicle"],
    description: "Ice lolly: a rounded bar on a stick in the secondary tone.",
  },
  "pound-send": {
    labels: ["pound", "send"],
    description:
      "The `pound` sign, moved left, with an arrow badge pointing right in the secondary tone.",
  },
  "power-off": {
    labels: ["power", "off"],
    description: "The `power-service` symbol crossed by a slash in the secondary tone.",
  },
  prison: {
    labels: ["prison"],
    description: "Prison bars: a top and bottom rail and four bars.",
  },
  "qq-plot": {
    labels: ["qq", "plot"],
    description:
      "Q-Q plot: two axes, the reference diagonal in the secondary tone and points beside it.",
  },
  "racing-flag": {
    labels: ["racing", "flag"],
    description: "The `flag-01` flag with a chequered field in the secondary tone.",
  },
  radical: {
    labels: ["radical"],
    description:
      "Radical sign: a short tick, a long stroke rising at 1:2 and the bar over the radicand.",
  },
  radius: {
    labels: ["radius"],
    description:
      "The `circle` ring with its centre and a radius to the edge in the secondary tone.",
  },
  "ram-memory": {
    labels: ["ram", "memory"],
    description: "Memory module: a board with two chips in the secondary tone and the key notch.",
  },
  "redo-dot": {
    labels: ["redo", "dot"],
    description: "The `redo-02` arrow raised a row, a dot under it in the secondary tone.",
  },
  "refresh-dot": {
    labels: ["refresh", "dot"],
    description: "The `refresh` arcs with a dot at the centre in the secondary tone.",
  },
  "repeat-off": {
    labels: ["repeat", "off"],
    description: "The `repeat` arrows crossed by a slash in the secondary tone.",
  },
  "reply-all": {
    labels: ["reply", "all"],
    description: "Reply arrow with a second head behind it in the secondary tone.",
  },
  "restore-bin": {
    labels: ["restore", "bin"],
    description: "The `delete-01` bin with an arrow rising out of it in the secondary tone.",
  },
  "right-angle": {
    labels: ["right", "angle"],
    description: "Right angle: two perpendicular lines and the square mark in the secondary tone.",
  },
  "rolling-pin": {
    labels: ["rolling", "pin"],
    description: "Rolling pin: a barrel with a handle at each end.",
  },
  "route-block": {
    labels: ["route", "block"],
    description: "The `route-01` path ending on a cross in the secondary tone.",
  },
  "route-off": {
    labels: ["route", "off"],
    description: "The `route-01` path crossed by a slash in the secondary tone.",
  },
  "rubber-duck": {
    labels: ["rubber", "duck"],
    description:
      "Rubber duck seen from the side: round head with an eye, beak in the secondary tone, body and tail.",
  },
  rupee: {
    labels: ["rupee"],
    description: "Indian rupee sign: two bars, the bowl and the leg.",
  },
  "pi-circle-fill": {
    reference: "Filled variant of our own `pi-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pi"],
    description: "Filled: the `dollar-circle` ring with a pi sign inside in the secondary tone.",
  },
  "pi-square-fill": {
    reference: "Filled variant of our own `pi-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pi"],
    description: "Filled: the `square` box with a pi sign inside in the secondary tone.",
  },
  "rubber-duck-fill": {
    reference: "Filled variant of our own `rubber-duck`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rubber"],
    description:
      "Filled: rubber duck seen from the side: round head with an eye, beak in the secondary tone, body and tail.",
  },
  "iris-scan": {
    labels: ["iris", "scan"],
    description:
      "Iris scan: the corner brackets of `face-id` around an eye, the iris in the secondary tone.",
  },
  "job-link": {
    labels: ["job", "link"],
    description:
      "Job link: the briefcase of `briefcase-01` with a chain-link badge in the secondary tone.",
  },
  "job-search": {
    labels: ["job", "search"],
    description:
      "Job search: the briefcase of `briefcase-01` with a magnifying glass badge in the secondary tone.",
  },
  "job-share": {
    labels: ["job", "share"],
    description:
      "Job share: the briefcase of `briefcase-01` with a 45\u00b0 outgoing arrow badge in the secondary tone.",
  },
  "join-bevel": {
    labels: ["join", "bevel"],
    description:
      "Bevel line join: the outline of a thick L whose outer corner is cut at 45\u00b0, the cut in the secondary tone.",
  },
  "join-round": {
    labels: ["join", "round"],
    description:
      "Round line join: the outline of a thick L whose outer corner is rounded, the curve in the secondary tone.",
  },
  latitude: {
    labels: ["latitude"],
    description: "Latitude: the ring of `globe` crossed by two parallels in the secondary tone.",
  },
  "layers-logo": {
    labels: ["layers", "logo"],
    description:
      "Stacked squares: three square outlines offset on the diagonal, the front one whole.",
  },
  "less-than": {
    labels: ["less", "than"],
    description: "Less-than sign: two 2:1 strokes meeting at a point on the left.",
  },
  "library-big": {
    labels: ["library", "big"],
    description:
      "Library: three books standing side by side, of different heights, each with a band on its spine.",
  },
  ligature: {
    labels: ["ligature"],
    description: "Ligature: the letters f and i joined, the shared hook in the secondary tone.",
  },
  limitation: {
    labels: ["limitation"],
    description:
      "Limit: a gauge open at the bottom, its needle in the secondary tone near the top of the scale.",
  },
  "line-style": {
    labels: ["line", "style"],
    description: "Line style: a short-dashed, a long-dashed and a solid line.",
  },
  "link-circle": {
    labels: ["link", "circle"],
    description:
      "External link in a circle: the ring of `smile` open at its upper right, a 45\u00b0 arrow leaving it in the secondary tone.",
  },
  "locate-off": {
    labels: ["locate", "off"],
    description: "Locate off: `crosshair` struck by a 45\u00b0 slash in the secondary tone.",
  },
  lollipop: {
    labels: ["lollipop"],
    description: "Lollipop: a round candy with a swirl in the secondary tone on a 45\u00b0 stick.",
  },
  longitude: {
    labels: ["longitude"],
    description: "Longitude: the ring of `globe` with its meridian in the secondary tone.",
  },
  "magic-book": {
    labels: ["magic", "book"],
    description:
      "Magic book: the book of `book-plus` with a four-point sparkle badge in the secondary tone.",
  },
  mails: {
    labels: ["mails"],
    description: "Mails: an envelope in front of another, the one behind in the secondary tone.",
  },
  "map-plus": {
    labels: ["map", "plus"],
    description:
      "Add map: the folded map of `maps-location-01` with a plus badge in the secondary tone.",
  },
  "maps-search": {
    labels: ["maps", "search"],
    description:
      "Map search: the folded map of `maps-location-01` with a magnifying glass badge in the secondary tone.",
  },
  "mars-stroke": {
    labels: ["mars", "stroke"],
    description:
      "Mars stroke: the male symbol of `male-02` with a stroke across its arrow in the secondary tone.",
  },
  "join-round-fill": {
    reference: "Filled variant of our own `join-round`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "join"],
    description:
      "Filled: round line join: the outline of a thick L whose outer corner is rounded, the curve in the secondary tone.",
  },
  "join-bevel-fill": {
    reference: "Filled variant of our own `join-bevel`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "join"],
    description:
      "Filled: bevel line join: the outline of a thick L whose outer corner is cut at 45\u00b0, the cut in the secondary tone.",
  },
  scaling: {
    labels: ["scaling"],
    description:
      "Scaling: a small square in the corner of a large one, an arrow growing it to the far corner.",
  },
  scheme: {
    labels: ["scheme"],
    description: "Scheme: four boxes linked by lines, the node in focus in the secondary tone.",
  },
  section: {
    labels: ["section"],
    description: "Section sign: \u00a7.",
  },
  segment: {
    labels: ["segment"],
    description: "Segment: a straight line between two end points.",
  },
  shampoo: {
    labels: ["shampoo"],
    description: "Shampoo: a pump bottle with a label.",
  },
  "shower-head": {
    labels: ["shower", "head"],
    description: "Shower head: a pipe and a head, water falling in the secondary tone.",
  },
  "shrink-dot": {
    labels: ["shrink", "dot"],
    description: "Shrink: four arrows pointing in to a centre point.",
  },
  sigma: {
    labels: ["sigma"],
    description: "Sigma: the summation sign \u03a3.",
  },
  sin: {
    labels: ["sin"],
    description: "Sine: one period of a sine wave.",
  },
  "six-circle": {
    labels: ["six", "circle"],
    description: "The digit 6 in a circle.",
  },
  "six-square": {
    labels: ["six", "square"],
    description: "The digit 6 in a square.",
  },
  skew: {
    labels: ["skew"],
    description: "Skew: a rectangle slanted into a parallelogram.",
  },
  "slow-winds": {
    labels: ["slow", "winds"],
    description: "Slow wind: three gentle wavy lines.",
  },
  "sms-code": {
    labels: ["sms", "code"],
    description: "SMS code: a phone with a message bubble of dots as a badge.",
  },
  sneaker: {
    labels: ["sneaker"],
    description: "Sneaker: a low shoe seen from the side, the sole in the secondary tone.",
  },
  spade: {
    labels: ["spade"],
    description: "Spade: the card suit, a pointed leaf on a stem.",
  },
  "spell-check": {
    labels: ["spell", "check"],
    description: "Spell check: the letter A with a check mark.",
  },
  spirals: {
    labels: ["spirals"],
    description: "Spiral: a line coiling in to the centre.",
  },
  spline: {
    labels: ["spline"],
    description: "Spline: a curve between two end points.",
  },
  "spray-can": {
    labels: ["spray", "can"],
    description: "Spray can: a nozzle on a can, spray in the secondary tone.",
  },
  "six-circle-fill": {
    reference: "Filled variant of our own `six-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "six"],
    description: "Filled: the digit 6 in a circle.",
  },
  "six-square-fill": {
    reference: "Filled variant of our own `six-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "six"],
    description: "Filled: the digit 6 in a square.",
  },
  "skew-fill": {
    reference: "Filled variant of our own `skew`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "skew"],
    description: "Filled: skew: a rectangle slanted into a parallelogram.",
  },
  "spade-fill": {
    reference: "Filled variant of our own `spade`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "spade"],
    description: "Filled: spade: the card suit, a pointed leaf on a stem.",
  },
  "undo-dot": {
    labels: ["undo", "dot"],
    description:
      "Undo with a dot: the arrow of `undo-02`, its line ending short of a dot in the secondary tone.",
  },
  "user-status": {
    labels: ["user", "status"],
    description:
      "Person with a status dot: the person of `user-warning-01`, a round dot badge in the secondary tone.",
  },
  vegan: {
    labels: ["vegan"],
    description: "Vegan: a V whose right arm grows a leaf, the leaf in the secondary tone.",
  },
  versus: {
    labels: ["versus"],
    description: "Versus: the letters V and S side by side.",
  },
  "vibrate-off": {
    labels: ["vibrate", "off"],
    description:
      "Vibrate off: the phone and strokes of `vibrate` in one tone, struck by a 45\u00b0 slash in the secondary tone.",
  },
  "video-ai": {
    labels: ["video", "ai"],
    description:
      "AI video: the camera of `video-01`, a sparkle in the secondary tone inside the body.",
  },
  videotape: {
    labels: ["videotape"],
    description: "Videotape: a cassette with two reels joined by the tape, in the secondary tone.",
  },
  "view-agenda": {
    labels: ["view", "agenda"],
    description: "Agenda view: two wide rounded panels stacked one above the other.",
  },
  "voice-id": {
    labels: ["voice", "id"],
    description:
      "Voice ID: the corner brackets of `face-id` around three sound bars in the secondary tone.",
  },
  wallpaper: {
    labels: ["wallpaper"],
    description:
      "Wallpaper: the monitor of `computer` showing a picture with a sun in the secondary tone and two peaks.",
  },
  "wave-square": {
    labels: ["wave", "square"],
    description: "Square wave: a signal stepping between two levels.",
  },
  wheat: {
    labels: ["wheat"],
    description: "Wheat: an ear of three pairs of grains on a stalk.",
  },
  "wheat-off": {
    labels: ["wheat", "off"],
    description: "Wheat off: the ear of `wheat` struck by a 45\u00b0 slash in the secondary tone.",
  },
  "whole-word": {
    labels: ["whole", "word"],
    description: "Match whole word: the letters a and b over a bracket in the secondary tone.",
  },
  "wifi-square": {
    labels: ["wifi", "square"],
    description:
      "Wi-Fi in a square: the frame of `square`, a small Wi-Fi in the secondary tone, as in `wifi-circle`.",
  },
  "wifi-unlock": {
    labels: ["wifi", "unlock"],
    description:
      "Wi-Fi unlocked: `wifi-01` with an open padlock badge in the secondary tone, lower right.",
  },
  "wind-surf": {
    labels: ["wind", "surf"],
    description: "Windsurf: a triangular sail on its mast over a board.",
  },
  "work-alert": {
    labels: ["work", "alert"],
    description:
      "Work alert: the briefcase of `work-history` with an exclamation badge in the secondary tone.",
  },
  "work-update": {
    labels: ["work", "update"],
    description:
      "Work update: the briefcase of `work-history` with the sync badge of `folder-sync`.",
  },
  "workout-run": {
    labels: ["workout", "run"],
    description:
      "Running person: a head in the secondary tone, the body leaning forward, legs in a long stride.",
  },
  "x-ray": {
    labels: ["x", "ray"],
    description: "X-ray: a frame with a bone in the secondary tone.",
  },
  yen: {
    labels: ["yen"],
    description: "The yen sign: a V on a two-pixel stem crossed by two bars.",
  },
  "yen-circle": {
    labels: ["yen", "circle"],
    description:
      "Yen sign in a ring: the full-grid ring of `circle`, the sign in the secondary tone, as in `euro-circle`.",
  },
  "zap-off": {
    labels: ["zap", "off"],
    description:
      "Zap off: a lightning bolt in one tone, struck by a 45\u00b0 slash in the secondary tone.",
  },
  "zero-circle": {
    labels: ["zero", "circle"],
    description:
      "The digit 0 in a ring: the ring of `circle`, the digit in the secondary tone, as in `one-circle`.",
  },
  "zero-square": {
    labels: ["zero", "square"],
    description:
      "The digit 0 in a square: the frame of `square`, the digit in the secondary tone, as in `one-square`.",
  },
  "videotape-fill": {
    reference: "Filled variant of our own `videotape`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "videotape"],
    description:
      "Filled: videotape: a cassette with two reels joined by the tape, in the secondary tone.",
  },
  "wifi-square-fill": {
    reference: "Filled variant of our own `wifi-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "wifi"],
    description:
      "Filled: wi-Fi in a square: the frame of `square`, a small Wi-Fi in the secondary tone, as in `wifi-circle`.",
  },
  "zero-circle-fill": {
    reference: "Filled variant of our own `zero-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "zero"],
    description:
      "Filled: the digit 0 in a ring: the ring of `circle`, the digit in the secondary tone, as in `one-circle`.",
  },
  "zero-square-fill": {
    reference: "Filled variant of our own `zero-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "zero"],
    description:
      "Filled: the digit 0 in a square: the frame of `square`, the digit in the secondary tone, as in `one-square`.",
  },
  "stroke-left": {
    labels: ["stroke", "left"],
    description:
      "Left stroke: a dashed square whose left side is a solid line in the secondary tone.",
  },
  submerge: {
    labels: ["submerge"],
    description: "Submerge: an arrow in the secondary tone pointing down into two rows of waves.",
  },
  "sun-dim": {
    labels: ["sun", "dim"],
    description:
      "Dim sun: the disc of `sun-01` with its four short straight rays, the diagonal rays shortened to one dot each in the secondary tone.",
  },
  swatch: {
    labels: ["swatch"],
    description:
      "Colour swatch: a card with a block of colour in the secondary tone over a label line.",
  },
  "swatch-book": {
    labels: ["swatch", "book"],
    description:
      "Swatch book: the two sheets of `copy-01`, the front one with a block of colour in the secondary tone.",
  },
  "swiss-franc": {
    labels: ["swiss", "franc"],
    description:
      "Franc sign: an F with a two-pixel upright and a bar crossing its stem, like `dollar-01`.",
  },
  swords: {
    labels: ["swords"],
    description:
      "Two crossed swords: one-pixel blades crossing at the centre, guards and grips at the bottom.",
  },
  tangent: {
    labels: ["tangent"],
    description:
      "Tangent: a ring and a straight line in the secondary tone touching it at one point.",
  },
  "tea-pod": {
    labels: ["tea", "pod"],
    description:
      "Teapot: a lid with a knob, a round body, a spout on the left and a handle on the right.",
  },
  teaching: {
    labels: ["teaching"],
    description:
      "Teaching: a person beside a board, the writing on the board in the secondary tone.",
  },
  technician: {
    labels: ["technician"],
    description:
      "Technician: the person of `user-lock-01` with a wrench badge in the secondary tone, lower right.",
  },
  "tennis-ball": {
    labels: ["tennis", "ball"],
    description:
      "Tennis ball: the ring of `basketball-01` and two curved seams in the secondary tone.",
  },
  "test-tubes": {
    labels: ["test", "tubes"],
    description: "Two test tubes in a rack, the liquid at two levels in the secondary tone.",
  },
  tetris: {
    labels: ["tetris"],
    description: "Falling block: a T made of four outlined squares.",
  },
  "text-circle": {
    labels: ["text", "circle"],
    description: "Text in a circle: the ring of `circle` with a T in the secondary tone.",
  },
  "text-clear": {
    labels: ["text", "clear"],
    description:
      "Clear formatting: the T of `text` and a cross badge in the secondary tone, lower right.",
  },
  "toy-brick": {
    labels: ["toy", "brick"],
    description: "Toy brick: a block with two studs on top in the secondary tone.",
  },
  transparency: {
    labels: ["transparency"],
    description:
      "Transparency: the rounded square of `square` filled with a two-pixel checkerboard in the secondary tone.",
  },
  "tv-fix": {
    labels: ["tv", "fix"],
    description:
      "TV repair: the television of `tv-01` with a wrench badge in the secondary tone, lower right.",
  },
  "tv-issue": {
    labels: ["tv", "issue"],
    description:
      "TV issue: the television of `tv-01` with an exclamation mark in the secondary tone, lower right.",
  },
  "tv-minimal": {
    labels: ["tv", "minimal"],
    description: "Minimal TV: the screen of `tv-01` without antenna, a short base line under it.",
  },
  "tennis-ball-fill": {
    reference: "Filled variant of our own `tennis-ball`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "tennis"],
    description:
      "Filled: tennis ball: the ring of `basketball-01` and two curved seams in the secondary tone.",
  },
  "tetris-fill": {
    reference: "Filled variant of our own `tetris`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "tetris"],
    description: "Filled: falling block: a T made of four outlined squares.",
  },
  "text-circle-fill": {
    reference: "Filled variant of our own `text-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "text"],
    description: "Filled: text in a circle: the ring of `circle` with a T in the secondary tone.",
  },
  "toy-brick-fill": {
    reference: "Filled variant of our own `toy-brick`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "toy"],
    description: "Filled: toy brick: a block with two studs on top in the secondary tone.",
  },
  "tv-minimal-fill": {
    reference: "Filled variant of our own `tv-minimal`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "tv"],
    description:
      "Filled: minimal TV: the screen of `tv-01` without antenna, a short base line under it.",
  },
  "arrow-right-to-line": {
    labels: ["arrow", "right", "to"],
    description: "A rightward arrow stopping at a line.",
  },
  "arrow-turn-down": {
    labels: ["arrow", "turn", "down"],
    description: "An arrow coming from the right and turning down.",
  },
  "arrow-turn-up": {
    labels: ["arrow", "turn", "up"],
    description: "An arrow coming from the right and turning up.",
  },
  "arrow-up-0-1": {
    labels: ["arrow", "up"],
    description: "An upward arrow beside 0 over 1.",
  },
  "arrow-up-1-0": {
    labels: ["arrow", "up"],
    description: "An upward arrow beside 1 over 0.",
  },
  "arrow-up-az": {
    labels: ["arrow", "up", "az"],
    description: "An upward arrow beside A over Z.",
  },
  "arrow-up-big": {
    labels: ["arrow", "up", "big"],
    description: "A big outlined arrow pointing up.",
  },
  "arrow-up-from-dot": {
    labels: ["arrow", "up", "from"],
    description: "An upward arrow leaving a dot.",
  },
  "arrow-up-from-line": {
    labels: ["arrow", "up", "from"],
    description: "An upward arrow leaving a line.",
  },
  "arrow-up-narrow-wide": {
    labels: ["arrow", "up", "narrow"],
    description: "An upward arrow beside bars from short to long.",
  },
  "arrow-up-to-line": {
    labels: ["arrow", "up", "to"],
    description: "An upward arrow stopping at a line.",
  },
  "arrow-up-wide-narrow": {
    labels: ["arrow", "up", "wide"],
    description: "An upward arrow beside bars from long to short.",
  },
  "arrow-up-za": {
    labels: ["arrow", "up", "za"],
    description: "An upward arrow beside Z over A.",
  },
  "arrow-vertical": {
    labels: ["arrow", "vertical"],
    description: "A vertical arrow with a head at each end.",
  },
  "arrows-up-from-line": {
    labels: ["arrows", "up", "from"],
    description: "Two upward arrows leaving a line.",
  },
  "asteroid-01": {
    labels: ["asteroid"],
    description: "A lumpy rock with two craters.",
  },
  "astronaut-01": {
    labels: ["astronaut"],
    description: "An astronaut in a helmet with a visor.",
  },
  "atm-02": {
    labels: ["atm"],
    description: "A cash machine handing out a banknote.",
  },
  "augmented-reality-ar": {
    labels: ["augmented", "reality", "ar"],
    description: "The letters AR inside scan corners.",
  },
  "automotive-battery-01": {
    labels: ["automotive", "battery"],
    description: "A car battery with two terminals, plus and minus.",
  },
  "baby-01": {
    labels: ["baby"],
    description: "A baby's round face with a curl of hair.",
  },
  "baby-bed-01": {
    labels: ["baby", "bed"],
    description: "A baby's crib with rails and slats.",
  },
  "baby-boy-dress": {
    labels: ["baby", "boy", "dress"],
    description: "A baby's bodysuit with snaps between the legs.",
  },
  "baby-girl-dress": {
    labels: ["baby", "girl", "dress"],
    description: "A little dress with a sash at the waist.",
  },
  "badge-question-mark": {
    labels: ["badge", "question", "mark"],
    description: "A scalloped badge with a question mark.",
  },
  "badge-russian-ruble": {
    labels: ["badge", "russian", "ruble"],
    description: "A scalloped badge with the ruble sign.",
  },
  "badge-x": {
    labels: ["badge", "x"],
    description: "A scalloped badge with a cross.",
  },
  "badminton-shuttle": {
    labels: ["badminton", "shuttle"],
    description: "A shuttlecock: feathered cone on a round cork.",
  },
  "baggage-claim": {
    labels: ["baggage", "claim"],
    description: "A suitcase riding on a conveyor belt.",
  },
  "banknote-arrow-down": {
    labels: ["banknote", "arrow", "down"],
    description: "A banknote under a downward arrow.",
  },
  "banknote-arrow-up": {
    labels: ["banknote", "arrow", "up"],
    description: "A banknote under an upward arrow.",
  },
  "bar-chart-horizontal": {
    labels: ["bar", "chart", "horizontal"],
    description: "Horizontal bars of growing length from the left.",
  },
  "basketball-hoop": {
    labels: ["basketball", "hoop"],
    description: "A backboard with a hoop and net.",
  },
  "batteries-energy": {
    labels: ["batteries", "energy"],
    description: "Two upright batteries side by side.",
  },
  "battery-eco-charging": {
    labels: ["battery", "eco", "charging"],
    description: "A battery with a leaf inside.",
  },
  "battery-warning": {
    labels: ["battery", "warning"],
    description: "A battery with an exclamation mark.",
  },
  "bed-single-01": {
    labels: ["bed", "single"],
    description: "A single bed with one pillow.",
  },
  "between-horizontal-end": {
    labels: ["between", "horizontal", "end"],
    description: "Two stacked bars with a marker pointing between them from the right.",
  },
  "between-horizontal-start": {
    labels: ["between", "horizontal", "start"],
    description: "Two stacked bars with a marker pointing between them from the left.",
  },
  "between-vertical-end": {
    labels: ["between", "vertical", "end"],
    description: "Two side-by-side bars with a marker pointing between them from the bottom.",
  },
  "between-vertical-start": {
    labels: ["between", "vertical", "start"],
    description: "Two side-by-side bars with a marker pointing between them from the top.",
  },
  "blockchain-02": {
    labels: ["blockchain"],
    description: "Four linked blocks.",
  },
  "blood-type": {
    labels: ["blood", "type"],
    description: "A blood drop with the letter A.",
  },
  "blush-brush-01": {
    labels: ["blush", "brush"],
    description: "A round make-up brush.",
  },
  "body-soap": {
    labels: ["body", "soap"],
    description: "A bar of soap with bubbles.",
  },
  "body-weight": {
    labels: ["body", "weight"],
    description: "A bathroom scale with a dial.",
  },
  "arrow-up-big-fill": {
    reference:
      "Filled variant of our own `arrow-up-big`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "arrow"],
    description: "Filled: a big outlined arrow pointing up.",
  },
  "baby-boy-dress-fill": {
    reference:
      "Filled variant of our own `baby-boy-dress`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "baby"],
    description: "Filled: a baby's bodysuit with snaps between the legs.",
  },
  "ai-sketch": {
    labels: ["ai", "sketch"],
    description:
      "AI sketch: a pencil at 45\u00b0, point down to the left, the AI sparkle badge in the secondary tone.",
  },
  "ai-smartwatch": {
    labels: ["ai", "smartwatch"],
    description:
      "AI smartwatch: the face and straps of a watch, a sparkle on the screen in the secondary tone.",
  },
  "ai-swap": {
    labels: ["ai", "swap"],
    description:
      "AI swap: an arrow right above an arrow left, the AI sparkle badge in the secondary tone.",
  },
  "ai-template": {
    labels: ["ai", "template"],
    description:
      "AI template: a page layout with a header and a sidebar, the AI sparkle badge in the secondary tone.",
  },
  "ai-transcribe-audio": {
    labels: ["ai", "transcribe", "audio"],
    description:
      "AI transcription: a sound wave above two lines of text, the AI sparkle badge in the secondary tone.",
  },
  "ai-view": {
    labels: ["ai", "view"],
    description: "AI view: the outline of `eye` with a sparkle for a pupil in the secondary tone.",
  },
  "ai-vision-recognition": {
    labels: ["ai", "vision", "recognition"],
    description:
      "AI vision: the four corners of a scan frame around a sparkle in the secondary tone.",
  },
  "ai-voice-generator": {
    labels: ["ai", "voice", "generator"],
    description:
      "AI voice generator: a microphone on its stand, the AI sparkle badge in the secondary tone.",
  },
  "ai-web-browsing": {
    labels: ["ai", "web", "browsing"],
    description:
      "AI browsing: the upper part of `globe` as in `globe-lock`, the AI sparkle badge in the secondary tone.",
  },
  "airpod-01": {
    labels: ["airpod"],
    description: "Wireless earbuds: a pair of solid buds, each a round head on a stem.",
  },
  "alarm-clock-check": {
    labels: ["alarm", "clock", "check"],
    description:
      "Alarm clock with a check badge: `alarm-clock-plus` with a check in the secondary tone.",
  },
  "album-not-found-01": {
    labels: ["album", "not", "found"],
    description:
      "Album not found: the stacked frames of `album-02`, a cross in the front one in the secondary tone.",
  },
  "alien-01": {
    labels: ["alien"],
    description:
      "Alien head: a domed head narrowing to the chin, two slanted eyes in the secondary tone.",
  },
  "align-box-bottom-center": {
    labels: ["align", "box", "bottom"],
    description:
      "Box aligned bottom center: the frame of `square`, a small block at its bottom center in the secondary tone.",
  },
  "align-box-bottom-left": {
    labels: ["align", "box", "bottom"],
    description:
      "Box aligned bottom left: the frame of `square`, a small block at its bottom left in the secondary tone.",
  },
  "align-box-bottom-right": {
    labels: ["align", "box", "bottom"],
    description:
      "Box aligned bottom right: the frame of `square`, a small block at its bottom right in the secondary tone.",
  },
  "align-box-middle-center": {
    labels: ["align", "box", "middle"],
    description:
      "Box aligned middle center: the frame of `square`, a small block at its middle center in the secondary tone.",
  },
  "align-box-middle-left": {
    labels: ["align", "box", "middle"],
    description:
      "Box aligned middle left: the frame of `square`, a small block at its middle left in the secondary tone.",
  },
  "align-box-middle-right": {
    labels: ["align", "box", "middle"],
    description:
      "Box aligned middle right: the frame of `square`, a small block at its middle right in the secondary tone.",
  },
  "align-box-top-center": {
    labels: ["align", "box", "top"],
    description:
      "Box aligned top center: the frame of `square`, a small block at its top center in the secondary tone.",
  },
  "align-box-top-left": {
    labels: ["align", "box", "top"],
    description:
      "Box aligned top left: the frame of `square`, a small block at its top left in the secondary tone.",
  },
  "align-box-top-right": {
    labels: ["align", "box", "top"],
    description:
      "Box aligned top right: the frame of `square`, a small block at its top right in the secondary tone.",
  },
  "align-vertical-center": {
    labels: ["align", "vertical", "center"],
    description:
      "Align vertical centres: `align-horizontal-center` turned, two bars on a horizontal centre line.",
  },
  "align-vertical-justify-center": {
    labels: ["align", "vertical", "justify"],
    description:
      "Vertical justify center: `align-horizontal-justify-center` turned a quarter, the guides in the secondary tone.",
  },
  "align-vertical-justify-end": {
    labels: ["align", "vertical", "justify"],
    description:
      "Vertical justify end: `align-horizontal-justify-end` turned a quarter, the guides in the secondary tone.",
  },
  "align-vertical-justify-start": {
    labels: ["align", "vertical", "justify"],
    description:
      "Vertical justify start: `align-horizontal-justify-start` turned a quarter, the guides in the secondary tone.",
  },
  "align-vertical-space-around": {
    labels: ["align", "vertical", "space"],
    description:
      "Vertical space around: `align-horizontal-space-around` turned a quarter, the guides in the secondary tone.",
  },
  "align-vertical-space-between": {
    labels: ["align", "vertical", "space"],
    description:
      "Vertical space between: `align-horizontal-space-between` turned a quarter, the guides in the secondary tone.",
  },
  "app-window-mac": {
    labels: ["app", "window", "mac"],
    description: "Mac app window: `app-window` with three window buttons in the secondary tone.",
  },
  "approximately-equal": {
    labels: ["approximately", "equal"],
    description: "Approximately equal: two waves, symmetric by a half turn.",
  },
  "approximately-equal-circle": {
    labels: ["approximately", "equal", "circle"],
    description:
      "Approximately equal in a ring: the ring of `circle`, two small waves in the secondary tone.",
  },
  "approximately-equal-square": {
    labels: ["approximately", "equal", "square"],
    description:
      "Approximately equal in a square: the frame of `square`, two small waves in the secondary tone.",
  },
  "arrange-by-numbers-1-9": {
    labels: ["arrange", "by", "numbers"],
    description: "1 above 9, with a down arrow: sort from 1 to 9, the layout of `sorting-a-z-01`.",
  },
  "arrange-by-numbers-9-1": {
    labels: ["arrange", "by", "numbers"],
    description: "9 above 1, with a down arrow: sort from 9 to 1, the layout of `sorting-a-z-01`.",
  },
  "arrow-down-0-1": {
    labels: ["arrow", "down"],
    description: "Sort 0 to 1: the down arrow of `arrow-down-a-z`, 0 above 1.",
  },
  "arrow-down-1-0": {
    labels: ["arrow", "down"],
    description: "Sort 1 to 0: the down arrow of `arrow-down-a-z`, 1 above 0.",
  },
  "arrow-down-from-line": {
    labels: ["arrow", "down", "from"],
    description:
      "Arrow pointing down away from a bar at the top, the bar in the secondary tone; the arrow of `move-bottom`.",
  },
  "arrow-down-narrow-wide": {
    labels: ["arrow", "down", "narrow"],
    description: "Sort narrow to wide: the arrow of `sort-by-down-01`, bars growing downwards.",
  },
  "arrow-down-to-dot": {
    labels: ["arrow", "down", "to"],
    description:
      "Arrow pointing down to a ring, the ring in the secondary tone; the arrow of `move-bottom`.",
  },
  "arrow-down-za": {
    labels: ["arrow", "down", "za"],
    description: "Sort Z to A: `arrow-down-a-z` with the letters swapped.",
  },
  "arrow-left-big": {
    labels: ["arrow", "left", "big"],
    description: "Big outlined arrow pointing left: `arrow-right-big` mirrored.",
  },
  "arrow-left-from-line": {
    labels: ["arrow", "left", "from"],
    description:
      "Arrow pointing left away from a bar on the right, the bar in the secondary tone: `arrow-right-from-line` mirrored.",
  },
  "arrow-left-to-line": {
    labels: ["arrow", "left", "to"],
    description:
      "Arrow pointing left to a bar on the left, the bar in the secondary tone: `move-top` turned.",
  },
  "arrow-move-down-left": {
    labels: ["arrow", "move", "down"],
    description: "Arrow moving down, then turning left: `arrow-move-up-right` turned a half turn.",
  },
  "arrow-move-down-right": {
    labels: ["arrow", "move", "down"],
    description: "Arrow moving down, then turning right: `arrow-move-up-right` flipped.",
  },
  "arrow-move-left-down": {
    labels: ["arrow", "move", "left"],
    description: "Arrow moving left, then turning down: `arrow-move-right-down` mirrored.",
  },
  "arrow-move-right-down": {
    labels: ["arrow", "move", "right"],
    description: "Arrow moving right, then turning down: `arrow-move-down-right` turned.",
  },
  "arrow-move-up-left": {
    labels: ["arrow", "move", "up"],
    description: "Arrow moving up, then turning left: `arrow-move-up-right` mirrored.",
  },
  "arrow-move-up-right": {
    labels: ["arrow", "move", "up"],
    description: "Arrow moving up, then turning right at a square corner.",
  },
  "arrow-reload-vertical": {
    labels: ["arrow", "reload", "vertical"],
    description: "Vertical reload: the loop of two arrows of `repeat`, turned a quarter.",
  },
  "arrow-right-big": {
    labels: ["arrow", "right", "big"],
    description: "Big outlined arrow pointing right: `arrow-down-big` turned.",
  },
  "arrow-right-from-line": {
    labels: ["arrow", "right", "from"],
    description:
      "Arrow pointing right away from a bar on the left, the bar in the secondary tone: `arrow-down-from-line` turned.",
  },
  "app-window-mac-fill": {
    reference:
      "Filled variant of our own `app-window-mac`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "app"],
    description:
      "Filled: mac app window: `app-window` with three window buttons in the secondary tone.",
  },
  "arrow-right-big-fill": {
    reference:
      "Filled variant of our own `arrow-right-big`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "arrow"],
    description: "Filled: big outlined arrow pointing right: `arrow-down-big` turned.",
  },
  "arrow-left-big-fill": {
    reference:
      "Filled variant of our own `arrow-left-big`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "arrow"],
    description: "Filled: big outlined arrow pointing left: `arrow-right-big` mirrored.",
  },
  "dashed-line-01": {
    labels: ["dashed", "line"],
    description: "A solid line over a dashed line in the secondary tone.",
  },
  "database-sync-01": {
    labels: ["database", "sync"],
    description: "The database cylinder with a sync loop in the lower-right corner.",
  },
  "decimals-arrow-left": {
    labels: ["decimals", "arrow", "left"],
    description: "A decimal point and a zero over an arrow pointing left: fewer decimals.",
  },
  "decimals-arrow-right": {
    labels: ["decimals", "arrow", "right"],
    description: "A decimal point and a zero over an arrow pointing right: more decimals.",
  },
  "dental-braces": {
    labels: ["dental", "braces"],
    description: "The tooth with a brace wire and two brackets across it in the secondary tone.",
  },
  "dental-broken-tooth": {
    labels: ["dental", "broken", "tooth"],
    description: "The tooth with a zigzag crack down its crown in the secondary tone.",
  },
  "diagonal-scroll-point-01": {
    labels: ["diagonal", "scroll", "point"],
    description: "A scroll anchor: a centre dot with four arrowheads pointing to the corners.",
  },
  "dialpad-circle-01": {
    labels: ["dialpad", "circle"],
    description: "A circle holding a three-by-three grid of keypad dots.",
  },
  "dialpad-square-01": {
    labels: ["dialpad", "square"],
    description: "A rounded square holding a three-by-three grid of keypad dots.",
  },
  "dice-faces-01": {
    labels: ["dice", "faces"],
    description: "Two dice set corner to corner, one pip each.",
  },
  "digital-clock": {
    labels: ["digital", "clock"],
    description: "A digital clock: a rounded display showing the digits 1 and 2.",
  },
  "dim-sum-01": {
    labels: ["dim", "sum"],
    description: "A bamboo steamer for dim sum: a domed lid with a knob over two stacked baskets.",
  },
  "direction-left-01": {
    labels: ["direction", "left"],
    description: "A turn-left sign: a line rising then bending into an arrow pointing left.",
  },
  "direction-right-01": {
    labels: ["direction", "right"],
    description: "A turn-right sign: a line rising then bending into an arrow pointing right.",
  },
  "divide-sign-circle": {
    labels: ["divide", "sign", "circle"],
    description: "A circle holding a division sign.",
  },
  "do-not-touch-01": {
    labels: ["do", "not", "touch"],
    description: "Do not touch: the open hand crossed by a slash in the secondary tone.",
  },
  "document-attachment": {
    labels: ["document", "attachment"],
    description: "The document with a paperclip in the lower-right corner.",
  },
  "drafting-compass": {
    labels: ["drafting", "compass"],
    description:
      "A drafting compass: a knob and hinge over two spread legs joined by an adjusting bar.",
  },
  "dress-01": {
    labels: ["dress"],
    description: "A dress: thin straps, a fitted bodice, a narrow waist and a flared skirt.",
  },
  "dressing-table-01": {
    labels: ["dressing", "table"],
    description: "A dressing table: a round mirror on a stand over a table with a drawer.",
  },
  "dropdown-field-type": {
    labels: ["dropdown", "field", "type"],
    description: "A dropdown field: a rounded input box with a down chevron in the secondary tone.",
  },
  "ear-rings-01": {
    labels: ["ear", "rings"],
    description: "A drop earring: a small ring over an oval gem in the secondary tone.",
  },
  "ease-in-out": {
    labels: ["ease", "in", "out"],
    description:
      "Ease-in-out curve: flat at both ends and steep in the middle, with a handle dot at each end in the secondary tone.",
  },
  "ease-out": {
    labels: ["ease", "out"],
    description:
      "Ease-out curve: steep at the start, flattening to the end, with a handle dot at each end in the secondary tone.",
  },
  "ellipse-selection": {
    labels: ["ellipse", "selection"],
    description: "A dashed ellipse: an elliptic selection outline.",
  },
  "energy-rectangle": {
    labels: ["energy", "rectangle"],
    description: "A rounded rectangle with a lightning bolt in the secondary tone.",
  },
  "entering-geo-fence": {
    labels: ["entering", "geo", "fence"],
    description: "Entering a geofence: an arrow crossing into a dashed circle.",
  },
  "equal-sign-circle": {
    labels: ["equal", "sign", "circle"],
    description: "A circle holding an equal sign.",
  },
  "equal-sign-square": {
    labels: ["equal", "sign", "square"],
    description: "A rounded square holding an equal sign.",
  },
  "equipment-bench-press": {
    labels: ["equipment", "bench", "press"],
    description: "A bench press: a barbell with plates over a flat bench.",
  },
  "equipment-gym-01": {
    labels: ["equipment", "gym"],
    description: "A kettlebell: a round body under a looped handle.",
  },
  "equipment-weightlifting": {
    labels: ["equipment", "weightlifting"],
    description: "A barbell: a long bar through two heavy plates, one on each side.",
  },
  "expand-paragraph": {
    labels: ["expand", "paragraph"],
    description:
      "Expand paragraph: two lines of text between an arrowhead up and an arrowhead down.",
  },
  "digital-clock-fill": {
    reference:
      "Filled variant of our own `digital-clock`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "digital"],
    description: "Filled: a digital clock: a rounded display showing the digits 1 and 2.",
  },
  "dress-01-fill": {
    reference: "Filled variant of our own `dress-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "dress"],
    description:
      "Filled: a dress: thin straps, a fitted bodice, a narrow waist and a flared skirt.",
  },
  "energy-rectangle-fill": {
    reference:
      "Filled variant of our own `energy-rectangle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "energy"],
    description: "Filled: a rounded rectangle with a lightning bolt in the secondary tone.",
  },
  "equipment-gym-01-fill": {
    reference:
      "Filled variant of our own `equipment-gym-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "equipment"],
    description: "Filled: a kettlebell: a round body under a looped handle.",
  },
  "circle-arrow-out-down-left": {
    labels: ["circle", "arrow", "out"],
    description:
      "An arrow leaving a ring through its open lower left, the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-out-down-right": {
    labels: ["circle", "arrow", "out"],
    description:
      "An arrow leaving a ring through its open lower right, the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-out-up-left": {
    labels: ["circle", "arrow", "out"],
    description:
      "An arrow leaving a ring through its open upper left, the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-out-up-right": {
    labels: ["circle", "arrow", "out"],
    description:
      "An arrow leaving a ring through its open upper right, the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-right-double": {
    labels: ["circle", "arrow", "right"],
    description: "Two chevrons pointing right in a ring, `circle-arrow-down-double` turned.",
  },
  "circle-arrow-shrink-01": {
    labels: ["circle", "arrow", "shrink"],
    description:
      "Two corner arrows pointing in to the centre, in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-up-double": {
    labels: ["circle", "arrow", "up"],
    description: "Two chevrons pointing up in a ring, `circle-arrow-down-double` flipped.",
  },
  "circle-arrow-up-left": {
    labels: ["circle", "arrow", "up"],
    description: "An arrow pointing up left in a ring, `circle-arrow-down-left` flipped.",
  },
  "circle-arrow-up-right": {
    labels: ["circle", "arrow", "up"],
    description:
      "An arrow pointing up right in a ring, `circle-arrow-down-left` turned a half turn.",
  },
  "circle-arrow-vertical": {
    labels: ["circle", "arrow", "vertical"],
    description: "A double-headed vertical arrow in a ring, `circle-arrow-horizontal` turned.",
  },
  "circle-chevron-down": {
    labels: ["circle", "chevron", "down"],
    description: "A chevron pointing down in the ring of `circle-arrow-down-01`.",
  },
  "circle-chevron-left": {
    labels: ["circle", "chevron", "left"],
    description: "A chevron pointing left in the ring of `circle-arrow-down-01`.",
  },
  "circle-chevron-right": {
    labels: ["circle", "chevron", "right"],
    description: "A chevron pointing right in the ring of `circle-arrow-down-01`.",
  },
  "circle-chevron-up": {
    labels: ["circle", "chevron", "up"],
    description: "A chevron pointing up in the ring of `circle-arrow-down-01`.",
  },
  "circle-dot-dashed": {
    labels: ["circle", "dot", "dashed"],
    description: "The dashed ring of `circle-dashed` around the dot of `circle-dot`.",
  },
  "circle-fading-arrow-up": {
    labels: ["circle", "fading", "arrow"],
    description:
      "An up arrow in a ring whose left half fades into dashes, the dashes of `circle-dashed`.",
  },
  "circle-fading-plus": {
    labels: ["circle", "fading", "plus"],
    description:
      "A plus in a ring whose left half fades into dashes, the dashes of `circle-dashed`.",
  },
  "circle-gauge": {
    labels: ["circle", "gauge"],
    description: "A gauge: a needle from the hub to the upper right, in the ring of `circle`.",
  },
  "circle-lock-add-01": {
    labels: ["circle", "lock", "add"],
    description: "The round lock of `circle-lock-01` with a plus badge in the lower right corner.",
  },
  "circle-lock-check-01": {
    labels: ["circle", "lock", "check"],
    description: "The round lock of `circle-lock-01` with a check badge in the lower right corner.",
  },
  "circle-lock-minus-01": {
    labels: ["circle", "lock", "minus"],
    description: "The round lock of `circle-lock-01` with a minus badge in the lower right corner.",
  },
  "circle-lock-remove-01": {
    labels: ["circle", "lock", "remove"],
    description: "The round lock of `circle-lock-01` with a cross badge in the lower right corner.",
  },
  "circle-off": {
    labels: ["circle", "off"],
    description: "The ring of `circle-arrow-down-01` crossed by a slash, as in `power-off`.",
  },
  "circle-pile": {
    labels: ["circle", "pile"],
    description: "A pile of three solid discs, one resting on two.",
  },
  "circle-power": {
    labels: ["circle", "power"],
    description: "A power symbol in the ring of `circle`.",
  },
  "circle-small": {
    labels: ["circle", "small"],
    description: "A small ring, smaller than `circle`.",
  },
  "circle-unlock-01": {
    labels: ["circle", "unlock"],
    description:
      "The round lock of `circle-lock-01` with its shackle raised and open on the right.",
  },
  "cleaning-bucket": {
    labels: ["cleaning", "bucket"],
    description: "The bucket of `bucket` filled with water.",
  },
  "closed-caption": {
    labels: ["closed", "caption"],
    description: "Two letters C in the frame of `captions`.",
  },
  "cloud-slow-wind": {
    labels: ["cloud", "slow", "wind"],
    description: "The cloud of `cloud-fast-wind` with short, slow wind strokes.",
  },
  "clubs-01": {
    labels: ["clubs"],
    description: "The clubs card suit: three lobes on the stem of `spade`.",
  },
  "collections-bookmark": {
    labels: ["collections", "bookmark"],
    description: "A stack of two sheets, the front one with a bookmark ribbon.",
  },
  "column-delete": {
    labels: ["column", "delete"],
    description: "The columns of `layout-3-column` with a cross badge.",
  },
  "column-insert": {
    labels: ["column", "insert"],
    description: "The columns of `layout-3-column` with a plus badge.",
  },
  "columns-3-cog": {
    labels: ["columns", "cog"],
    description: "The columns of `layout-3-column` with the cog badge of `file-cog`.",
  },
  "comet-01": {
    labels: ["comet"],
    description: "A comet: a solid head at the lower left and three streaks of tail.",
  },
  "comment-block-01": {
    labels: ["comment", "block"],
    description: "The speech bubble of `comment-01` with the block badge of `file-block`.",
  },
  "computer-desk-02": {
    labels: ["computer", "desk"],
    description: "A small monitor standing on the desk of `desk`.",
  },
  "computer-settings": {
    labels: ["computer", "settings"],
    description: "The monitor of `computer` with the cog badge of `file-cog`.",
  },
  "concierge-bell": {
    labels: ["concierge", "bell"],
    description: "A concierge bell: a dome with a knob, on a base.",
  },
  "container-truck": {
    labels: ["container", "truck"],
    description: "The truck of `truck` carrying a ribbed container.",
  },
  "coordinate-02": {
    labels: ["coordinate"],
    description: "Two axes with arrowheads and a point placed between them.",
  },
  "cosine-01": {
    labels: ["cosine"],
    description: "One period of a cosine wave above an axis.",
  },
  "cupcake-01": {
    labels: ["cupcake"],
    description: "A cupcake: a cherry on a frosting dome over a ribbed paper case.",
  },
  "curvy-left-direction": {
    labels: ["curvy", "left", "direction"],
    description: "An arrow that rises and curves to the left.",
  },
  "curvy-left-right-direction": {
    labels: ["curvy", "left", "right"],
    description: "A road that rises and forks into arrows to the left and right.",
  },
  "curvy-right-direction": {
    labels: ["curvy", "right", "direction"],
    description: "An arrow that rises and curves to the right.",
  },
  "circle-arrow-up-left-fill": {
    reference:
      "Filled variant of our own `circle-arrow-up-left`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: an arrow pointing up left in a ring, `circle-arrow-down-left` flipped.",
  },
  "circle-arrow-up-right-fill": {
    reference:
      "Filled variant of our own `circle-arrow-up-right`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description:
      "Filled: an arrow pointing up right in a ring, `circle-arrow-down-left` turned a half turn.",
  },
  "circle-chevron-down-fill": {
    reference:
      "Filled variant of our own `circle-chevron-down`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: a chevron pointing down in the ring of `circle-arrow-down-01`.",
  },
  "circle-chevron-left-fill": {
    reference:
      "Filled variant of our own `circle-chevron-left`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: a chevron pointing left in the ring of `circle-arrow-down-01`.",
  },
  "circle-chevron-right-fill": {
    reference:
      "Filled variant of our own `circle-chevron-right`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: a chevron pointing right in the ring of `circle-arrow-down-01`.",
  },
  "circle-chevron-up-fill": {
    reference:
      "Filled variant of our own `circle-chevron-up`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: a chevron pointing up in the ring of `circle-arrow-down-01`.",
  },
  "circle-power-fill": {
    reference:
      "Filled variant of our own `circle-power`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: a power symbol in the ring of `circle`.",
  },
  "closed-caption-fill": {
    reference:
      "Filled variant of our own `closed-caption`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "closed"],
    description: "Filled: two letters C in the frame of `captions`.",
  },
  "clubs-01-fill": {
    reference: "Filled variant of our own `clubs-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "clubs"],
    description: "Filled: the clubs card suit: three lobes on the stem of `spade`.",
  },
  "concierge-bell-fill": {
    reference:
      "Filled variant of our own `concierge-bell`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "concierge"],
    description: "Filled: a concierge bell: a dome with a knob, on a base.",
  },
  "1st-bracket-circle": {
    labels: ["1st", "bracket", "circle"],
    description: "Parentheses inside a circle: the round brackets in the secondary tone.",
  },
  "1st-bracket-square": {
    labels: ["1st", "bracket", "square"],
    description: "Parentheses inside a rounded square: the round brackets in the secondary tone.",
  },
  "24-hours-clock": {
    labels: ["hours", "clock"],
    description: "Round-the-clock: a clock face with 24 in the secondary tone.",
  },
  "2nd-bracket-circle": {
    labels: ["2nd", "bracket", "circle"],
    description: "Curly braces inside a circle: the braces in the secondary tone.",
  },
  "3-d-view": {
    labels: ["d", "view"],
    description:
      "3D view: an oblique cube in the secondary tone inside the corners of a viewfinder.",
  },
  "3-g-signal": {
    labels: ["g", "signal"],
    description:
      "3G mobile signal: the label 3G in the secondary tone above four rising signal bars.",
  },
  "3rd-bracket-circle": {
    labels: ["3rd", "bracket", "circle"],
    description: "Square brackets inside a circle: the brackets in the secondary tone.",
  },
  "3rd-bracket-square": {
    labels: ["3rd", "bracket", "square"],
    description: "Square brackets inside a rounded square: the brackets in the secondary tone.",
  },
  "4-g-signal": {
    labels: ["g", "signal"],
    description:
      "4G mobile signal: the label 4G in the secondary tone above four rising signal bars.",
  },
  "5-g-signal": {
    labels: ["g", "signal"],
    description:
      "5G mobile signal: the label 5G in the secondary tone above four rising signal bars.",
  },
  "7z-01": {
    labels: ["7z"],
    description:
      "7Z archive file: a document whose lower right carries the letters 7Z in the secondary tone.",
  },
  "a-arrow-down": {
    labels: ["a", "arrow", "down"],
    description: "Decrease font size: a capital A beside a down arrow in the secondary tone.",
  },
  "a-arrow-up": {
    labels: ["a", "arrow", "up"],
    description: "Increase font size: a capital A beside an up arrow in the secondary tone.",
  },
  "a-large-small": {
    labels: ["a", "large", "small"],
    description: "Text size: a large capital A beside a small one.",
  },
  "account-recovery": {
    labels: ["account", "recovery"],
    description:
      "Account recovery: a person with a circular arrow badge in the secondary tone, lower right.",
  },
  "activity-circle": {
    labels: ["activity", "circle"],
    description: "Activity in a circle: a pulse line inside a ring.",
  },
  "activity-spark": {
    labels: ["activity", "spark"],
    description: "Activity with AI: a pulse line and the AI sparkle badge in the secondary tone.",
  },
  "ai-auto-rotate": {
    labels: ["ai", "auto", "rotate"],
    description:
      "AI auto-rotate: `rotate-right-01` with the AI sparkle badge in the secondary tone.",
  },
  "ai-camera": {
    labels: ["ai", "camera"],
    description:
      "AI camera: `camera-01` one column left, the AI sparkle badge in the secondary tone.",
  },
  "ai-chemistry-01": {
    labels: ["ai", "chemistry"],
    description:
      "AI chemistry: a test tube with liquid, the AI sparkle badge in the secondary tone.",
  },
  "ai-chip": {
    labels: ["ai", "chip"],
    description: "AI chip: a chip with pins and the letters AI in the secondary tone.",
  },
  "ai-clothes": {
    labels: ["ai", "clothes"],
    description: "AI clothes: `shirt-01` with the AI sparkle badge in the secondary tone.",
  },
  "ai-collage-template": {
    labels: ["ai", "collage", "template"],
    description:
      "AI collage: three picture tiles and the AI sparkle badge in the fourth corner, secondary tone.",
  },
  "ai-content-generator-01": {
    labels: ["ai", "content", "generator"],
    description:
      "AI content generator: a document with lines of text and the AI sparkle badge in the secondary tone.",
  },
  "ai-crop": {
    labels: ["ai", "crop"],
    description: "AI crop: two crop marks framing the AI sparkle in the secondary tone.",
  },
  "ai-editing": {
    labels: ["ai", "editing"],
    description:
      "AI editing: `edit-01` lines and pencil, the AI sparkle badge in the secondary tone.",
  },
  "ai-elements": {
    labels: ["ai", "elements"],
    description:
      "AI elements: a triangle and a square from `shapes`, the AI sparkle badge in place of the circle.",
  },
  "ai-eraser": {
    labels: ["ai", "eraser"],
    description:
      "AI eraser: `eraser` one step up and left, the AI sparkle badge in the secondary tone.",
  },
  "ai-expand": {
    labels: ["ai", "expand"],
    description:
      "AI expand: three corner arrows of `maximize-01`, the AI sparkle badge in the fourth corner.",
  },
  "ai-file": {
    labels: ["ai", "file"],
    description: "AI file: `file-01` one column left, the AI sparkle badge in the secondary tone.",
  },
  "ai-folder-01": {
    labels: ["ai", "folder"],
    description: "AI folder: `folder-01` with the AI sparkle badge in the secondary tone.",
  },
  "ai-game": {
    labels: ["ai", "game"],
    description: "AI game: `game-controller-01` with the AI sparkle badge in the secondary tone.",
  },
  "ai-hd-resolution": {
    labels: ["ai", "hd", "resolution"],
    description: "AI HD: the letters HD with the AI sparkle badge in the secondary tone.",
  },
  "ai-learning": {
    labels: ["ai", "learning"],
    description:
      "AI learning: `mortarboard-01` one step up and left, the AI sparkle badge in the secondary tone.",
  },
  "ai-lock": {
    labels: ["ai", "lock"],
    description: "AI lock: `lock` one column left, the AI sparkle badge in the secondary tone.",
  },
  "ai-mail": {
    labels: ["ai", "mail"],
    description: "AI mail: `mail-01` with the AI sparkle badge in the secondary tone.",
  },
  "ai-mic": {
    labels: ["ai", "mic"],
    description:
      "AI microphone: `mic-01` two columns left, the AI sparkle badge in the secondary tone.",
  },
  "ai-network": {
    labels: ["ai", "network"],
    description:
      "AI network: a node linked to a second node and to the AI sparkle badge in the secondary tone.",
  },
  "ai-paintbrush": {
    labels: ["ai", "paintbrush"],
    description:
      "AI paintbrush: `brush` three columns left, the AI sparkle badge in the secondary tone.",
  },
  "ai-phone-01": {
    labels: ["ai", "phone"],
    description:
      "AI phone: `smart-phone-01` at the left, the AI sparkle badge in the secondary tone.",
  },
  "ai-replace": {
    labels: ["ai", "replace"],
    description:
      "AI replace: a box, two swap arrows and the AI sparkle badge in place of the second box.",
  },
  "ai-scan": {
    labels: ["ai", "scan"],
    description:
      "AI scan: the corners of `scan` and a scan line, the AI sparkle badge in the fourth corner.",
  },
  "ai-scan-text": {
    labels: ["ai", "scan", "text"],
    description: "AI text scan: `scan-text` with the AI sparkle badge in the fourth corner.",
  },
  "ai-scheduling": {
    labels: ["ai", "scheduling"],
    description: "AI scheduling: `calendar-01` with the AI sparkle badge in the secondary tone.",
  },
  "ai-setting": {
    labels: ["ai", "setting"],
    description:
      "AI settings: a large sparkle with a cog badge in the secondary tone, lower right.",
  },
  "ai-sheets": {
    labels: ["ai", "sheets"],
    description:
      "AI sheets: a spreadsheet grid with the AI sparkle badge in place of its last cell.",
  },
  "books-02": {
    labels: ["books"],
    description: "Three books lying in a stack, each offset from the one below.",
  },
  "bookshelf-02": {
    labels: ["bookshelf"],
    description:
      "Bookshelf cabinet: books in the top compartment in the secondary tone, a drawer below, two feet.",
  },
  "brain-01": {
    labels: ["brain"],
    description:
      "Brain seen from the side: a lobed outline, the folds in the secondary tone, the stem below.",
  },
  "brain-circuit": {
    labels: ["brain", "circuit"],
    description:
      "Brain of `brain-01` with a circuit trace and its node inside, in the secondary tone.",
  },
  "bread-02": {
    labels: ["bread"],
    description: "Loaf of bread: a domed top with three scores in the secondary tone, a flat base.",
  },
  "brick-wall-fire": {
    labels: ["brick", "wall", "fire"],
    description: "Brick wall of `brick-wall` with a flame badge in the secondary tone: a firewall.",
  },
  "brick-wall-shield": {
    labels: ["brick", "wall", "shield"],
    description:
      "Brick wall of `brick-wall` with a shield badge in the secondary tone: a protected firewall.",
  },
  "brush-cleaning": {
    labels: ["brush", "cleaning"],
    description:
      "Cleaning brush: a handle on a wide block, the bristles below it in the secondary tone.",
  },
  building2: {
    labels: ["building2"],
    description:
      "Building: a tall block and a lower annex, the windows in the secondary tone, on a ground line.",
  },
  "bulb-charging": {
    labels: ["bulb", "charging"],
    description: "Light bulb of `bulb` with a lightning bolt inside in the secondary tone.",
  },
  "bulletproof-vest": {
    labels: ["bulletproof", "vest"],
    description:
      "Bulletproof vest: shoulder straps, a neck opening, the armour plate in the secondary tone.",
  },
  "c-programming": {
    labels: ["c", "programming"],
    description: "The letter C, in the secondary tone, in a square frame: the C language.",
  },
  "calendar-x-01": {
    labels: ["calendar", "x"],
    description: "Calendar of `calendar-01` with a cross inside in the secondary tone.",
  },
  "call-internal-02": {
    labels: ["call", "internal"],
    description:
      "Handset of `call` with a two-way arrow above it in the secondary tone: an internal call.",
  },
  "camera-night-mode-02": {
    labels: ["camera", "night", "mode"],
    description: "Camera of `camera-01` with a crescent moon in place of the lens: night mode.",
  },
  "cancel-circle-half-dot": {
    labels: ["cancel", "circle", "half"],
    description:
      "Cancel, half done: the ring of `add-circle-half-dot`, the cross of `cancel-circle`.",
  },
  "cap-projecting": {
    labels: ["cap", "projecting"],
    description:
      "Projecting line cap: the stroke outline runs past its end point, drawn as a dot in the secondary tone.",
  },
  "card-exchange-01": {
    labels: ["card", "exchange"],
    description:
      "Two cards swapping places, two curved arrows between them in the secondary tone; symmetric by a half turn.",
  },
  "cardiogram-01": {
    labels: ["cardiogram"],
    description:
      "Cardiogram: a monitor on a stand, a heartbeat line across the screen in the secondary tone.",
  },
  "case-sensitive": {
    labels: ["case", "sensitive"],
    description: "Case sensitive: a capital A and a small a.",
  },
  "cashback-euro": {
    labels: ["cashback", "euro"],
    description:
      "Cashback in euros: the anticlockwise ring of `rotate-left-01` around a euro sign in the secondary tone.",
  },
  "cashback-pound": {
    labels: ["cashback", "pound"],
    description:
      "Cashback in pounds: the anticlockwise ring of `rotate-left-01` around a pound sign in the secondary tone.",
  },
  "cassette-tape": {
    labels: ["cassette", "tape"],
    description:
      "Audio cassette: two reels joined by the tape in the secondary tone, the tape guide tab below.",
  },
  "change-screen-mode": {
    labels: ["change", "screen", "mode"],
    description: "Change screen mode: two overlapping screens, the front one hiding the back one.",
  },
  "chart-column-stacked": {
    labels: ["chart", "column", "stacked"],
    description:
      "Stacked column chart: an axis and three columns of two segments, the top segments in the secondary tone.",
  },
  "chart-high-low": {
    labels: ["chart", "high", "low"],
    description:
      "High-low chart: an axis and two price bars, each with an open tick on the left and a close tick on the right.",
  },
  "chart-maximum": {
    labels: ["chart", "maximum"],
    description:
      "Chart maximum: axes and a curve rising to a peak and falling, in the secondary tone.",
  },
  "chart-medium": {
    labels: ["chart", "medium"],
    description:
      "Chart medium: axes and an S-curve settling from high to low, in the secondary tone.",
  },
  "chart-minimum": {
    labels: ["chart", "minimum"],
    description:
      "Chart minimum: axes and a curve falling to a low point and rising, in the secondary tone.",
  },
  "chart-no-axes-column": {
    labels: ["chart", "no", "axes"],
    description: "Column chart without axes: three solid columns, the middle one tallest.",
  },
  "chart-no-axes-column-decreasing": {
    labels: ["chart", "no", "axes"],
    description: "Column chart without axes: three solid columns getting shorter.",
  },
  "chart-no-axes-column-increasing": {
    labels: ["chart", "no", "axes"],
    description: "Column chart without axes: three solid columns getting taller.",
  },
  "chart-no-axes-gantt": {
    labels: ["chart", "no", "axes"],
    description:
      "Gantt chart without axes: three staggered task bars, the middle one in the secondary tone; symmetric by a half turn.",
  },
  "chart-relationship": {
    labels: ["chart", "relationship"],
    description: "Relationship chart: a ring node linked to three smaller nodes.",
  },
  "chart-spline": {
    labels: ["chart", "spline"],
    description:
      "Spline chart: axes and a smooth curve that dips and then climbs, in the secondary tone.",
  },
  "chat-search-01": {
    labels: ["chat", "search"],
    description: "Speech bubble of `message-01` with a magnifier badge in the secondary tone.",
  },
  "chat-upload-01": {
    labels: ["chat", "upload"],
    description: "Speech bubble of `message-01` with an upload arrow badge in the secondary tone.",
  },
  "cheese-cake-01": {
    labels: ["cheese", "cake"],
    description:
      "Cheesecake slice: the wedge of `cake-slice`, a cherry on top in the secondary tone, a crust band below.",
  },
  "chess-queen": {
    labels: ["chess", "queen"],
    description: "Chess queen: a crown of three points over the body and base of `chess-king`.",
  },
  "chess-rook": {
    labels: ["chess", "rook"],
    description: "Chess rook: three merlons on a tower with a flared base.",
  },
  cigarette: {
    labels: ["cigarette"],
    description:
      "Cigarette: a filter and a body, a wisp of smoke above the lit end in the secondary tone.",
  },
  "cigarette-off": {
    labels: ["cigarette", "off"],
    description:
      "No smoking: the cigarette of `cigarette` struck by a 45\u00b0 slash in the secondary tone.",
  },
  "cinnamon-roll": {
    labels: ["cinnamon", "roll"],
    description:
      "Cinnamon roll seen from above: a ring with a spiral of filling inside in the secondary tone.",
  },
  "circle-arrow-move-down-right": {
    labels: ["circle", "arrow", "move"],
    description:
      "Arrow that runs down then turns right, in the ring of `circle-arrow-down-01`: `circle-arrow-move-down-left` mirrored.",
  },
  "circle-arrow-move-left-down": {
    labels: ["circle", "arrow", "move"],
    description: "Arrow that runs left then turns down, in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-move-right-down": {
    labels: ["circle", "arrow", "move"],
    description: "Arrow that runs right then turns down, in the ring of `circle-arrow-down-01`.",
  },
  "circle-arrow-move-up-left": {
    labels: ["circle", "arrow", "move"],
    description:
      "Arrow that runs up then turns left, in the ring of `circle-arrow-down-01`: `circle-arrow-move-down-left` flipped.",
  },
  "circle-arrow-move-up-right": {
    labels: ["circle", "arrow", "move"],
    description: "Arrow that runs up then turns right, in the ring of `circle-arrow-down-01`.",
  },
  "bread-02-fill": {
    reference: "Filled variant of our own `bread-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bread"],
    description:
      "Filled: loaf of bread: a domed top with three scores in the secondary tone, a flat base.",
  },
  "bulletproof-vest-fill": {
    reference:
      "Filled variant of our own `bulletproof-vest`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bulletproof"],
    description:
      "Filled: bulletproof vest: shoulder straps, a neck opening, the armour plate in the secondary tone.",
  },
  "chess-rook-fill": {
    reference: "Filled variant of our own `chess-rook`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "chess"],
    description: "Filled: chess rook: three merlons on a tower with a flared base.",
  },
  "external-drive": {
    labels: ["external", "drive"],
    description:
      "External drive: a portable drive standing upright, with its cable plugged in at the bottom in the secondary tone.",
  },
  "favourite-circle": {
    labels: ["favourite", "circle"],
    description: "Heart in the secondary tone inside the circle of `star-circle`.",
  },
  "favourite-square": {
    labels: ["favourite", "square"],
    description: "Heart in the secondary tone inside the rounded square of `star-square`.",
  },
  "file-database": {
    labels: ["file", "database"],
    description: "File with a database badge: a small cylinder with a band, lower right.",
  },
  "file-dollar": {
    labels: ["file", "dollar"],
    description: "File with a dollar sign badge in the secondary tone, built like `file-euro`.",
  },
  "file-exclamation-point": {
    labels: ["file", "exclamation", "point"],
    description: "File with an exclamation mark inside, built like `file-unknown`.",
  },
  "file-headphone": {
    labels: ["file", "headphone"],
    description: "File with a headphones badge, the one of `book-headphones`.",
  },
  "file-input": {
    labels: ["file", "input"],
    description: "File with an arrow entering through its left side, built like `folder-input`.",
  },
  "file-output": {
    labels: ["file", "output"],
    description: "File with an arrow leaving through its right side.",
  },
  "file-pound": {
    labels: ["file", "pound"],
    description: "File with a pound sterling sign badge in the secondary tone.",
  },
  "file-scan": {
    labels: ["file", "scan"],
    description: "File crossed by a scan line in the secondary tone.",
  },
  "file-security": {
    labels: ["file", "security"],
    description: "File with a shield badge, the one of `user-shield-01`.",
  },
  "file-signal": {
    labels: ["file", "signal"],
    description: "File with a badge of three signal bars rising to the right.",
  },
  "file-symlink": {
    labels: ["file", "symlink"],
    description: "File with a bent arrow badge: a symbolic link.",
  },
  "file-type": {
    labels: ["file", "type"],
    description: "File with a capital T inside, built like `clipboard-type`.",
  },
  "file-type-corner": {
    labels: ["file", "type", "corner"],
    description: "File with a capital T badge at the lower right.",
  },
  "file-unlocked": {
    labels: ["file", "unlocked"],
    description: "File with an open padlock badge, the lock of `file-lock` with its shackle open.",
  },
  "file-user": {
    labels: ["file", "user"],
    description: "File with a person badge, the one of `book-user`.",
  },
  "file-video-camera": {
    labels: ["file", "video", "camera"],
    description: "File with a video camera badge: a body and its lens.",
  },
  "file-view": {
    labels: ["file", "view"],
    description: "File with an eye badge in the secondary tone.",
  },
  "file-volume": {
    labels: ["file", "volume"],
    description: "File with a speaker badge and one sound wave.",
  },
  "file-yen": {
    labels: ["file", "yen"],
    description: "File with a yen sign badge in the secondary tone.",
  },
  "fire-extinguisher": {
    labels: ["fire", "extinguisher"],
    description:
      "Fire extinguisher: a tank with a valve on top and its hose in the secondary tone.",
  },
  "fit-to-screen": {
    labels: ["fit", "to", "screen"],
    description: "Fit to screen: four corner brackets around a frame in the secondary tone.",
  },
  "flag-triangle-left": {
    labels: ["flag", "triangle", "left"],
    description: "Pennant pointing left on a pole at the right: `flag-02` mirrored.",
  },
  "flashlight-off": {
    labels: ["flashlight", "off"],
    description:
      "Flashlight of `flashlight` without its rays, crossed by a slash in the secondary tone.",
  },
  "flask-conical-off": {
    labels: ["flask", "conical", "off"],
    description: "Empty conical flask of `flask-conical` crossed by a slash in the secondary tone.",
  },
  "flow-connection": {
    labels: ["flow", "connection"],
    description: "Two boxes joined by an elbow connector in the secondary tone.",
  },
  "flowchart-02": {
    labels: ["flowchart"],
    description:
      "Flowchart: a box branching into two boxes through connectors in the secondary tone.",
  },
  "fold-horizontal": {
    labels: ["fold", "horizontal"],
    description: "Two arrows pointing in at a fold line in the secondary tone: fold sideways.",
  },
  "fold-vertical": {
    labels: ["fold", "vertical"],
    description: "Two arrows pointing in at a fold line in the secondary tone: fold up and down.",
  },
  "folder-kanban": {
    labels: ["folder", "kanban"],
    description: "Folder with three kanban columns of different heights in the secondary tone.",
  },
  "folder-library": {
    labels: ["folder", "library"],
    description: "Folder holding two upright books and a leaning one.",
  },
  "folder-links": {
    labels: ["folder", "links"],
    description: "Folder with a link badge, the one of `file-link`.",
  },
  "folder-off": {
    labels: ["folder", "off"],
    description: "Folder of `folder-01` crossed by a slash in the secondary tone.",
  },
  "folder-open-dot": {
    labels: ["folder", "open", "dot"],
    description: "Open folder of `folder-open` with a dot in the secondary tone on its flap.",
  },
  "folder-security": {
    labels: ["folder", "security"],
    description: "Folder with a shield badge, the one of `user-shield-01`.",
  },
  "folder-symlink": {
    labels: ["folder", "symlink"],
    description: "Folder with a bent arrow badge: a symbolic link.",
  },
  "folder-unknown": {
    labels: ["folder", "unknown"],
    description: "Folder with a question mark badge in the secondary tone.",
  },
  "folder-unlocked": {
    labels: ["folder", "unlocked"],
    description:
      "Folder with an open padlock badge, the lock of `folder-lock` with its shackle open.",
  },
  "folder-video": {
    labels: ["folder", "video"],
    description: "Folder with a video camera badge: a body and its lens.",
  },
  "folder-view": {
    labels: ["folder", "view"],
    description: "Folder with an eye badge in the secondary tone.",
  },
  "football-pitch": {
    labels: ["football", "pitch"],
    description:
      "Football pitch: the field, its halfway line and the centre circle in the secondary tone.",
  },
  "french-fries-01": {
    labels: ["french", "fries"],
    description: "French fries: sticks in the secondary tone rising from a carton.",
  },
  "favourite-circle-fill": {
    reference:
      "Filled variant of our own `favourite-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "favourite"],
    description: "Filled: heart in the secondary tone inside the circle of `star-circle`.",
  },
  "favourite-square-fill": {
    reference:
      "Filled variant of our own `favourite-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "favourite"],
    description: "Filled: heart in the secondary tone inside the rounded square of `star-square`.",
  },
  "flag-triangle-left-fill": {
    reference:
      "Filled variant of our own `flag-triangle-left`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "flag"],
    description: "Filled: pennant pointing left on a pole at the right: `flag-02` mirrored.",
  },
  "gamepad-directional": {
    labels: ["gamepad", "directional"],
    description: "Directional pad: a cross-shaped outline with the centre in the secondary tone.",
  },
  "gibbous-moon": {
    labels: ["gibbous", "moon"],
    description:
      "Gibbous moon: a circle mostly lit in the secondary tone, a thin dark crescent on the left.",
  },
  "go-backward-10-sec": {
    labels: ["go", "backward", "sec"],
    description:
      "Go back 10 seconds: an arc turning left with an arrowhead, over the number 10 in the secondary tone.",
  },
  "go-backward-15-sec": {
    labels: ["go", "backward", "sec"],
    description:
      "Go back 15 seconds: an arc turning left with an arrowhead, over the number 15 in the secondary tone.",
  },
  "go-backward-30-sec": {
    labels: ["go", "backward", "sec"],
    description:
      "Go back 30 seconds: an arc turning left with an arrowhead, over the number 30 in the secondary tone.",
  },
  "go-backward-5-sec": {
    labels: ["go", "backward", "sec"],
    description:
      "Go back 5 seconds: an arc turning left with an arrowhead, over the number 5 in the secondary tone.",
  },
  "go-backward-60-sec": {
    labels: ["go", "backward", "sec"],
    description:
      "Go back 60 seconds: an arc turning left with an arrowhead, over the number 60 in the secondary tone.",
  },
  "go-forward-10-sec": {
    labels: ["go", "forward", "sec"],
    description:
      "Go forward 10 seconds: an arc turning right with an arrowhead, over the number 10 in the secondary tone.",
  },
  "go-forward-15-sec": {
    labels: ["go", "forward", "sec"],
    description:
      "Go forward 15 seconds: an arc turning right with an arrowhead, over the number 15 in the secondary tone.",
  },
  "go-forward-30-sec": {
    labels: ["go", "forward", "sec"],
    description:
      "Go forward 30 seconds: an arc turning right with an arrowhead, over the number 30 in the secondary tone.",
  },
  "go-forward-5-sec": {
    labels: ["go", "forward", "sec"],
    description:
      "Go forward 5 seconds: an arc turning right with an arrowhead, over the number 5 in the secondary tone.",
  },
  "go-forward-60-sec": {
    labels: ["go", "forward", "sec"],
    description:
      "Go forward 60 seconds: an arc turning right with an arrowhead, over the number 60 in the secondary tone.",
  },
  "gps-off-01": {
    labels: ["gps", "off"],
    description: "The GPS pin and ring struck through by a slash in the secondary tone.",
  },
  "graphic-card": {
    labels: ["graphic", "card"],
    description:
      "Graphics card: a board with a round fan in the secondary tone, a bracket and contact pins.",
  },
  "greater-than": {
    labels: ["greater", "than"],
    description: "Greater-than sign.",
  },
  "greater-than-circle": {
    labels: ["greater", "than", "circle"],
    description: "Greater-than sign in the secondary tone inside a circle.",
  },
  "greater-than-or-equal": {
    labels: ["greater", "than", "or"],
    description: "Greater-than-or-equal sign: the angle over a bar.",
  },
  "greater-than-square": {
    labels: ["greater", "than", "square"],
    description: "Greater-than sign in the secondary tone inside a rounded square.",
  },
  "greek-helmet": {
    labels: ["greek", "helmet"],
    description:
      "Corinthian helmet: a solid helmet with a T-shaped opening, its crest in the secondary tone.",
  },
  "grid2x2-check": {
    labels: ["grid2x2", "check"],
    description:
      "Three squares of a two-by-two grid, a check in the secondary tone in place of the fourth.",
  },
  "grid2x2-plus": {
    labels: ["grid2x2", "plus"],
    description:
      "Three squares of a two-by-two grid, a plus in the secondary tone in place of the fourth.",
  },
  grid3x2: {
    labels: ["grid3x2"],
    description: "Grid of three columns and two rows.",
  },
  "gymnastic-rings": {
    labels: ["gymnastic", "rings"],
    description: "Gymnastic rings: two rings hanging from two straps.",
  },
  "hamburger-01": {
    labels: ["hamburger"],
    description: "Hamburger: a domed bun, a patty in the secondary tone and a bottom bun.",
  },
  "hand-sanitizer": {
    labels: ["hand", "sanitizer"],
    description: "Hand sanitizer: a pump bottle with a drop in the secondary tone.",
  },
  "hanging-clock": {
    labels: ["hanging", "clock"],
    description: "Wall clock hanging from a nail, its hands in the secondary tone.",
  },
  "hard-drive-download": {
    labels: ["hard", "drive", "download"],
    description: "Hard drive with a downward arrow in the secondary tone above it.",
  },
  "hard-drive-upload": {
    labels: ["hard", "drive", "upload"],
    description: "Hard drive with an upward arrow in the secondary tone above it.",
  },
  "hdr-01": {
    labels: ["hdr"],
    description: "HDR: the letters H, D and R.",
  },
  heading4: {
    labels: ["heading4"],
    description: "Heading 4: an H with a 4 in the secondary tone.",
  },
  "headphone-off": {
    labels: ["headphone", "off"],
    description: "Headphones off: headphones crossed by a slash in the secondary tone.",
  },
  "hierarchy-circle-01": {
    labels: ["hierarchy", "circle"],
    description: "Hierarchy: a round node linked to two round nodes in the secondary tone.",
  },
  "hierarchy-square-01": {
    labels: ["hierarchy", "square"],
    description: "Hierarchy: a square node linked to two square nodes in the secondary tone.",
  },
  "high-heels-01": {
    labels: ["high", "heels"],
    description: "High-heeled shoe seen from the side, on a stiletto heel.",
  },
  "honey-01": {
    labels: ["honey"],
    description: "Honey jar: a lidded jar filled with honey in the secondary tone.",
  },
  "horizonal-scroll-point": {
    labels: ["horizonal", "scroll", "point"],
    description:
      "Horizontal scroll: two solid arrowheads pointing left and right around a dot in the secondary tone.",
  },
  "horizontal-resize": {
    labels: ["horizontal", "resize"],
    description:
      "Horizontal resize: a divider in the secondary tone with arrows pointing outwards.",
  },
  "hospital-location": {
    labels: ["hospital", "location"],
    description: "Hospital location: a map pin with a cross in the secondary tone.",
  },
  "hot-air-balloon": {
    labels: ["hot", "air", "balloon"],
    description:
      "Hot-air balloon: a round envelope with ropes down to a basket in the secondary tone.",
  },
  "ice-cream-bowl": {
    labels: ["ice", "cream", "bowl"],
    description: "Ice cream sundae: a scoop in the secondary tone in a footed bowl.",
  },
  "ice-cream-cone": {
    labels: ["ice", "cream", "cone"],
    description: "Ice cream: a round scoop on a cone.",
  },
  "ice-skating": {
    labels: ["ice", "skating"],
    description: "Ice skate: a boot on a blade in the secondary tone.",
  },
  "id-not-verified": {
    labels: ["id", "not", "verified"],
    description: "ID card with a cross in the secondary tone: the identity is not verified.",
  },
  "gamepad-directional-fill": {
    reference:
      "Filled variant of our own `gamepad-directional`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "gamepad"],
    description:
      "Filled: directional pad: a cross-shaped outline with the centre in the secondary tone.",
  },
  "hand-sanitizer-fill": {
    reference:
      "Filled variant of our own `hand-sanitizer`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "hand"],
    description: "Filled: hand sanitizer: a pump bottle with a drop in the secondary tone.",
  },
  "hospital-location-fill": {
    reference:
      "Filled variant of our own `hospital-location`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "hospital"],
    description: "Filled: hospital location: a map pin with a cross in the secondary tone.",
  },
  "hot-air-balloon-fill": {
    reference:
      "Filled variant of our own `hot-air-balloon`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "hot"],
    description:
      "Filled: hot-air balloon: a round envelope with ropes down to a basket in the secondary tone.",
  },
  "ice-cream-cone-fill": {
    reference:
      "Filled variant of our own `ice-cream-cone`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "ice"],
    description: "Filled: ice cream: a round scoop on a cone.",
  },
  "image-upscale": {
    labels: ["image", "upscale"],
    description: "Upscale: a small picture with an arrow to the far corner in the secondary tone.",
  },
  "inbox-unread": {
    labels: ["inbox", "unread"],
    description:
      "Inbox tray of `inbox` with an unread dot in the secondary tone, its corner cut back.",
  },
  "inequality-01": {
    labels: ["inequality"],
    description:
      "Inequality: a slanted stroke meeting a flat one at a point on the left, over a base line.",
  },
  "infinity-circle": {
    labels: ["infinity", "circle"],
    description: "Infinity in the secondary tone inside the full-grid ring of `circle`.",
  },
  "infinity-square": {
    labels: ["infinity", "square"],
    description: "Infinity in the secondary tone inside the rounded box of `square`.",
  },
  "inspection-panel": {
    labels: ["inspection", "panel"],
    description:
      "Inspection panel: the rounded box of `square` with a screw in each corner in the secondary tone.",
  },
  "installing-updates-01": {
    labels: ["installing", "updates"],
    description: "Installing updates: a gear in the secondary tone above an open tray.",
  },
  "iteration-ccw": {
    labels: ["iteration", "ccw"],
    description: "Counter-clockwise iteration: `iteration-cw` mirrored, the arrow pointing right.",
  },
  "iteration-cw": {
    labels: ["iteration", "cw"],
    description:
      "Clockwise iteration: a loop running over the top and back along the bottom to an arrow pointing left.",
  },
  "jogger-pants": {
    labels: ["jogger", "pants"],
    description: "Jogger pants: a waistband, two legs tapering to cuffs in the secondary tone.",
  },
  "join-straight": {
    labels: ["join", "straight"],
    description:
      "Straight join: the L outline of `join-bevel` with a square outer corner in the secondary tone.",
  },
  "jpg-01": {
    labels: ["jpg"],
    description: "JPG: the three letters J, P and G.",
  },
  "jsx-01": {
    labels: ["jsx"],
    description: "JSX: the three letters J, S and X.",
  },
  "key-generator-fob": {
    labels: ["key", "generator", "fob"],
    description:
      "Key fob: a remote with a button, its blade below and a signal arc in the secondary tone.",
  },
  "kitchen-utensils": {
    labels: ["kitchen", "utensils"],
    description: "Kitchen utensils: a fork, a spoon and a knife side by side.",
  },
  "knight-shield": {
    labels: ["knight", "shield"],
    description:
      "Knight shield: the shield of `shield-01` crossed by a heraldic bend in the secondary tone.",
  },
  "kurta-01": {
    labels: ["kurta"],
    description:
      "Kurta: a long tunic with long sleeves, after the collar and shoulders of `shirt-01`.",
  },
  "label-important": {
    labels: ["label", "important"],
    description: "Important label: a tag with a notched tail pointing right.",
  },
  "language-circle": {
    labels: ["language", "circle"],
    description:
      "Language: a letter A in the secondary tone inside the full-grid ring of `circle`.",
  },
  "language-square": {
    labels: ["language", "square"],
    description: "Language: a letter A in the secondary tone inside the rounded box of `square`.",
  },
  "laurel-wreath-01": {
    labels: ["laurel", "wreath"],
    description: "Laurel wreath: two leafy branches curving up from a crossed base.",
  },
  "laurel-wreath-first-01": {
    labels: ["laurel", "wreath", "first"],
    description: "First place: the wreath of `laurel-wreath-01` round a 1 in the secondary tone.",
  },
  "laurel-wreath-left-01": {
    labels: ["laurel", "wreath", "left"],
    description: "Left branch of `laurel-wreath-01`, centred on the grid.",
  },
  "laurel-wreath-right-01": {
    labels: ["laurel", "wreath", "right"],
    description: "Right branch of `laurel-wreath-01`, centred on the grid.",
  },
  "leaving-geo-fence": {
    labels: ["leaving", "geo", "fence"],
    description:
      "Leaving a geofence: an arrow in the secondary tone rising out of a ring on the ground.",
  },
  "left-to-right-list-dash": {
    labels: ["left", "to", "right"],
    description:
      "Dash list: a dash in the secondary tone beside a long and a short line, laid out like `left-to-right-list-number`.",
  },
  "left-to-right-list-star": {
    labels: ["left", "to", "right"],
    description:
      "Star list: a small star in the secondary tone beside a long and a short line, laid out like `left-to-right-list-number`.",
  },
  "left-to-right-list-triangle": {
    labels: ["left", "to", "right"],
    description:
      "Triangle list: a small triangle in the secondary tone beside a long and a short line, laid out like `left-to-right-list-number`.",
  },
  "left-triangle": {
    labels: ["left", "triangle"],
    description:
      "Right triangle with its right angle at the lower right, marked in the secondary tone.",
  },
  "legal-hammer": {
    labels: ["legal", "hammer"],
    description: "Gavel: a tilted head on a handle, over a sound block.",
  },
  "lens-concave": {
    labels: ["lens", "concave"],
    description: "Concave lens: flat ends and sides curving in to a narrow waist.",
  },
  "less-than-circle": {
    labels: ["less", "than", "circle"],
    description:
      "Less-than of `less-than` in the secondary tone inside the full-grid ring of `circle`.",
  },
  "less-than-or-equal": {
    labels: ["less", "than", "or"],
    description: "Less than or equal: the angle of `less-than` over a bar in the secondary tone.",
  },
  "less-than-square": {
    labels: ["less", "than", "square"],
    description:
      "Less-than of `less-than` in the secondary tone inside the rounded box of `square`.",
  },
  "letter-spacing": {
    labels: ["letter", "spacing"],
    description: "Letter spacing: a letter A between two bars in the secondary tone.",
  },
  "label-important-fill": {
    reference:
      "Filled variant of our own `label-important`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "label"],
    description: "Filled: important label: a tag with a notched tail pointing right.",
  },
  "license-third-party": {
    labels: ["license", "third", "party"],
    description:
      "Licence document with two text lines and a person badge in the secondary tone (someone else's licence).",
  },
  "lightbulb-off": {
    labels: ["lightbulb", "off"],
    description: "Light bulb with no filament, crossed by a slash in the secondary tone.",
  },
  "line-dot-right-horizontal": {
    labels: ["line", "dot", "right"],
    description:
      "Horizontal line ending in a round dot on the right, the dot in the secondary tone.",
  },
  "line-squiggle": {
    labels: ["line", "squiggle"],
    description: "A squiggly line: a smooth wave across the grid.",
  },
  "link-backward": {
    labels: ["link", "backward"],
    description:
      "Link bracket on the right with an arrow pointing back to the left in the secondary tone.",
  },
  "loader-circle": {
    labels: ["loader", "circle"],
    description: "Loading spinner: three quarters of a ring, open at the top right.",
  },
  "lock-sync-02": {
    labels: ["lock", "sync"],
    description: "Padlock with two circling arrows in the secondary tone (lock being synced).",
  },
  "login-circle-01": {
    labels: ["login", "circle"],
    description:
      "Ring open on the left with an arrow entering it from the left in the secondary tone.",
  },
  "logout-circle-01": {
    labels: ["logout", "circle"],
    description:
      "Ring open on the right with an arrow leaving it to the right in the secondary tone.",
  },
  "long-sleeve-shirt": {
    labels: ["long", "sleeve", "shirt"],
    description: "Shirt with a round neck and long sleeves down to the hem.",
  },
  "loyalty-card": {
    labels: ["loyalty", "card"],
    description: "Card with a heart in the secondary tone (loyalty card).",
  },
  "mail-at-sign-02": {
    labels: ["mail", "at", "sign"],
    description: "Envelope with an at-sign badge in the secondary tone.",
  },
  "mail-voice-01": {
    labels: ["mail", "voice"],
    description: "Envelope with a sound-wave badge in the secondary tone (voice message).",
  },
  "mail-warning": {
    labels: ["mail", "warning"],
    description: "Envelope with an exclamation mark in the secondary tone.",
  },
  "map-pin-x": {
    labels: ["map", "pin", "x"],
    description: "The shared map pin with a cross badge in the secondary tone.",
  },
  "maps-editing": {
    labels: ["maps", "editing"],
    description: "Folded map with a pencil badge in the secondary tone.",
  },
  "maps-global-01": {
    labels: ["maps", "global"],
    description: "Folded map with a small globe badge in the secondary tone.",
  },
  "maps-refresh": {
    labels: ["maps", "refresh"],
    description: "Folded map with two circling arrows in the secondary tone.",
  },
  "market-analysis": {
    labels: ["market", "analysis"],
    description:
      "Chart axes with a dipping then rising line and a magnifier badge in the secondary tone.",
  },
  "mask-theater-01": {
    labels: ["mask", "theater"],
    description: "Theatre mask: wide brow, two eye holes and a smile in the secondary tone.",
  },
  "material-and-texture": {
    labels: ["material", "and", "texture"],
    description: "Square sample with diagonal texture lines in the secondary tone.",
  },
  "maximize-screen": {
    labels: ["maximize", "screen"],
    description: "Screen on a stand with four corners pointing outwards in the secondary tone.",
  },
  "medical-mask": {
    labels: ["medical", "mask"],
    description: "Surgical face mask with pleats in the secondary tone and ear loops.",
  },
  "megaphone-off": {
    labels: ["megaphone", "off"],
    description: "Megaphone crossed by a slash in the secondary tone.",
  },
  "menu-two-line": {
    labels: ["menu", "two", "line"],
    description: "Menu with two horizontal lines.",
  },
  "message-square-code": {
    labels: ["message", "square", "code"],
    description: "Square speech bubble with code brackets inside in the secondary tone.",
  },
  "message-square-dashed": {
    labels: ["message", "square", "dashed"],
    description: "Square speech bubble drawn with a dashed outline.",
  },
  "message-square-heart": {
    labels: ["message", "square", "heart"],
    description: "Square speech bubble with a heart inside in the secondary tone.",
  },
  "message-square-off": {
    labels: ["message", "square", "off"],
    description: "Square speech bubble crossed by a slash in the secondary tone.",
  },
  "message-square-reply": {
    labels: ["message", "square", "reply"],
    description: "Square speech bubble with a reply arrow inside in the secondary tone.",
  },
  "message-square-share": {
    labels: ["message", "square", "share"],
    description: "Square speech bubble with an arrow pointing up and out in the secondary tone.",
  },
  "message-square-warning": {
    labels: ["message", "square", "warning"],
    description: "Square speech bubble with an exclamation mark in the secondary tone.",
  },
  "message-square-x": {
    labels: ["message", "square", "x"],
    description: "Square speech bubble with a cross inside in the secondary tone.",
  },
  "messages-square": {
    labels: ["messages", "square"],
    description:
      "Two square speech bubbles, the front one at the top left, the other behind it at the bottom right.",
  },
  "minimize-screen": {
    labels: ["minimize", "screen"],
    description: "Screen on a stand with four corners pointing inwards in the secondary tone.",
  },
  "minus-plus-circle-01": {
    labels: ["minus", "plus", "circle"],
    description:
      "Ring with a plus at the top left and a minus at the bottom right in the secondary tone.",
  },
  "minus-plus-square-01": {
    labels: ["minus", "plus", "square"],
    description:
      "Square with a plus at the top left and a minus at the bottom right in the secondary tone.",
  },
  "mirror-rectangular": {
    labels: ["mirror", "rectangular"],
    description: "Tall rectangular wall mirror with a diagonal glint in the secondary tone.",
  },
  "modern-tv-4-k": {
    labels: ["modern", "tv", "k"],
    description: "Flat screen on a stand with 4K written on it in the secondary tone.",
  },
  "modern-tv-issue": {
    labels: ["modern", "tv", "issue"],
    description: "Flat screen on a stand with an exclamation mark in the secondary tone.",
  },
  "long-sleeve-shirt-fill": {
    reference:
      "Filled variant of our own `long-sleeve-shirt`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "long"],
    description: "Filled: shirt with a round neck and long sleeves down to the hem.",
  },
  "loyalty-card-fill": {
    reference:
      "Filled variant of our own `loyalty-card`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "loyalty"],
    description: "Filled: card with a heart in the secondary tone (loyalty card).",
  },
  "message-square-heart-fill": {
    reference:
      "Filled variant of our own `message-square-heart`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "message"],
    description: "Filled: square speech bubble with a heart inside in the secondary tone.",
  },
  "message-square-x-fill": {
    reference:
      "Filled variant of our own `message-square-x`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "message"],
    description: "Filled: square speech bubble with a cross inside in the secondary tone.",
  },
  "money-send-flow-01": {
    labels: ["money", "send", "flow"],
    description: "Banknote with an arrow flowing down and out to the right, in the secondary tone.",
  },
  "moon-eclipse": {
    labels: ["moon", "eclipse"],
    description: "Sun disc with the moon passing over it, in the secondary tone.",
  },
  "moon-fast-wind": {
    labels: ["moon", "fast", "wind"],
    description: "Crescent moon over two long wind lines, in the secondary tone.",
  },
  "moon-landing": {
    labels: ["moon", "landing"],
    description: "Lunar lander standing on its legs on the ground, in the secondary tone.",
  },
  "more-horizontal-square-02": {
    labels: ["more", "horizontal", "square"],
    description: "Rounded square with three dots in a row, in the secondary tone.",
  },
  "more-vertical-square-02": {
    labels: ["more", "vertical", "square"],
    description: "Rounded square with three dots in a column, in the secondary tone.",
  },
  "motion-01": {
    labels: ["motion"],
    description: "Ball moving to the right with two speed lines behind it, in the secondary tone.",
  },
  "move-vertical": {
    labels: ["move", "vertical"],
    description: "Vertical line with an arrowhead at each end.",
  },
  "n-th-root": {
    labels: ["n", "th", "root"],
    description: "Radical sign with a small index n, in the secondary tone.",
  },
  "natural-food": {
    labels: ["natural", "food"],
    description: "Apple with its stem and a leaf, in the secondary tone.",
  },
  "navigation-2-off": {
    labels: ["navigation", "off"],
    description: "Upward navigation arrowhead crossed out, the stroke in the secondary tone.",
  },
  "navigation-off": {
    labels: ["navigation", "off"],
    description: "Solid navigation arrow crossed out, the stroke in the secondary tone.",
  },
  "neural-network": {
    labels: ["neural", "network"],
    description: "Four nodes linked through a central node, the hub in the secondary tone.",
  },
  "not-equal-sign-circle": {
    labels: ["not", "equal", "sign"],
    description: "Circle with a crossed-out equals sign, in the secondary tone.",
  },
  "not-equal-sign-square": {
    labels: ["not", "equal", "sign"],
    description: "Rounded square with a crossed-out equals sign, in the secondary tone.",
  },
  "notebook-tabs": {
    labels: ["notebook", "tabs"],
    description: "Ring-bound notebook with index tabs on its edge, in the secondary tone.",
  },
  "notebook-text": {
    labels: ["notebook", "text"],
    description: "Ring-bound notebook with three lines of text, in the secondary tone.",
  },
  "notepad-text": {
    labels: ["notepad", "text"],
    description: "Notepad bound at the top with three lines of text, in the secondary tone.",
  },
  "notepad-text-dashed": {
    labels: ["notepad", "text", "dashed"],
    description: "Notepad with a dashed outline and three lines of text, in the secondary tone.",
  },
  "octagon-alert": {
    labels: ["octagon", "alert"],
    description: "Octagon with an exclamation mark, in the secondary tone.",
  },
  "octagon-minus": {
    labels: ["octagon", "minus"],
    description: "Octagon with a minus sign, in the secondary tone.",
  },
  "octagon-pause": {
    labels: ["octagon", "pause"],
    description: "Octagon with two pause bars, in the secondary tone.",
  },
  "office-chair": {
    labels: ["office", "chair"],
    description: "Office chair seen from the side: backrest, seat, column and wheeled base.",
  },
  "olympic-torch": {
    labels: ["olympic", "torch"],
    description: "Torch with a flame in the secondary tone.",
  },
  "orbit-01": {
    labels: ["orbit"],
    description: "Planet with a satellite on its orbit, the satellite in the secondary tone.",
  },
  "organic-food": {
    labels: ["organic", "food"],
    description: "Bowl with a two-leaf sprout growing from it, in the secondary tone.",
  },
  "orientation-landscape-to-potrait": {
    labels: ["orientation", "landscape", "to"],
    description: "Landscape screen turning into a portrait one, the arrow in the secondary tone.",
  },
  "orientation-potrait-to-landscape": {
    labels: ["orientation", "potrait", "to"],
    description: "Portrait screen turning into a landscape one, the arrow in the secondary tone.",
  },
  "paint-roller": {
    labels: ["paint", "roller"],
    description:
      "Paint roller with its bent handle, the paint on the roller in the secondary tone.",
  },
  "pan-02": {
    labels: ["pan"],
    description: "Frying pan seen from above with its handle to the right.",
  },
  "panel-top-bottom-dashed": {
    labels: ["panel", "top", "bottom"],
    description: "Window with dashed lines marking a top and a bottom panel.",
  },
  "panel-top-close": {
    labels: ["panel", "top", "close"],
    description: "Window with a top panel and an up chevron to close it.",
  },
  "panel-top-dashed": {
    labels: ["panel", "top", "dashed"],
    description: "Window with a dashed line marking a top panel.",
  },
  "panel-top-open": {
    labels: ["panel", "top", "open"],
    description: "Window with a top panel and a down chevron to open it.",
  },
  "panels-left-bottom": {
    labels: ["panels", "left", "bottom"],
    description: "Window split into a left panel and a bottom panel.",
  },
  "panels-right-bottom": {
    labels: ["panels", "right", "bottom"],
    description: "Window split into a right panel and a bottom panel.",
  },
  "panels-top-left": {
    labels: ["panels", "top", "left"],
    description: "Window split into a top panel and a left panel.",
  },
  "parabola-01": {
    labels: ["parabola"],
    description: "Parabola in the secondary tone over two axes.",
  },
  "more-horizontal-square-02-fill": {
    reference:
      "Filled variant of our own `more-horizontal-square-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "more"],
    description: "Filled: rounded square with three dots in a row, in the secondary tone.",
  },
  "more-vertical-square-02-fill": {
    reference:
      "Filled variant of our own `more-vertical-square-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "more"],
    description: "Filled: rounded square with three dots in a column, in the secondary tone.",
  },
  "natural-food-fill": {
    reference:
      "Filled variant of our own `natural-food`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "natural"],
    description: "Filled: apple with its stem and a leaf, in the secondary tone.",
  },
  "octagon-alert-fill": {
    reference:
      "Filled variant of our own `octagon-alert`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "octagon"],
    description: "Filled: octagon with an exclamation mark, in the secondary tone.",
  },
  "octagon-minus-fill": {
    reference:
      "Filled variant of our own `octagon-minus`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "octagon"],
    description: "Filled: octagon with a minus sign, in the secondary tone.",
  },
  "octagon-pause-fill": {
    reference:
      "Filled variant of our own `octagon-pause`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "octagon"],
    description: "Filled: octagon with two pause bars, in the secondary tone.",
  },
  "paragraph-spacing": {
    labels: ["paragraph", "spacing"],
    description:
      "Paragraph spacing: two pairs of text lines, a double arrow beside them in the secondary tone.",
  },
  "parking-meter": {
    labels: ["parking", "meter"],
    description:
      "Parking meter: a rounded head with a display window in the secondary tone and a coin slot, on a post.",
  },
  "party-popper": {
    labels: ["party", "popper"],
    description:
      "Party popper: a cone pointing down-left, confetti bursting from its mouth in the secondary tone.",
  },
  "passport-expired": {
    labels: ["passport", "expired"],
    description:
      "Passport with a cross badge: `passport` one column left, the globe in the primary tone, the cross in the secondary tone.",
  },
  "passport-valid": {
    labels: ["passport", "valid"],
    description:
      "Passport with a check badge: `passport` one column left, the globe in the primary tone, the check in the secondary tone.",
  },
  "pathfinder-crop": {
    labels: ["pathfinder", "crop"],
    description:
      "Pathfinder crop: the front square as a crop frame, the overlap kept, the frame dotted.",
  },
  "pathfinder-divide": {
    labels: ["pathfinder", "divide"],
    description:
      "Pathfinder divide: two overlapping squares split into pieces along every edge, the middle piece in the secondary tone.",
  },
  "pathfinder-exclude": {
    labels: ["pathfinder", "exclude"],
    description:
      "Pathfinder exclude: two overlapping squares, every edge kept so the overlap reads as a hole.",
  },
  "pathfinder-intersect": {
    labels: ["pathfinder", "intersect"],
    description: "Pathfinder intersect: only the overlap of two squares kept, the rest dotted.",
  },
  "pathfinder-merge": {
    labels: ["pathfinder", "merge"],
    description:
      "Pathfinder merge: one merged outline, the front square's seam inside it in the secondary tone.",
  },
  "pathfinder-minus-back": {
    labels: ["pathfinder", "minus", "back"],
    description:
      "Pathfinder minus back: the front square with the back one cut away, the back shown dotted.",
  },
  "pathfinder-minus-front": {
    labels: ["pathfinder", "minus", "front"],
    description:
      "Pathfinder minus front: the back square with the front one cut away, the front shown dotted.",
  },
  "pathfinder-trim": {
    labels: ["pathfinder", "trim"],
    description:
      "Pathfinder trim: the front square whole, the back one trimmed where it hides, its hidden part dotted.",
  },
  "pathfinder-unite": {
    labels: ["pathfinder", "unite"],
    description: "Pathfinder unite: two overlapping squares merged into one outline.",
  },
  "pay-by-check": {
    labels: ["pay", "by", "check"],
    description:
      "Cheque: a long slip with an amount line and the signature line in the secondary tone.",
  },
  "payment-success-01": {
    labels: ["payment", "success"],
    description:
      "Card with a check badge: `credit-card` cut for the badge, the stripe in the primary tone, the check in the secondary tone.",
  },
  "pdf-02": {
    labels: ["pdf"],
    description:
      "PDF file: the top of `file-01` over the letters P, D and F in the secondary tone.",
  },
  "peer-to-peer-01": {
    labels: ["peer", "to"],
    description:
      "Peer to peer: two screens side by side, a two-way arrow between them in the secondary tone.",
  },
  "pen-02": {
    labels: ["pen"],
    description: "Pen: a ballpoint pen on a 1:1 diagonal, as in `pen-line` without the line.",
  },
  "permanent-job": {
    labels: ["permanent", "job"],
    description:
      "Briefcase with a check badge: `briefcase-01` cut for the badge, the clasp moved up, the check in the secondary tone.",
  },
  "person-standing": {
    labels: ["person", "standing"],
    description:
      "Person standing: the head of `walking` over a straight body, arms out, legs apart.",
  },
  "philippine-peso": {
    labels: ["philippine", "peso"],
    description:
      "Philippine peso: a P with two horizontal bars across it, two-pixel strokes like `pound`.",
  },
  "picture-in-picture": {
    labels: ["picture", "in"],
    description:
      "Picture in picture: a wide frame with a small solid picture in its lower right in the secondary tone.",
  },
  "picture-in-picture-exit": {
    labels: ["picture", "in", "exit"],
    description:
      "Picture in picture exit: a frame with a small inner frame, an arrow leaving it in the secondary tone.",
  },
  "picture-in-picture-on": {
    labels: ["picture", "in", "on"],
    description:
      "Picture in picture on: a frame with a small inner frame, an arrow going into it in the secondary tone.",
  },
  "pie-chart-square": {
    labels: ["pie", "chart", "square"],
    description:
      "Pie chart in a square: `square` with its top-right quarter filled in the secondary tone.",
  },
  "pilcrow-left": {
    labels: ["pilcrow", "left"],
    description: "Pilcrow with an arrow pointing left underneath, in the secondary tone.",
  },
  "pilcrow-right": {
    labels: ["pilcrow", "right"],
    description: "Pilcrow with an arrow pointing right underneath, in the secondary tone.",
  },
  "pizza-01": {
    labels: ["pizza"],
    description:
      "Pizza slice: a crust across the top, the slice narrowing to a point, one topping in the secondary tone.",
  },
  "pizza-cutter": {
    labels: ["pizza", "cutter"],
    description:
      "Pizza cutter: a wheel with its axle in the secondary tone, a handle rising from the axle.",
  },
  "plus-minus-square-01": {
    labels: ["plus", "minus", "square"],
    description:
      "Plus-minus in a square: `square` with `plus-minus` drawn small inside in the secondary tone.",
  },
  "png-01": {
    labels: ["png"],
    description:
      "PNG file: the top of `file-01` over the letters P, N and G in the secondary tone.",
  },
  "police-badge": {
    labels: ["police", "badge"],
    description: "Police badge: `shield-01` with a star inside in the secondary tone.",
  },
  "police-station": {
    labels: ["police", "station"],
    description: "Police station: `building-01` with a beacon on its roof in the secondary tone.",
  },
  "pound-receive": {
    labels: ["pound", "receive"],
    description:
      "Pound received: `pound-send` with its arrow turned to point in, in the secondary tone.",
  },
  "ppt-01": {
    labels: ["ppt"],
    description:
      "PPT file: the top of `file-01` over the letters P, P and T in the secondary tone.",
  },
  "presentation-bar-chart-01": {
    labels: ["presentation", "bar", "chart"],
    description:
      "Presentation with a bar chart: `presentation-01` with three rising bars in the secondary tone.",
  },
  "presentation-line-chart-01": {
    labels: ["presentation", "line", "chart"],
    description:
      "Presentation with a line chart: `presentation-01` with a zigzag line in the secondary tone.",
  },
  "presentation-online": {
    labels: ["presentation", "online"],
    description:
      "Online presentation: `presentation-01` with a play triangle in the secondary tone.",
  },
  "programming-flag": {
    labels: ["programming", "flag"],
    description: "Programming flag: `flag-01` widened, with angle brackets in the secondary tone.",
  },
  "progress-01": {
    labels: ["progress"],
    description:
      "Progress: a ring, its right half drawn solid in the secondary tone, the left half still dotted.",
  },
  "protection-mask": {
    labels: ["protection", "mask"],
    description:
      "Face mask: a pleated mask with ear loops on both sides, one pleat in the secondary tone.",
  },
  "qr-code-scan": {
    labels: ["qr", "code", "scan"],
    description:
      "QR code scan: the corners of `scan` around a small QR code in the secondary tone.",
  },
  "quill-write-01": {
    labels: ["quill", "write"],
    description: "Quill writing: `feather` over a written line in the primary tone.",
  },
  "quiz-02": {
    labels: ["quiz"],
    description: "Quiz: `clipboard` with a question mark in the secondary tone.",
  },
  "rain-double-drop": {
    labels: ["rain", "double", "drop"],
    description: "Two raindrops, one high on the left and one low on the right.",
  },
  "parking-meter-fill": {
    reference:
      "Filled variant of our own `parking-meter`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "parking"],
    description:
      "Filled: parking meter: a rounded head with a display window in the secondary tone and a coin slot, on a post.",
  },
  "pathfinder-unite-fill": {
    reference:
      "Filled variant of our own `pathfinder-unite`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pathfinder"],
    description: "Filled: pathfinder unite: two overlapping squares merged into one outline.",
  },
  "pie-chart-square-fill": {
    reference:
      "Filled variant of our own `pie-chart-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pie"],
    description:
      "Filled: pie chart in a square: `square` with its top-right quarter filled in the secondary tone.",
  },
  "pizza-01-fill": {
    reference: "Filled variant of our own `pizza-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pizza"],
    description:
      "Filled: pizza slice: a crust across the top, the slice narrowing to a point, one topping in the secondary tone.",
  },
  "police-badge-fill": {
    reference:
      "Filled variant of our own `police-badge`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "police"],
    description: "Filled: police badge: `shield-01` with a star inside in the secondary tone.",
  },
  "programming-flag-fill": {
    reference:
      "Filled variant of our own `programming-flag`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "programming"],
    description:
      "Filled: programming flag: `flag-01` widened, with angle brackets in the secondary tone.",
  },
  "quiz-02-fill": {
    reference: "Filled variant of our own `quiz-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "quiz"],
    description: "Filled: quiz: `clipboard` with a question mark in the secondary tone.",
  },
  "rain-double-drop-fill": {
    reference:
      "Filled variant of our own `rain-double-drop`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rain"],
    description: "Filled: two raindrops, one high on the left and one low on the right.",
  },
  "real-estate-01": {
    labels: ["real", "estate"],
    description: "Real estate: a tall building with a small house leaning on it.",
  },
  "recovery-mail": {
    labels: ["recovery", "mail"],
    description:
      "Recovery mail: the envelope of mail-add-01 with a circular arrow badge in the secondary tone.",
  },
  "reduce-paragraph": {
    labels: ["reduce", "paragraph"],
    description:
      "Reduce paragraph: two lines with arrows pointing in towards them, expand-paragraph reversed.",
  },
  "refresh-cw-off": {
    labels: ["refresh", "cw", "off"],
    description:
      "Refresh struck through: the refresh arrows with a diagonal slash in the secondary tone.",
  },
  "relieved-01": {
    labels: ["relieved"],
    description: "Relieved face: the smile face with closed eyes drawn as short lines.",
  },
  "remote-control": {
    labels: ["remote", "control"],
    description:
      "Remote control: a tall narrow body, a big button on top in the secondary tone and two rows of keys.",
  },
  "renewable-energy": {
    labels: ["renewable", "energy"],
    description:
      "Renewable energy: a wind turbine, three blades around a hub in the secondary tone, on a mast.",
  },
  "repeat-one-01": {
    labels: ["repeat", "one"],
    description: "Repeat once: the repeat loop with a small 1 inside in the secondary tone.",
  },
  "reset-password": {
    labels: ["reset", "password"],
    description:
      "Reset password: a password field of dots, its corner cut by a circular arrow badge in the secondary tone.",
  },
  "restaurant-01": {
    labels: ["restaurant"],
    description: "Restaurant: a fork and a knife side by side.",
  },
  "return-request": {
    labels: ["return", "request"],
    description: "Return request: a document with the back arrow of mail-reply-01 as a badge.",
  },
  "reverse-withdrawal-01": {
    labels: ["reverse", "withdrawal"],
    description:
      "Reverse withdrawal: the banknote of money-add-01 under a U-turn arrow in the secondary tone.",
  },
  "rice-bowl-01": {
    labels: ["rice", "bowl"],
    description:
      "Rice bowl: the bowl of ice-cream-bowl, a mound of rice in the secondary tone and a pair of chopsticks.",
  },
  "right-to-left-block-quote": {
    labels: ["right", "to", "left"],
    description:
      "Right-to-left block quote: the quote bar on the right, lines of text to its left.",
  },
  "right-to-left-list-bullet": {
    labels: ["right", "to", "left"],
    description: "Right-to-left bulleted list: list-view mirrored, bullets on the right.",
  },
  "right-to-left-list-dash": {
    labels: ["right", "to", "left"],
    description: "Right-to-left list with dashes: lines on the left, a dash at the right of each.",
  },
  "right-to-left-list-number": {
    labels: ["right", "to", "left"],
    description:
      "Right-to-left numbered list: lines on the left, the numbers 1 and 2 on the right.",
  },
  "right-to-left-list-triangle": {
    labels: ["right", "to", "left"],
    description:
      "Right-to-left list with triangles: lines on the left, a triangle bullet pointing left on the right.",
  },
  "right-triangle": {
    labels: ["right", "triangle"],
    description:
      "Right triangle: a one-pixel triangle with its right angle bottom left, marked in the secondary tone.",
  },
  "roller-skate": {
    labels: ["roller", "skate"],
    description: "Roller skate: the sneaker profile on two wheels in the secondary tone.",
  },
  "rotate-top-right": {
    labels: ["rotate", "top", "right"],
    description: "Rotate towards the top right: rotate-top-left mirrored.",
  },
  rows3: {
    labels: ["rows3"],
    description: "Three rows: a box split in three equal horizontal bands, after rows-2.",
  },
  "ruler-dimension-line": {
    labels: ["ruler", "dimension", "line"],
    description:
      "Ruler under a dimension line: the ruler, and above it a measured span with end ticks in the secondary tone.",
  },
  "rupee-circle": {
    labels: ["rupee", "circle"],
    description:
      "Rupee in a circle: the dollar-circle ring with the rupee sign in the secondary tone.",
  },
  "rupee-shield": {
    labels: ["rupee", "shield"],
    description:
      "Rupee on a shield: the shield-01 outline with the rupee sign in the secondary tone.",
  },
  "rupee-square": {
    labels: ["rupee", "square"],
    description:
      "Rupee in a square: the euro-square frame with the rupee sign in the secondary tone.",
  },
  "russian-ruble": {
    labels: ["russian", "ruble"],
    description: "Russian ruble sign: a P with a bar across its stem.",
  },
  "sailboat-coastal": {
    labels: ["sailboat", "coastal"],
    description: "Coastal sailboat: the boat hull with two small sails, a sloop.",
  },
  "sailboat-offshore": {
    labels: ["sailboat", "offshore"],
    description: "Offshore sailboat: the boat of boat on a wave line in the secondary tone.",
  },
  "saturn-01": {
    labels: ["saturn"],
    description: "Saturn: a round planet crossed by its ring in the secondary tone.",
  },
  "scissor-rectangle": {
    labels: ["scissor", "rectangle"],
    description:
      "Cut-out: the dashed square of square-dashed, its corner taken by small scissors in the secondary tone.",
  },
  "scroll-01": {
    labels: ["scroll"],
    description:
      "Scroll: a sheet with a rolled edge at the top left and the bottom right, two lines of text.",
  },
  "scroll-vertical": {
    labels: ["scroll", "vertical"],
    description:
      "Vertical scroll: horizonal-scroll-point turned a quarter, arrows up and down around a dot.",
  },
  "remote-control-fill": {
    reference:
      "Filled variant of our own `remote-control`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "remote"],
    description:
      "Filled: remote control: a tall narrow body, a big button on top in the secondary tone and two rows of keys.",
  },
  "right-triangle-fill": {
    reference:
      "Filled variant of our own `right-triangle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "right"],
    description:
      "Filled: right triangle: a one-pixel triangle with its right angle bottom left, marked in the secondary tone.",
  },
  "roller-skate-fill": {
    reference:
      "Filled variant of our own `roller-skate`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "roller"],
    description: "Filled: roller skate: the sneaker profile on two wheels in the secondary tone.",
  },
  "rupee-circle-fill": {
    reference:
      "Filled variant of our own `rupee-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rupee"],
    description:
      "Filled: rupee in a circle: the dollar-circle ring with the rupee sign in the secondary tone.",
  },
  "rupee-shield-fill": {
    reference:
      "Filled variant of our own `rupee-shield`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rupee"],
    description:
      "Filled: rupee on a shield: the shield-01 outline with the rupee sign in the secondary tone.",
  },
  "rupee-square-fill": {
    reference:
      "Filled variant of our own `rupee-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rupee"],
    description:
      "Filled: rupee in a square: the euro-square frame with the rupee sign in the secondary tone.",
  },
  "seat-selector": {
    labels: ["seat", "selector"],
    description: "Seat: an armchair seen from the front.",
  },
  "secured-network": {
    labels: ["secured", "network"],
    description:
      "Secured network: a small shield above two linked nodes, the links of `network` in the secondary tone.",
  },
  "separator-horizontal": {
    labels: ["separator", "horizontal"],
    description:
      "A horizontal line in the secondary tone between two chevrons pointing away from it.",
  },
  "separator-vertical": {
    labels: ["separator", "vertical"],
    description:
      "A vertical line in the secondary tone between two chevrons pointing away from it.",
  },
  "setting-done-01": {
    labels: ["setting", "done"],
    description:
      "Cog of `settings-01` with a check in its hole in the secondary tone: settings applied.",
  },
  "settings-error-01": {
    labels: ["settings", "error"],
    description:
      "Cog of `settings-01` with a cross in its hole in the secondary tone: a settings error.",
  },
  "seven-circle": {
    labels: ["seven", "circle"],
    description: "The digit seven in the secondary tone in the ring of `nine-circle`.",
  },
  "seven-square": {
    labels: ["seven", "square"],
    description: "The digit seven in the secondary tone in the frame of `nine-square`.",
  },
  "shelving-unit": {
    labels: ["shelving", "unit"],
    description:
      "Shelving unit: two uprights and three shelves holding goods in the secondary tone.",
  },
  "shipping-loading": {
    labels: ["shipping", "loading"],
    description: "Loading a shipment: a parcel in the secondary tone in the box of `truck`.",
  },
  "simcard-dual": {
    labels: ["simcard", "dual"],
    description: "Two SIM cards, one behind the other, the chip of `simcard-01` on the front one.",
  },
  "sink-01": {
    labels: ["sink"],
    description: "Sink: a basin under a tap.",
  },
  "soil-moisture-field": {
    labels: ["soil", "moisture", "field"],
    description: "Soil moisture: a drop in the secondary tone over layers of soil.",
  },
  "soil-temperature-field": {
    labels: ["soil", "temperature", "field"],
    description:
      "Soil temperature: a thermometer with its mercury in the secondary tone over layers of soil.",
  },
  "solar-panel-01": {
    labels: ["solar", "panel"],
    description: "Solar panel: a grid of cells on two splayed legs.",
  },
  "solar-system": {
    labels: ["solar", "system"],
    description:
      "Solar system: a sun in the secondary tone inside an orbit carrying a solid planet.",
  },
  "solid-line-01": {
    labels: ["solid", "line"],
    description: "A solid two-pixel line across the grid: the solid line style.",
  },
  "speech-to-text": {
    labels: ["speech", "to", "text"],
    description: "Speech to text: a sound wave in the secondary tone beside lines of text.",
  },
  "spline-pointer": {
    labels: ["spline", "pointer"],
    description: "A spline from a handle to a pointer in the secondary tone.",
  },
  "spoon-and-fork": {
    labels: ["spoon", "and", "fork"],
    description: "A fork and a spoon side by side.",
  },
  "spoon-and-knife": {
    labels: ["spoon", "and", "knife"],
    description: "A spoon and a knife side by side.",
  },
  "square-arrow-move-down-left": {
    labels: ["square", "arrow", "move"],
    description: "An arrow going down then turning left, in the frame of `square`.",
  },
  "square-arrow-move-down-right": {
    labels: ["square", "arrow", "move"],
    description: "An arrow going down then turning right, in the frame of `square`.",
  },
  "square-arrow-move-left-down": {
    labels: ["square", "arrow", "move"],
    description: "An arrow going left then turning down, in the frame of `square`.",
  },
  "square-arrow-move-left-up": {
    labels: ["square", "arrow", "move"],
    description: "An arrow going left then turning up, in the frame of `square`.",
  },
  "square-arrow-move-right-down": {
    labels: ["square", "arrow", "move"],
    description: "An arrow going right then turning down, in the frame of `square`.",
  },
  "square-arrow-move-right-up": {
    labels: ["square", "arrow", "move"],
    description: "An arrow going right then turning up, in the frame of `square`.",
  },
  "square-arrow-out-down-left": {
    labels: ["square", "arrow", "out"],
    description:
      "A box open at its lower left and an arrow leaving it, `link-square-02` turned half round.",
  },
  "square-arrow-out-down-right": {
    labels: ["square", "arrow", "out"],
    description: "A box open at its lower right and an arrow leaving it, `link-square-02` flipped.",
  },
  "square-arrow-out-up-left": {
    labels: ["square", "arrow", "out"],
    description: "A box open at its upper left and an arrow leaving it, `link-square-02` mirrored.",
  },
  "square-arrow-reload-01": {
    labels: ["square", "arrow", "reload"],
    description: "A circular reload arrow in the secondary tone in the frame of `square`.",
  },
  "square-arrow-right-double": {
    labels: ["square", "arrow", "right"],
    description:
      "A double chevron pointing right in the frame of `square`, mirror of `square-arrow-left-double`.",
  },
  "square-arrow-right-enter": {
    labels: ["square", "arrow", "right"],
    description: "An arrow entering a box open on its left: enter, mirror of `logout-square-01`.",
  },
  "square-arrow-shrink-01": {
    labels: ["square", "arrow", "shrink"],
    description: "Two arrows pointing in to the centre in the frame of `square`: shrink.",
  },
  "square-arrow-up-double": {
    labels: ["square", "arrow", "up"],
    description:
      "A double chevron pointing up in the frame of `square`, mirror of `square-arrow-down-double`.",
  },
  "square-arrow-up-left": {
    labels: ["square", "arrow", "up"],
    description:
      "An arrow pointing up and left in the frame of `square`, mirror of `square-arrow-up-right`.",
  },
  "square-arrow-vertical": {
    labels: ["square", "arrow", "vertical"],
    description:
      "A two-headed vertical arrow in the frame of `square`, `square-arrow-horizontal` turned.",
  },
  "seven-circle-fill": {
    reference:
      "Filled variant of our own `seven-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "seven"],
    description: "Filled: the digit seven in the secondary tone in the ring of `nine-circle`.",
  },
  "seven-square-fill": {
    reference:
      "Filled variant of our own `seven-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "seven"],
    description: "Filled: the digit seven in the secondary tone in the frame of `nine-square`.",
  },
  "square-arrow-reload-01-fill": {
    reference:
      "Filled variant of our own `square-arrow-reload-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: a circular reload arrow in the secondary tone in the frame of `square`.",
  },
  "square-arrow-right-double-fill": {
    reference:
      "Filled variant of our own `square-arrow-right-double`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description:
      "Filled: a double chevron pointing right in the frame of `square`, mirror of `square-arrow-left-double`.",
  },
  "square-arrow-up-double-fill": {
    reference:
      "Filled variant of our own `square-arrow-up-double`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description:
      "Filled: a double chevron pointing up in the frame of `square`, mirror of `square-arrow-down-double`.",
  },
  "square-asterisk": {
    labels: ["square", "asterisk"],
    description: "An asterisk in the secondary tone in the frame of `square`.",
  },
  "square-centerline-dashed-vertical": {
    labels: ["square", "centerline", "dashed"],
    description: "A dashed vertical centre line in the secondary tone down the frame of `square`.",
  },
  "square-chart-gantt": {
    labels: ["square", "chart", "gantt"],
    description: "Three staggered Gantt bars in the secondary tone in the frame of `square`.",
  },
  "square-chevron-down": {
    labels: ["square", "chevron", "down"],
    description: "A down chevron in the frame of `square`, the chevron of `circle-chevron-down`.",
  },
  "square-chevron-left": {
    labels: ["square", "chevron", "left"],
    description: "A left chevron in the frame of `square`: `square-chevron-right` mirrored.",
  },
  "square-chevron-right": {
    labels: ["square", "chevron", "right"],
    description: "A right chevron in the frame of `square`: `square-chevron-down` turned.",
  },
  "square-chevron-up": {
    labels: ["square", "chevron", "up"],
    description: "An up chevron in the frame of `square`: `square-chevron-down` flipped.",
  },
  "square-dashed-bottom": {
    labels: ["square", "dashed", "bottom"],
    description:
      "A square whose bottom edge is dashed: `square` above, the corners of `square-dashed` below.",
  },
  "square-dashed-bottom-code": {
    labels: ["square", "dashed", "bottom"],
    description: "Code brackets in the secondary tone in `square-dashed-bottom`.",
  },
  "square-dashed-kanban": {
    labels: ["square", "dashed", "kanban"],
    description:
      "Three kanban columns of different heights in the secondary tone in `square-dashed`.",
  },
  "square-dashed-mouse-pointer": {
    labels: ["square", "dashed", "mouse"],
    description:
      "A mouse pointer in the secondary tone over the lower right corner of `square-dashed`.",
  },
  "square-divide": {
    labels: ["square", "divide"],
    description: "A division sign in the secondary tone in the frame of `square`.",
  },
  "square-dot": {
    labels: ["square", "dot"],
    description:
      "A round dot in the secondary tone in the frame of `square`, the dot of `circle-dot`.",
  },
  "square-f": {
    labels: ["square", "f"],
    description:
      "A letter F in the secondary tone in the frame of `square`, drawn like the P of `parking-area-square`.",
  },
  "square-kanban": {
    labels: ["square", "kanban"],
    description:
      "Three kanban columns of different heights in the secondary tone in the frame of `square`.",
  },
  "square-library": {
    labels: ["square", "library"],
    description:
      "Two books and a leaning one in the secondary tone in the frame of `square`, the shelf of `folder-library`.",
  },
  "square-lock-add-01": {
    labels: ["square", "lock", "add"],
    description:
      "A square padlock with a plus badge in the lower right corner, like `circle-lock-add-01`.",
  },
  "square-lock-check-01": {
    labels: ["square", "lock", "check"],
    description:
      "A square padlock with a check badge in the lower right corner, like `circle-lock-check-01`.",
  },
  "square-lock-minus-01": {
    labels: ["square", "lock", "minus"],
    description:
      "A square padlock with a minus badge in the lower right corner, like `circle-lock-minus-01`.",
  },
  "square-lock-remove-01": {
    labels: ["square", "lock", "remove"],
    description:
      "A square padlock with a cross badge in the lower right corner, like `circle-lock-remove-01`.",
  },
  "square-m": {
    labels: ["square", "m"],
    description: "A letter M in the secondary tone in the frame of `square`.",
  },
  "square-mouse-pointer": {
    labels: ["square", "mouse", "pointer"],
    description:
      "A mouse pointer in the secondary tone over the lower right corner of `square`, the frame cut around it.",
  },
  "square-pause": {
    labels: ["square", "pause"],
    description:
      "Pause bars in the secondary tone in the frame of `square`, the bars of `pause-circle`.",
  },
  "square-pilcrow": {
    labels: ["square", "pilcrow"],
    description: "A pilcrow in the secondary tone in the frame of `square`.",
  },
  "square-power": {
    labels: ["square", "power"],
    description: "A power symbol in the secondary tone in the frame of `square`.",
  },
  "square-radical": {
    labels: ["square", "radical"],
    description: "A radical sign in the secondary tone in the frame of `square`.",
  },
  "square-round-corner": {
    labels: ["square", "round", "corner"],
    description: "A square whose top right corner is a wider arc in the secondary tone.",
  },
  "square-sigma": {
    labels: ["square", "sigma"],
    description: "A sigma in the secondary tone in the frame of `square`.",
  },
  "square-slash": {
    labels: ["square", "slash"],
    description: "A diagonal slash in the secondary tone in the frame of `square`.",
  },
  "square-split-horizontal": {
    labels: ["square", "split", "horizontal"],
    description: "A square split into left and right halves by a bar in the secondary tone.",
  },
  "square-split-vertical": {
    labels: ["square", "split", "vertical"],
    description: "A square split into top and bottom halves by a bar in the secondary tone.",
  },
  "square-square": {
    labels: ["square"],
    description: "A small square outline in the secondary tone in the frame of `square`.",
  },
  "square-stack": {
    labels: ["square", "stack"],
    description: "Three stacked squares: a front square and the edges of two behind it.",
  },
  "square-stop": {
    labels: ["square", "stop"],
    description:
      "A stop square in the secondary tone in the frame of `square`, the square of `stop-circle`.",
  },
  "square-unlock-01": {
    labels: ["square", "unlock"],
    description:
      "`square-lock-01` opened: the shackle raised, its right leg free of a shorter body.",
  },
  "squares-exclude": {
    labels: ["squares", "exclude"],
    description: "Two overlapping solid squares with their shared square left empty.",
  },
  "squares-intersect": {
    labels: ["squares", "intersect"],
    description: "Two overlapping square outlines, their shared square in the secondary tone.",
  },
  "squares-subtract": {
    labels: ["squares", "subtract"],
    description:
      "A square with its lower right corner cut by a second square, whose outline is in the secondary tone.",
  },
  "squares-unite": {
    labels: ["squares", "unite"],
    description: "Two overlapping squares merged into one outline.",
  },
  "squircle-dashed": {
    labels: ["squircle", "dashed"],
    description: "A dashed squircle: a rounded square outline broken in the middle of each side.",
  },
  "stop-loss-order": {
    labels: ["stop", "loss", "order"],
    description:
      "A price line falling onto a dashed stop level in the secondary tone, on chart axes.",
  },
  "stretch-horizontal": {
    labels: ["stretch", "horizontal"],
    description: "Two wide rectangles stacked, stretched across the full width.",
  },
  "stretch-vertical": {
    labels: ["stretch", "vertical"],
    description: "Two tall rectangles side by side, stretched across the full height.",
  },
  "stroke-bottom": {
    labels: ["stroke", "bottom"],
    description:
      "Bottom stroke: a dashed square whose bottom side is a solid line in the secondary tone, `stroke-left` turned.",
  },
  "stroke-inside": {
    labels: ["stroke", "inside"],
    description:
      "Stroke inside: a dashed outer square, the path, and a solid square inside it in the secondary tone.",
  },
  "stroke-outside": {
    labels: ["stroke", "outside"],
    description:
      "Stroke outside: a solid outer square in the secondary tone around a dashed inner square, the path.",
  },
  "stroke-right": {
    labels: ["stroke", "right"],
    description:
      "Right stroke: a dashed square whose right side is a solid line in the secondary tone, `stroke-left` mirrored.",
  },
  "stroke-top": {
    labels: ["stroke", "top"],
    description:
      "Top stroke: a dashed square whose top side is a solid line in the secondary tone, `stroke-left` turned.",
  },
  "summation-circle": {
    labels: ["summation", "circle"],
    description: "A sigma in the secondary tone in the ring of `circle`.",
  },
  "square-asterisk-fill": {
    reference:
      "Filled variant of our own `square-asterisk`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: an asterisk in the secondary tone in the frame of `square`.",
  },
  "square-chevron-down-fill": {
    reference:
      "Filled variant of our own `square-chevron-down`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description:
      "Filled: a down chevron in the frame of `square`, the chevron of `circle-chevron-down`.",
  },
  "square-chevron-left-fill": {
    reference:
      "Filled variant of our own `square-chevron-left`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description:
      "Filled: a left chevron in the frame of `square`: `square-chevron-right` mirrored.",
  },
  "square-chevron-right-fill": {
    reference:
      "Filled variant of our own `square-chevron-right`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: a right chevron in the frame of `square`: `square-chevron-down` turned.",
  },
  "square-chevron-up-fill": {
    reference:
      "Filled variant of our own `square-chevron-up`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: an up chevron in the frame of `square`: `square-chevron-down` flipped.",
  },
  "square-pause-fill": {
    reference:
      "Filled variant of our own `square-pause`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description:
      "Filled: pause bars in the secondary tone in the frame of `square`, the bars of `pause-circle`.",
  },
  "square-power-fill": {
    reference:
      "Filled variant of our own `square-power`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: a power symbol in the secondary tone in the frame of `square`.",
  },
  "square-stop-fill": {
    reference: "Filled variant of our own `square-stop`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description:
      "Filled: a stop square in the secondary tone in the frame of `square`, the square of `stop-circle`.",
  },
  "tired-01": {
    labels: ["tired"],
    description: "Tired face: the round face with closed, flat eyes and a flat mouth.",
  },
  "tongue-01": {
    labels: ["tongue"],
    description:
      "Face sticking its tongue out: the round face, a flat mouth and the tongue below it.",
  },
  "tongue-wink-left": {
    labels: ["tongue", "wink", "left"],
    description: "Face winking with the left eye and sticking its tongue out.",
  },
  "tongue-wink-right": {
    labels: ["tongue", "wink", "right"],
    description: "Face winking with the right eye and sticking its tongue out.",
  },
  "touchpad-off": {
    labels: ["touchpad", "off"],
    description: "Touchpad crossed out: the touchpad with a diagonal slash in the secondary tone.",
  },
  "traffic-incident": {
    labels: ["traffic", "incident"],
    description: "Traffic cone with two bands in the secondary tone.",
  },
  "traffic-jam-01": {
    labels: ["traffic", "jam"],
    description:
      "Traffic jam: a car seen from the front with a second car queued behind it in the secondary tone.",
  },
  "transaction-history": {
    labels: ["transaction", "history"],
    description:
      "Transaction history: a list of entries with a clock badge in the lower-right corner.",
  },
  "trapezoid-line-horizontal": {
    labels: ["trapezoid", "line", "horizontal"],
    description: "Trapezoid outline lying flat, wide side down, 1:2 slopes.",
  },
  "trapezoid-line-vertical": {
    labels: ["trapezoid", "line", "vertical"],
    description: "Trapezoid outline standing up, wide side to the left, 2:1 slopes.",
  },
  "trending-up-down": {
    labels: ["trending", "up", "down"],
    description:
      "Trending up and down: two crossing lines, one rising, one falling, each with an arrowhead.",
  },
  "triangle-dashed": {
    labels: ["triangle", "dashed"],
    description: "Triangle with a dashed outline: the triangle broken into short runs.",
  },
  "tropical-storm": {
    labels: ["tropical", "storm"],
    description:
      "Tropical storm: the weather symbol, a ring with two curved arms in half-turn symmetry.",
  },
  "truck-electric": {
    labels: ["truck", "electric"],
    description: "Electric truck: the truck with a bolt in its cargo box in the secondary tone.",
  },
  "turkish-lira": {
    labels: ["turkish", "lira"],
    description:
      "Turkish lira sign: a stem with two rising bars and a foot curving up to the right.",
  },
  "tv-minimal-play": {
    labels: ["tv", "minimal", "play"],
    description: "Television with a play triangle in the secondary tone.",
  },
  "type-outline": {
    labels: ["type", "outline"],
    description: "Outlined capital T.",
  },
  "umbrella-off": {
    labels: ["umbrella", "off"],
    description: "Umbrella crossed out: the umbrella with a diagonal slash in the secondary tone.",
  },
  "underpants-01": {
    labels: ["underpants"],
    description: "Briefs: a waistband over a body narrowing to the crotch.",
  },
  "union-circle": {
    labels: ["union", "circle"],
    description: "Union of two circles one above the other: one outline around both.",
  },
  "union-horizontal-circle": {
    labels: ["union", "horizontal", "circle"],
    description: "Union of two circles side by side: one outline around both.",
  },
  "universal-access-circle": {
    labels: ["universal", "access", "circle"],
    description:
      "Universal access: the accessibility figure inside a circle, the head in the secondary tone.",
  },
  "user-unlock-01": {
    labels: ["user", "unlock"],
    description: "User with an open padlock badge in the lower-right corner.",
  },
  "utility-pole": {
    labels: ["utility", "pole"],
    description: "Utility pole: a post with two crossarms carrying insulators.",
  },
  "uv-01": {
    labels: ["uv"],
    description: "UV: the two letters U and V.",
  },
  "venus-and-mars": {
    labels: ["venus", "and", "mars"],
    description: "Venus and Mars: one ring with the arrow of Mars up and the cross of Venus down.",
  },
  "vertical-scroll-point": {
    labels: ["vertical", "scroll", "point"],
    description: "Vertical scroll position: a scroll track with its thumb in the secondary tone.",
  },
  "villa-01": {
    labels: ["villa"],
    description: "Villa: a gabled house with a lower flat-roofed wing.",
  },
  "vintage-clock": {
    labels: ["vintage", "clock"],
    description:
      "Mantel clock: an arched case with a round face, the hands in the secondary tone, on two feet.",
  },
  "virtual-reality-vr-01": {
    labels: ["virtual", "reality", "vr"],
    description: "VR headset: the goggles from the front with a nose cut and strap stubs.",
  },
  "voice-to-text": {
    labels: ["voice", "to", "text"],
    description:
      "Voice to text: sound bars on the left, lines of text on the right in the secondary tone.",
  },
  "volume-01": {
    labels: ["volume"],
    description: "Speaker on its own: the loudspeaker of the volume icons.",
  },
  "volume-minus": {
    labels: ["volume", "minus"],
    description: "Speaker with a minus in the secondary tone: turn the volume down.",
  },
  "vynil-01": {
    labels: ["vynil"],
    description: "Vinyl record: a disc with its label in the secondary tone and two groove arcs.",
  },
  "traffic-incident-fill": {
    reference:
      "Filled variant of our own `traffic-incident`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "traffic"],
    description: "Filled: traffic cone with two bands in the secondary tone.",
  },
  "type-outline-fill": {
    reference:
      "Filled variant of our own `type-outline`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "type"],
    description: "Filled: outlined capital T.",
  },
  "underpants-01-fill": {
    reference:
      "Filled variant of our own `underpants-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "underpants"],
    description: "Filled: briefs: a waistband over a body narrowing to the crotch.",
  },
  "union-circle-fill": {
    reference:
      "Filled variant of our own `union-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "union"],
    description: "Filled: union of two circles one above the other: one outline around both.",
  },
  "union-horizontal-circle-fill": {
    reference:
      "Filled variant of our own `union-horizontal-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "union"],
    description: "Filled: union of two circles side by side: one outline around both.",
  },
  "volume-01-fill": {
    reference: "Filled variant of our own `volume-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "volume"],
    description: "Filled: speaker on its own: the loudspeaker of the volume icons.",
  },
  "wallet-done-01": {
    labels: ["wallet", "done"],
    description:
      "Wallet with a check badge: `wallet-add-01` cut back around a check in the secondary tone.",
  },
  "wallet-minimal": {
    labels: ["wallet", "minimal"],
    description:
      "Minimal wallet: a plain body with a flap line and a button in the secondary tone.",
  },
  "wallet-not-found-01": {
    labels: ["wallet", "not", "found"],
    description: "Wallet not found: `wallet-add-01` cut back around a cross in the secondary tone.",
  },
  "wallet-remove-01": {
    labels: ["wallet", "remove"],
    description: "Wallet with a minus badge: `wallet-add-01` with a minus in the secondary tone.",
  },
  "washing-machine": {
    labels: ["washing", "machine"],
    description:
      "Washing machine: a box with a control strip and a round door in the secondary tone.",
  },
  "waterfall-down-01": {
    labels: ["waterfall", "down"],
    description:
      "Waterfall chart going down: a full bar, a floating drop, the final bar in the secondary tone, over a baseline.",
  },
  "waterfall-up-01": {
    labels: ["waterfall", "up"],
    description:
      "Waterfall chart going up: a start bar, a floating rise, the final bar in the secondary tone, over a baseline.",
  },
  "wav-01": {
    labels: ["wav"],
    description:
      "WAV file: the top of `file-01` over the letters W, A and V in the secondary tone.",
  },
  "wave-triangle": {
    labels: ["wave", "triangle"],
    description: "Triangle wave: a signal rising and falling in straight 45\u00b0 lines.",
  },
  "waves-arrow-up": {
    labels: ["waves", "arrow", "up"],
    description:
      "Waves with an arrow up: `submerge` turned over, the arrow in the secondary tone rising out of two rows of waves.",
  },
  "waving-hand-01": {
    labels: ["waving", "hand"],
    description:
      "Waving hand: the open hand with a motion mark beside the fingers in the secondary tone.",
  },
  "weight-scale": {
    labels: ["weight", "scale"],
    description:
      "Kitchen scale: a weighing plate on a stem over a body with a dial in the secondary tone.",
  },
  "workflow-circle-01": {
    labels: ["workflow", "circle"],
    description: "Workflow: two round nodes joined by an elbow, the second in the secondary tone.",
  },
  "workout-kicking": {
    labels: ["workout", "kicking"],
    description:
      "Kick: a person on one leg kicking high to the side, the head in the secondary tone.",
  },
  "workout-squats": {
    labels: ["workout", "squats"],
    description:
      "Squat: a person with the head in the secondary tone, arms forward, thighs level, shins down.",
  },
  "workout-stretching": {
    labels: ["workout", "stretching"],
    description:
      "Stretch: a person reaching both arms overhead in a wide stance, the head in the secondary tone.",
  },
  "workout-warm-up": {
    labels: ["workout", "warm", "up"],
    description: "Warm-up: a person marching with one knee raised, the head in the secondary tone.",
  },
  "x-line-top": {
    labels: ["x", "line", "top"],
    description:
      "X with a bar on top: the sample mean, a cross in the secondary tone under an overline.",
  },
  "xls-01": {
    labels: ["xls"],
    description:
      "XLS file: the top of `file-01` over the letters X, L and S in the secondary tone.",
  },
  "xml-01": {
    labels: ["xml"],
    description:
      "XML file: the top of `file-01` over the letters X, M and L in the secondary tone.",
  },
  "xsl-01": {
    labels: ["xsl"],
    description:
      "XSL file: the top of `file-01` over the letters X, S and L in the secondary tone.",
  },
  "yen-square": {
    labels: ["yen", "square"],
    description:
      "Yen sign in a rounded square: the frame of `dollar-square`, the sign in the secondary tone.",
  },
  "yoga-01": {
    labels: ["yoga"],
    description:
      "Yoga: a person seated cross-legged with the hands on the knees, the head in the secondary tone.",
  },
  "zip-02": {
    labels: ["zip"],
    description:
      "ZIP file: the top of `file-01` over the letters Z, I and P in the secondary tone.",
  },
  "zodiac-aquarius": {
    labels: ["zodiac", "aquarius"],
    description: "Aquarius: two parallel zigzag lines.",
  },
  "zodiac-aries": {
    labels: ["zodiac", "aries"],
    description: "Aries: two curled horns meeting on a stem.",
  },
  "zodiac-cancer": {
    labels: ["zodiac", "cancer"],
    description: "Cancer: two small rings with arcs, turned half a turn from each other.",
  },
  "zodiac-capricorn": {
    labels: ["zodiac", "capricorn"],
    description: "Capricorn: a v-shaped stroke rising into a loop with a tail.",
  },
  "zodiac-gemini": {
    labels: ["zodiac", "gemini"],
    description: "Gemini: two pillars between a curved top and bottom bar.",
  },
  "zodiac-leo": {
    labels: ["zodiac", "leo"],
    description:
      "Leo: a small ring at the lower left, its stroke arching over and ending in a hook.",
  },
  "zodiac-libra": {
    labels: ["zodiac", "libra"],
    description: "Libra: an arch with flat feet over a bar.",
  },
  "zodiac-ophiuchus": {
    labels: ["zodiac", "ophiuchus"],
    description: "Ophiuchus: a serpent with two humps over a bar.",
  },
  "zodiac-pisces": {
    labels: ["zodiac", "pisces"],
    description: "Pisces: two arcs back to back, joined by a bar.",
  },
  "zodiac-sagittarius": {
    labels: ["zodiac", "sagittarius"],
    description: "Sagittarius: an arrow pointing up-right, crossed by a short bar.",
  },
  "zodiac-scorpio": {
    labels: ["zodiac", "scorpio"],
    description: "Scorpio: an m whose last leg ends in an arrow.",
  },
  "zodiac-taurus": {
    labels: ["zodiac", "taurus"],
    description: "Taurus: a ring under a pair of upturned horns.",
  },
  "zodiac-virgo": {
    labels: ["zodiac", "virgo"],
    description: "Virgo: an m whose last leg curls into a loop.",
  },
  "wallet-minimal-fill": {
    reference:
      "Filled variant of our own `wallet-minimal`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "wallet"],
    description:
      "Filled: minimal wallet: a plain body with a flap line and a button in the secondary tone.",
  },
  "yen-square-fill": {
    reference: "Filled variant of our own `yen-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "yen"],
    description:
      "Filled: yen sign in a rounded square: the frame of `dollar-square`, the sign in the secondary tone.",
  },
  "super-intelligence": {
    labels: ["super", "intelligence"],
    description: "Super intelligence: the letters S and I in a rounded square.",
  },
  "super-intelligence-chat": {
    labels: ["super", "intelligence", "chat"],
    description:
      "Chat bubble with the S I badge of super intelligence at the lower right, in the secondary tone; the bubble of ai-chat-01.",
  },
  "super-intelligence-cloud": {
    labels: ["super", "intelligence", "cloud"],
    description:
      "Cloud with the S I badge of super intelligence at the lower right, in the secondary tone; the cloud of ai-cloud.",
  },
  "super-intelligence-file": {
    labels: ["super", "intelligence", "file"],
    description:
      "File with the S I badge of super intelligence at the lower right, in the secondary tone; the file of ai-file.",
  },
  "super-intelligence-folder": {
    labels: ["super", "intelligence", "folder"],
    description:
      "Folder with the S I badge of super intelligence at the lower right, in the secondary tone; the folder of ai-folder-01.",
  },
  "super-intelligence-robot": {
    labels: ["super", "intelligence", "robot"],
    description:
      "Robot head with an antenna and the S I badge of super intelligence at the lower right, in the secondary tone.",
  },
  "super-intelligence-setting": {
    labels: ["super", "intelligence", "setting"],
    description:
      "Cog with the S I badge of super intelligence at the lower right, in the secondary tone; the cog of ai-setting.",
  },
  "super-intelligence-shield": {
    labels: ["super", "intelligence", "shield"],
    description:
      "Shield with the S I badge of super intelligence at the lower right, in the secondary tone; the shield of shield-cog-corner.",
  },
  "super-intelligence-speech": {
    labels: ["super", "intelligence", "speech"],
    description:
      "Sound bars of speech with the S I badge of super intelligence at the lower right, in the secondary tone.",
  },
  "super-intelligence-video": {
    labels: ["super", "intelligence", "video"],
    description:
      "Screen with a play triangle and the S I badge of super intelligence at the lower right, in the secondary tone.",
  },
  "super-intelligence-voice": {
    labels: ["super", "intelligence", "voice"],
    description:
      "Rounded box with voice bars inside and the S I badge of super intelligence at the lower right, in the secondary tone.",
  },
  "sushi-01": {
    labels: ["sushi"],
    description:
      "Nigiri sushi: a striped slice of fish, in the secondary tone, on a block of rice.",
  },
  "sustainable-energy": {
    labels: ["sustainable", "energy"],
    description:
      "Sustainable energy: two arrows turning in a circle around a lightning bolt in the secondary tone; the arrows of refresh.",
  },
  "svg-01": {
    labels: ["svg"],
    description: "SVG: the three letters S, V and G; the letters of jpg-01.",
  },
  "tally-1": {
    labels: ["tally"],
    description: "Tally mark: a single upright stroke, the first of a count.",
  },
  "task-edit-01": {
    labels: ["task", "edit"],
    description:
      "Task list with a pencil, in the secondary tone, in place of the second task's line; the boxes of task-01.",
  },
  "task-remove-01": {
    labels: ["task", "remove"],
    description:
      "Task list with a cross, in the secondary tone, in place of the second task's line; the boxes of task-01.",
  },
  "telescope-02": {
    labels: ["telescope"],
    description: "Telescope: a tube pointing up to the right on a three-legged stand.",
  },
  "tennis-racket": {
    labels: ["tennis", "racket"],
    description:
      "Tennis racket: an oval head with crossed strings in the secondary tone, on a short handle.",
  },
  "test-tube-diagonal": {
    labels: ["test", "tube", "diagonal"],
    description:
      "Test tube lying at a slant, with its liquid in the secondary tone; the tube of test-tube, turned.",
  },
  "text-creation": {
    labels: ["text", "creation"],
    description:
      "Text creation: a letter T inside a frame with square handles, in the secondary tone, at its four corners.",
  },
  "text-firstline-left": {
    labels: ["text", "firstline", "left"],
    description:
      "First line on the left: two short lines beside a box, in the secondary tone, then two full lines.",
  },
  "text-firstline-right": {
    labels: ["text", "firstline", "right"],
    description:
      "First line on the right: a box, in the secondary tone, beside two short lines, then two full lines.",
  },
  "text-font": {
    labels: ["text", "font"],
    description: "Font: a capital A next to a small a, in the bold letter style of text-color.",
  },
  "text-footnote": {
    labels: ["text", "footnote"],
    description:
      "Footnote: a letter T with an asterisk, in the secondary tone, at its upper right, over a short rule.",
  },
  "text-initial": {
    labels: ["text", "initial"],
    description:
      "Initial: a letter A, in the secondary tone, set beside two short lines above two full lines, like a drop cap.",
  },
  "text-italic-slash": {
    labels: ["text", "italic", "slash"],
    description:
      "No italic: the slanted letter I of text-italic, crossed by a slash in the secondary tone.",
  },
  "text-kerning": {
    labels: ["text", "kerning"],
    description:
      "Kerning: the letters V and A set close, over two arrows, in the secondary tone, pointing at each other.",
  },
  "text-number-sign": {
    labels: ["text", "number", "sign"],
    description:
      "Number sign: a capital N followed by a raised small o, underlined, in the secondary tone.",
  },
  "text-search": {
    labels: ["text", "search"],
    description:
      "Text search: lines of text with a small magnifying glass, in the secondary tone, at the lower right.",
  },
  "text-selection": {
    labels: ["text", "selection"],
    description:
      "Text selection: an I-beam cursor, in the secondary tone, beside a small letter a; the cursor of cursor-text.",
  },
  "text-smallcaps": {
    labels: ["text", "smallcaps"],
    description:
      "Small caps: a capital T next to a smaller capital T, in the bold letter style of text.",
  },
  "text-square": {
    labels: ["text", "square"],
    description: "Letter T, in the secondary tone, in a rounded square; the T of text-circle.",
  },
  "text-to-image": {
    labels: ["text", "to", "image"],
    description:
      "Text to image: a picture frame with mountains, and a letter T, in the secondary tone, in place of the sun; the frame of image-01.",
  },
  "text-to-speach": {
    labels: ["text", "to", "speach"],
    description:
      "Text to speech: a letter T and sound bars, in the secondary tone, rising from it.",
  },
  "text-tracking": {
    labels: ["text", "tracking"],
    description:
      "Tracking: the letters A and V set apart, over a double arrow, in the secondary tone, spanning the line.",
  },
  "text-variable-front": {
    labels: ["text", "variable", "front"],
    description:
      "Variable font: two letters T side by side, each over a short rule in the secondary tone.",
  },
  "text-vertical-alignment": {
    labels: ["text", "vertical", "alignment"],
    description:
      "Vertical alignment: two letters A with their lines, above and below a middle axis in the secondary tone.",
  },
  "thermometer-cold": {
    labels: ["thermometer", "cold"],
    description:
      "Cold thermometer: the liquid, in the secondary tone, down in the bulb; the thermometer of thermometer.",
  },
  "thermometer-snowflake": {
    labels: ["thermometer", "snowflake"],
    description:
      "Thermometer with a snowflake, in the secondary tone, at its upper right; the thermometer of thermometer, moved left.",
  },
  "thermometer-sun": {
    labels: ["thermometer", "sun"],
    description:
      "Thermometer with a sun, in the secondary tone, at its upper right; the thermometer of thermometer, moved left.",
  },
  "thermometer-warm": {
    labels: ["thermometer", "warm"],
    description:
      "Warm thermometer: the liquid, in the secondary tone, risen to the top; the thermometer of thermometer.",
  },
  "thought-bubble": {
    labels: ["thought", "bubble"],
    description: "Thought bubble: a round bubble trailed by two small circles.",
  },
  "three-circle": {
    labels: ["three", "circle"],
    description: "The digit 3, in the secondary tone, in a circle; the circle of circle.",
  },
  "three-square": {
    labels: ["three", "square"],
    description: "The digit 3, in the secondary tone, in a rounded square; the square of square.",
  },
  "tickets-plane": {
    labels: ["tickets", "plane"],
    description:
      "Plane ticket: a ticket with notched sides and a small airplane, in the secondary tone, on it; the ticket of ticket-01, one row taller.",
  },
  "tiff-01": {
    labels: ["tiff"],
    description: "TIFF: the four letters T, I, F and F, in the style of jpg-01.",
  },
  "timeline-event": {
    labels: ["timeline", "event"],
    description:
      "Timeline event: a card with two lines of text above a point, in the secondary tone, on a timeline.",
  },
  "timeline-list": {
    labels: ["timeline", "list"],
    description:
      "Timeline list: two points on a vertical line, in the secondary tone, each with a label; the points of timeline.",
  },
  "text-square-fill": {
    reference: "Filled variant of our own `text-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "text"],
    description:
      "Filled: letter T, in the secondary tone, in a rounded square; the T of text-circle.",
  },
  "thought-bubble-fill": {
    reference:
      "Filled variant of our own `thought-bubble`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "thought"],
    description: "Filled: thought bubble: a round bubble trailed by two small circles.",
  },
  "three-circle-fill": {
    reference:
      "Filled variant of our own `three-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "three"],
    description: "Filled: the digit 3, in the secondary tone, in a circle; the circle of circle.",
  },
  "three-square-fill": {
    reference:
      "Filled variant of our own `three-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "three"],
    description:
      "Filled: the digit 3, in the secondary tone, in a rounded square; the square of square.",
  },
  "activity-02": {
    labels: ["activity"],
    description:
      "Activity in a square: the pulse line of `activity-01` running across a square frame.",
  },
  "ai-chemistry-02": {
    labels: ["ai", "chemistry"],
    description:
      "AI chemistry: a conical flask with liquid, the AI sparkle badge in the secondary tone.",
  },
  "ai-image-01": {
    labels: ["ai", "image"],
    description:
      "AI image: the picture frame of `image-01`, open at the lower right for the AI sparkle badge in the secondary tone.",
  },
  "ai-innovation-02": {
    labels: ["ai", "innovation"],
    description: "AI innovation: a light bulb, the AI sparkle badge in the secondary tone.",
  },
  "airpod-02": {
    labels: ["airpod"],
    description: "Earbuds case: a rounded charging case with the lid seam and a status light.",
  },
  "arrow-down-03": {
    labels: ["arrow", "down"],
    description:
      "Thin arrow pointing down: a one-pixel shaft and a 45\u00b0 head, the light sibling of `arrow-down-02`.",
  },
  "arrow-down-05": {
    labels: ["arrow", "down"],
    description: "Arrow pointing down with a solid triangular head on a two-pixel shaft.",
  },
  "arrow-left-03": {
    labels: ["arrow", "left"],
    description: "Thin arrow pointing left: `arrow-right-03` mirrored.",
  },
  "arrow-left-05": {
    labels: ["arrow", "left"],
    description: "Arrow pointing left: `arrow-right-05` mirrored.",
  },
  "arrow-right-03": {
    labels: ["arrow", "right"],
    description: "Thin arrow pointing right: `arrow-down-03` turned a quarter.",
  },
  "arrow-right-05": {
    labels: ["arrow", "right"],
    description: "Arrow pointing right: `arrow-down-05` turned a quarter.",
  },
  "arrow-up-03": {
    labels: ["arrow", "up"],
    description: "Thin arrow pointing up: `arrow-down-03` flipped.",
  },
  "arrow-up-05": {
    labels: ["arrow", "up"],
    description: "Arrow pointing up: `arrow-down-05` flipped.",
  },
  "bookshelf-03": {
    labels: ["bookshelf"],
    description:
      "Bookshelf: two open shelves of upright books in the secondary tone, the open sibling of `bookshelf-02`.",
  },
  "house-02": {
    labels: ["house"],
    description: "House with a chimney on the gable roof and a centred door; variant of house-01.",
  },
  "inequality-02": {
    labels: ["inequality"],
    description: "Greater-than-or-equal sign, the mirror of inequality-01.",
  },
  "invoice-02": {
    labels: ["invoice"],
    description: "Invoice page with a header, two lines and a highlighted total.",
  },
  "joystick-02": {
    labels: ["joystick"],
    description: "Arcade stick: a ball-top lever and two buttons on a wide panel.",
  },
  "joystick-03": {
    labels: ["joystick"],
    description: "Joystick with its lever tilted to the left over the base.",
  },
  "layout-04": {
    labels: ["layout"],
    description: "Page layout with a header, a left sidebar beside the content, and a footer.",
  },
  "legal-document-02": {
    labels: ["legal", "document"],
    description: "Document with text lines and an official seal in the corner.",
  },
  "login-square-02": {
    labels: ["login", "square"],
    description: "Arrow entering a square bracket from the left: sign in.",
  },
  "dress-02": {
    labels: ["dress"],
    description: "A dress with short sleeves and a round neck, the skirt flared.",
  },
  "dress-03": {
    labels: ["dress"],
    description:
      "A long gown: thin straps, a fitted bodice, a belt at the waist (secondary tone) and a long skirt.",
  },
  "dressing-table-02": {
    labels: ["dressing", "table"],
    description:
      "A dressing table with a square mirror (the shine in the secondary tone), a drawer and legs.",
  },
  "edit-03": {
    labels: ["edit"],
    description:
      "A pencil writing on a line: the pencil of edit-02 above a baseline in the secondary tone.",
  },
  "electric-tower-02": {
    labels: ["electric", "tower"],
    description:
      "A utility pole: a straight post with two cross-arms and insulators at their ends.",
  },
  "equipment-gym-02": {
    labels: ["equipment", "gym"],
    description: "A dumbbell: two round weights joined by a short bar.",
  },
  "exchange-02": {
    labels: ["exchange"],
    description: "Two vertical arrows side by side, one up and one down, in half-turn symmetry.",
  },
  "forward-02": {
    labels: ["forward"],
    description:
      "A forward arrow: a shaft curving up from the lower left into an arrowhead pointing right.",
  },
  "fuel-01": {
    labels: ["fuel"],
    description:
      "A fuel pump: the pump body with its display (secondary tone), the hose and the nozzle hung on its side.",
  },
  heading5: {
    labels: ["heading5"],
    description: "A heading of level 5: an H and the digit 5 in the secondary tone.",
  },
  heading6: {
    labels: ["heading6"],
    description: "A heading of level 6: an H and the digit 6 in the secondary tone.",
  },
  "hierarchy-circle-02": {
    labels: ["hierarchy", "circle"],
    description:
      "The tree of hierarchy-circle-01 laid on its side: the root on the left, two circles (secondary tone) on the right.",
  },
  "hierarchy-circle-03": {
    labels: ["hierarchy", "circle"],
    description:
      "The tree of hierarchy-circle-01 with the root circle in the secondary tone instead of the children.",
  },
  "hierarchy-square-02": {
    labels: ["hierarchy", "square"],
    description:
      "The tree of hierarchy-square-01 laid on its side: the root square on the left, two squares (secondary tone) on the right.",
  },
  "hierarchy-square-03": {
    labels: ["hierarchy", "square"],
    description:
      "The tree of hierarchy-square-01 with the root square in the secondary tone instead of the children.",
  },
  "home-04": {
    labels: ["home"],
    description:
      "A house with eaves: the roof wider than the walls, and the door in the secondary tone.",
  },
  "hotel-02": {
    labels: ["hotel"],
    description: "A hotel building: an H sign (secondary tone) above the door.",
  },
  "mask-theater-02": {
    labels: ["mask", "theater"],
    description: "Tragedy mask: the mask of `mask-theater-01` with a frown in the secondary tone.",
  },
  "maximize-02": {
    labels: ["maximize"],
    description:
      "Maximise: one diagonal with arrowheads at both ends, pointing out to two corners (heads of `maximize-01`).",
  },
  "maximize-03": {
    labels: ["maximize"],
    description: "Maximise: four corner brackets marking the full frame.",
  },
  "menu-02": {
    labels: ["menu"],
    description: "Menu: three bars, the last one shorter.",
  },
  "menu-03": {
    labels: ["menu"],
    description: "Menu: three bars getting shorter from the top, aligned left.",
  },
  "menu-05": {
    labels: ["menu"],
    description: "Menu: four bars, eight pixels long, two-pixel gaps.",
  },
  "message-lock-02": {
    labels: ["message", "lock"],
    description:
      "Speech bubble (`message-add-01` base), cut at the lower right for a padlock badge in the secondary tone.",
  },
  "message-preview-02": {
    labels: ["message", "preview"],
    description:
      "Speech bubble (`message-add-01` base), cut at the lower right for an eye badge in the secondary tone.",
  },
  "message-search-02": {
    labels: ["message", "search"],
    description:
      "Speech bubble (`message-add-01` base), cut at the lower right for a magnifier badge in the secondary tone.",
  },
  "message-secure-02": {
    labels: ["message", "secure"],
    description:
      "Speech bubble (`message-add-01` base), cut at the lower right for a shield badge in the secondary tone.",
  },
  "message-unlock-02": {
    labels: ["message", "unlock"],
    description:
      "Speech bubble (`message-add-01` base), cut at the lower right for an open padlock badge in the secondary tone.",
  },
  "message-upload-02": {
    labels: ["message", "upload"],
    description:
      "Speech bubble (`message-add-01` base), cut at the lower right for an up arrow badge in the secondary tone.",
  },
  "message-user-02": {
    labels: ["message", "user"],
    description:
      "Speech bubble (`message-add-01` base), cut at the lower right for a person badge in the secondary tone.",
  },
  "minimize-03": {
    labels: ["minimize"],
    description: "Minimise: four corner brackets turned inwards, `maximize-03` inside out.",
  },
  "money-02": {
    labels: ["money"],
    description:
      "Two banknotes stacked: `money-01` in front, the edge of a second note behind at the top right.",
  },
  "money-add-02": {
    labels: ["money", "add"],
    description:
      "Banknote, cut at the lower right for a plus badge in the secondary tone (`money-not-found-01` base).",
  },
  "money-remove-02": {
    labels: ["money", "remove"],
    description:
      "Banknote, cut at the lower right for a minus badge in the secondary tone (`money-not-found-01` base).",
  },
  "border-bottom-02": {
    labels: ["border", "bottom"],
    description:
      "Bottom border: the bottom side solid in the secondary tone, the rest of the square dotted, without the inner lines of `border-bottom-01`.",
  },
  "border-left-02": {
    labels: ["border", "left"],
    description:
      "Left border: the left side solid in the secondary tone, the rest of the square dotted, without the inner lines of `border-left-01`.",
  },
  "border-none-02": {
    labels: ["border", "none"],
    description: "No border: a dotted square without the inner lines.",
  },
  "border-right-02": {
    labels: ["border", "right"],
    description:
      "Right border: the right side solid in the secondary tone, the rest of the square dotted, without the inner lines of `border-right-01`.",
  },
  "border-top-02": {
    labels: ["border", "top"],
    description:
      "Top border: the square of `border-bottom-01` split in four, the top side solid in the secondary tone, the rest dotted.",
  },
  "bread-03": {
    labels: ["bread"],
    description:
      "Slice of bread: the domed crown of a sandwich loaf over a straight body, one-pixel outline, symmetric.",
  },
  "chat-blocked-01": {
    labels: ["chat", "blocked"],
    description:
      "Speech bubble (`message-01`) with the badge of `chat-blocked` in the lower-right corner.",
  },
  "chat-delay-01": {
    labels: ["chat", "delay"],
    description:
      "Speech bubble (`message-01`) with the badge of `chat-delay` in the lower-right corner.",
  },
  "chat-done-01": {
    labels: ["chat", "done"],
    description:
      "Speech bubble (`message-01`) with the badge of `chat-done` in the lower-right corner.",
  },
  "chat-favourite-01": {
    labels: ["chat", "favourite"],
    description:
      "Speech bubble (`message-01`) with the badge of `chat-favourite` in the lower-right corner.",
  },
  "chat-feedback-01": {
    labels: ["chat", "feedback"],
    description:
      "Speech bubble (`message-01`) with the badge of `chat-feedback` in the lower-right corner.",
  },
  "chat-income-01": {
    labels: ["chat", "income"],
    description:
      "Speech bubble (`message-01`) with the badge of `chat-income` in the lower-right corner.",
  },
  "chat-outcome-01": {
    labels: ["chat", "outcome"],
    description:
      "Speech bubble (`message-01`) with the badge of `chat-outcome` in the lower-right corner.",
  },
  "chat-secure-01": {
    labels: ["chat", "secure"],
    description:
      "Speech bubble (`message-01`) with the badge of `chat-secure` in the lower-right corner.",
  },
  "chat-spark-01": {
    labels: ["chat", "spark"],
    description:
      "Speech bubble (`message-01`) with the badge of `chat-spark` in the lower-right corner.",
  },
  "chat-translate-01": {
    labels: ["chat", "translate"],
    description:
      "Speech bubble (`message-01`) with the badge of `chat-translate` in the lower-right corner.",
  },
  "chat-unlock-01": {
    labels: ["chat", "unlock"],
    description:
      "Speech bubble (`message-01`) with the badge of `chat-unlock` in the lower-right corner.",
  },
  "chat-user-01": {
    labels: ["chat", "user"],
    description:
      "Speech bubble (`message-01`) with the badge of `chat-user` in the lower-right corner.",
  },
  "circle-arrow-diagonal-02": {
    labels: ["circle", "arrow", "diagonal"],
    description:
      "`circle-arrow-diagonal-01` mirrored: the same arrows on the other diagonal, upper left to lower right.",
  },
  "circle-arrow-expand-02": {
    labels: ["circle", "arrow", "expand"],
    description:
      "`circle-arrow-expand-01` mirrored: the same arrows on the other diagonal, upper left to lower right.",
  },
  "circle-arrow-shrink-02": {
    labels: ["circle", "arrow", "shrink"],
    description:
      "`circle-arrow-shrink-01` mirrored: the same arrows on the other diagonal, upper left to lower right.",
  },
  "circle-slash-2": {
    labels: ["circle", "slash"],
    description:
      "Ring with a short slash floating inside it, two pixels clear of the ring: the ring of `circle-slash`.",
  },
  "clock-hour-10": {
    labels: ["clock", "hour"],
    description:
      "Clock of `clock-hour-1` reading ten o'clock: the long hand up, the short hand towards ten.",
  },
  "clock-hour-11": {
    labels: ["clock", "hour"],
    description:
      "Clock of `clock-hour-1` reading eleven o'clock: the long hand up, the short hand towards eleven.",
  },
  "clock-hour-12": {
    labels: ["clock", "hour"],
    description:
      "Clock of `clock-hour-1` reading twelve o'clock: both hands up, one over the other.",
  },
  "clock-hour-2": {
    labels: ["clock", "hour"],
    description:
      "Clock of `clock-hour-1` reading two o'clock: the long hand up, the short hand towards two.",
  },
  "clock-hour-3": {
    labels: ["clock", "hour"],
    description:
      "Clock of `clock-hour-1` reading three o'clock: the long hand up, the short hand towards three.",
  },
  "clock-hour-4": {
    labels: ["clock", "hour"],
    description:
      "Clock of `clock-hour-1` reading four o'clock: the long hand up, the short hand towards four.",
  },
  "clock-hour-5": {
    labels: ["clock", "hour"],
    description:
      "Clock of `clock-hour-1` reading five o'clock: the long hand up, the short hand towards five.",
  },
  "clock-hour-6": {
    labels: ["clock", "hour"],
    description:
      "Clock of `clock-hour-1` reading six o'clock: the long hand up, the short hand towards six.",
  },
  "clock-hour-7": {
    labels: ["clock", "hour"],
    description:
      "Clock of `clock-hour-1` reading seven o'clock: the long hand up, the short hand towards seven.",
  },
  "clock-hour-8": {
    labels: ["clock", "hour"],
    description:
      "Clock of `clock-hour-1` reading eight o'clock: the long hand up, the short hand towards eight.",
  },
  "clock-hour-9": {
    labels: ["clock", "hour"],
    description:
      "Clock of `clock-hour-1` reading nine o'clock: the long hand up, the short hand towards nine.",
  },
  "css-file-02": {
    labels: ["css", "file"],
    description:
      "CSS file: `file-01` one column left, a pair of curly braces as the badge in the secondary tone.",
  },
  "cupcake-02": {
    labels: ["cupcake"],
    description:
      "The cupcake of `cupcake-01` with a birthday candle in the secondary tone instead of the cherry.",
  },
  "cursor-add-selection-02": {
    labels: ["cursor", "add", "selection"],
    description: "The small pointer of `cursor-loading-01` with a plus badge in the lower right.",
  },
  "cursor-circle-selection-02": {
    labels: ["cursor", "circle", "selection"],
    description:
      "The small pointer of `cursor-loading-01` with a ring selection badge in the lower right.",
  },
  "cursor-disabled-02": {
    labels: ["cursor", "disabled"],
    description:
      "The small pointer of `cursor-loading-01` with a no-entry badge in the lower right.",
  },
  "cursor-edit-02": {
    labels: ["cursor", "edit"],
    description: "The small pointer of `cursor-loading-01` with a pencil badge in the lower right.",
  },
  "cursor-info-02": {
    labels: ["cursor", "info"],
    description:
      "The small pointer of `cursor-loading-01` with a letter i badge in the lower right.",
  },
  "cursor-loading-02": {
    labels: ["cursor", "loading"],
    description: "Pointer of `cursor-01` with a loading ring badge in the upper right.",
  },
  "cursor-magic-selection-02": {
    labels: ["cursor", "magic", "selection"],
    description: "Pointer of `cursor-01` with a sparkle badge in the upper right: magic selection.",
  },
  "cursor-progress-02": {
    labels: ["cursor", "progress"],
    description: "Pointer of `cursor-01` with an hourglass badge in the upper right.",
  },
  "cursor-rectangle-selection-02": {
    labels: ["cursor", "rectangle", "selection"],
    description: "Pointer of `cursor-01` with a dashed square selection badge in the upper right.",
  },
  "cursor-remove-selection-02": {
    labels: ["cursor", "remove", "selection"],
    description:
      "Pointer of `cursor-01` with a cross badge in the upper right: clear the selection.",
  },
  "diagonal-scroll-point-02": {
    labels: ["diagonal", "scroll", "point"],
    description:
      "The scroll anchor of `diagonal-scroll-point-01` with two arrowheads only, on one diagonal.",
  },
  "diamond-02": {
    labels: ["diamond"],
    description:
      "A cut gem with a flat table: crown facets above a girdle, the pavilion narrowing to a point.",
  },
  "dice-faces-04": {
    labels: ["dice", "faces"],
    description: "The die of `dice` showing four, one pip in each corner.",
  },
  "dim-sum-02": {
    labels: ["dim", "sum"],
    description:
      "A dumpling: a round bun with its pleats gathered at the top in the secondary tone.",
  },
  "dish-02": {
    labels: ["dish"],
    description: "A steaming bowl: two wisps of steam in the secondary tone over a bowl on a foot.",
  },
  "download-circle-02": {
    labels: ["download", "circle"],
    description:
      "Download in a ring: the ring of `add-circle`, the arrow of `download-square-01` in the secondary tone.",
  },
  "mouse-02": {
    labels: ["mouse"],
    description:
      "Two-button mouse: the body of `mouse-01`, one pixel wider, split by a line between the buttons, no wheel.",
  },
  "mouse-right-click-02": {
    labels: ["mouse", "right", "click"],
    description:
      "Mouse with its right button highlighted and two click rays at its upper right, in the secondary tone: `mouse-left-click-01` mirrored.",
  },
  "move-01": {
    labels: ["move"],
    description: "Light move: a one-pixel cross with a small arrowhead at each end.",
  },
  "move-02": {
    labels: ["move"],
    description:
      "Move: four solid arrowheads pointing outwards around a centre dot in the secondary tone.",
  },
  "music-note-03": {
    labels: ["music", "note"],
    description: "Quarter note: the solid head and stem of `music-note-02`, without the flag.",
  },
  "music-note-04": {
    labels: ["music", "note"],
    description: "Half note: a hollow slanted head on a stem.",
  },
  "navigation-2": {
    labels: ["navigation"],
    description:
      "Navigation arrowhead pointing up, in outline: `navigation-2-off` without its stroke.",
  },
  "note-02": {
    labels: ["note"],
    description:
      "Sticky note: the sheet of `note-01` with its fold at the lower right, the lines in the secondary tone.",
  },
  "package-01": {
    labels: ["package"],
    description:
      "Parcel seen from the front: a box with its lid seam, the tape on the lid in the secondary tone.",
  },
  "parabola-02": {
    labels: ["parabola"],
    description:
      "Downward parabola in the secondary tone over two axes: `parabola-01` turned over.",
  },
  "paragraph-bullets-point-02": {
    labels: ["paragraph", "bullets", "point"],
    description:
      "Bulleted paragraphs: two bullets in the secondary tone, each with a long first line and a shorter indented second line.",
  },
  "pie-chart-02": {
    labels: ["pie", "chart"],
    description:
      "Pie chart at one half: the ring of `pie-chart` with its right half filled in the secondary tone.",
  },
  "pie-chart-03": {
    labels: ["pie", "chart"],
    description:
      "Pie chart at three quarters: the ring of `pie-chart` filled in the secondary tone except its",
  },
  "pie-chart-04": {
    labels: ["pie", "chart"],
    description:
      "Exploded pie chart: a pie with its upper right quarter pulled out, the slice in the secondary",
  },
  "plant-02": {
    labels: ["plant"],
    description:
      "Sprout: the two leaves of `plant-01` in the secondary tone on a short stem rising from the",
  },
  "play-list-favourite-02": {
    labels: ["play", "list", "favourite"],
    description:
      "Favourite playlist: lines of a list with the heart badge of `play-list-favourite-01` in the",
  },
  "plus-minus-02": {
    labels: ["plus", "minus"],
    description: "Plus over minus: a small plus, a slash and a small minus, one-pixel strokes.",
  },
  "plus-minus-square-02": {
    labels: ["plus", "minus", "square"],
    description:
      "Plus and minus split: `square` cut by a diagonal, a plus above it and a minus below in the",
  },
  "presentation-02": {
    labels: ["presentation"],
    description:
      "Presentation with text: the board of `presentation-01` with two lines of text in the secondary",
  },
  "presentation-03": {
    labels: ["presentation"],
    description:
      "Projector screen: a screen hanging from its roller, a pull cord in the secondary tone.",
  },
  "progress-02": {
    labels: ["progress"],
    description: "Progress bar: a rounded bar about two thirds filled in the secondary tone.",
  },
  "progress-03": {
    labels: ["progress"],
    description:
      "Progress at three quarters: the ring of `progress-01` drawn solid in the secondary tone except",
  },
  "pulse-rectangle-02": {
    labels: ["pulse", "rectangle"],
    description:
      "Pulse in a rectangle: `rectangle-horizontal` crossed by a pulse line in the secondary tone.",
  },
  "quiz-03": {
    labels: ["quiz"],
    description:
      "Quiz flashcards: two stacked cards, a question mark on the front one in the secondary tone.",
  },
  "restaurant-02": {
    labels: ["restaurant"],
    description: "Restaurant: a serving cloche with its knob, on a tray.",
  },
  "robot-02": {
    labels: ["robot"],
    description:
      "Robot head: the head of `robot-01` with its antenna and ears, eyes in the secondary tone.",
  },
  "workflow-circle-02": {
    labels: ["workflow", "circle"],
    description:
      "Workflow: a round start node in the secondary tone branching to two round nodes. Built on `workflow-circle-01`.",
  },
  "workflow-square-02": {
    labels: ["workflow", "square"],
    description:
      "Workflow: a square start node in the secondary tone branching to two square nodes. Built on `workflow-square-01`.",
  },
  "workflow-square-03": {
    labels: ["workflow", "square"],
    description:
      "Workflow: three square nodes stepping down by elbows, the last in the secondary tone. Built on `workflow-square-01`.",
  },
  "workflow-square-04": {
    labels: ["workflow", "square"],
    description:
      "Workflow: four square nodes joined in a loop, one in the secondary tone. Built on `workflow-square-01`.",
  },
  "xls-02": {
    labels: ["xls"],
    description: "XLS: the letters X, L and S alone, as `xls-01` without the sheet.",
  },
  "xml-02": {
    labels: ["xml"],
    description: "XML: the letters X, M and L alone, as `xml-01` without the sheet.",
  },
  "xsl-02": {
    labels: ["xsl"],
    description: "XSL: the letters X, S and L alone, as `xsl-01` without the sheet.",
  },
  "yoga-02": {
    labels: ["yoga"],
    description:
      "Yoga: a person standing in the tree pose, hands joined over the head, one foot on the other leg, the head in the secondary tone.",
  },
  "yoga-03": {
    labels: ["yoga"],
    description:
      "Yoga: a person in the warrior pose, arms spread level, front knee bent, back leg straight, the head in the secondary tone.",
  },
  "root-02": {
    labels: ["root"],
    description:
      "Square root: the radical sign with its overline, the quantity under it in the secondary tone.",
  },
  "rotate-360": {
    labels: ["rotate"],
    description:
      "Rotate 360\u00b0: a flat orbit drawn as an ellipse, ending in an arrowhead at the front.",
  },
  "rotate-left-02": {
    labels: ["rotate", "left"],
    description:
      "Rotate anticlockwise about a point: the arrow of `rotate-left-01` around a pivot in the secondary tone.",
  },
  "rotate-right-02": {
    labels: ["rotate", "right"],
    description: "Rotate clockwise about a point: `rotate-left-02` mirrored.",
  },
  "route-03": {
    labels: ["route"],
    description:
      "Route: a start node, a path turning twice, a flag in the secondary tone at the destination.",
  },
  "screen-add-to-home-02": {
    labels: ["screen", "add", "to"],
    description:
      "Add to home screen: a wide phone with a plus in the secondary tone on its screen.",
  },
  "send-to-mobile-02": {
    labels: ["send", "to", "mobile"],
    description:
      "Send to mobile: an arrow in the secondary tone pointing into a phone on the right.",
  },
  "signal-low-02": {
    labels: ["signal", "low"],
    description:
      "Low signal: the wedge of `signal-full-02` lit only at its foot, the rest in the secondary tone.",
  },
  "signal-medium-02": {
    labels: ["signal", "medium"],
    description:
      "Medium signal: the wedge of `signal-full-02` lit up to two thirds, the rest in the secondary tone.",
  },
  "signal-no-02": {
    labels: ["signal", "no"],
    description:
      "No signal: the wedge of `signal-full-02` all unlit in the secondary tone, with the cross of `signal-no-01`.",
  },
  "smart-phone-landscape-02": {
    labels: ["smart", "phone", "landscape"],
    description:
      "A smartphone turned on its side; `smart-phone-02` rotated, the notch in the secondary tone on the left.",
  },
  "sorting-02": {
    labels: ["sorting"],
    description:
      "Sort: an arrow up beside an arrow down, one-pixel lines, heads of `sorting-a-z-01`.",
  },
  "sorting-03": {
    labels: ["sorting"],
    description: "Sort: a solid caret up above a solid caret down, as on a table header.",
  },
  "square-arrow-down-03": {
    labels: ["square", "arrow", "down"],
    description: "Arrow down leaving the frame of `square`: `square-arrow-up-03` flipped.",
  },
  "square-arrow-left-03": {
    labels: ["square", "arrow", "left"],
    description: "Arrow left leaving the frame of `square`: `square-arrow-up-03` turned.",
  },
  "square-arrow-right-03": {
    labels: ["square", "arrow", "right"],
    description: "Arrow right leaving the frame of `square`: `square-arrow-left-03` mirrored.",
  },
  "square-arrow-up-03": {
    labels: ["square", "arrow", "up"],
    description:
      "Arrow up leaving the frame of `square`: the arrow of `square-arrow-up-01` breaks through the top side.",
  },
  "square-unlock-02": {
    labels: ["square", "unlock"],
    description:
      "`square-lock-02` opened: the outline padlock with its shackle raised, its right leg free of a shorter body.",
  },
  "store-add-02": {
    labels: ["store", "add"],
    description:
      "A shop front with an awning and a plus badge. Base from `store-01`, the awning in the primary tone.",
  },
  "store-location-02": {
    labels: ["store", "location"],
    description:
      "A shop front with an awning and a location pin badge. Base from `store-01`, the awning in the primary tone.",
  },
  "store-management-02": {
    labels: ["store", "management"],
    description:
      "A shop front with an awning and a cog badge. Base from `store-01`, the awning in the primary tone.",
  },
  "store-remove-02": {
    labels: ["store", "remove"],
    description:
      "A shop front with an awning and a minus badge. Base from `store-01`, the awning in the primary tone.",
  },
  "store-verified-02": {
    labels: ["store", "verified"],
    description:
      "A shop front with an awning and a check badge. Base from `store-01`, the awning in the primary tone.",
  },
  "structure-03": {
    labels: ["structure"],
    description:
      "Structure: a root node and two children in an indented tree, joined by one-pixel elbows.",
  },
  "structure-04": {
    labels: ["structure"],
    description:
      "Structure: a root node on the left branching to two nodes on the right, one-pixel connectors.",
  },
  "super-intelligence-01": {
    labels: ["super", "intelligence"],
    description:
      "Super intelligence: the letters S and I of `super-intelligence` in the ring of `circle`.",
  },
  "swipe-right-02": {
    labels: ["swipe", "right"],
    description:
      "A touch point with an arrow to the right in the secondary tone: swipe right, without the hand of `swipe-right-01`.",
  },
  "swipe-right-03": {
    labels: ["swipe", "right"],
    description:
      "Two touch points, each with an arrow to the right in the secondary tone: a two-finger swipe right.",
  },
  "swipe-up-02": {
    labels: ["swipe", "up"],
    description:
      "A touch point with an arrow up in the secondary tone: swipe up; `swipe-right-02` turned.",
  },
  "swipe-up-03": {
    labels: ["swipe", "up"],
    description:
      "Two touch points, each with an arrow up in the secondary tone: a two-finger swipe up; `swipe-right-03` turned.",
  },
  "tally-2": {
    labels: ["tally"],
    description: "Tally marks: two upright strokes, the stroke of `tally-1`.",
  },
  "tally-3": {
    labels: ["tally"],
    description: "Tally marks: three upright strokes, the stroke of `tally-1`.",
  },
  "tally-4": {
    labels: ["tally"],
    description: "Tally marks: four upright strokes two pixels apart, the stroke of `tally-1`.",
  },
  "tally-5": {
    labels: ["tally"],
    description:
      "Tally marks: four upright strokes crossed by a 45\u00b0 fifth stroke in the secondary tone.",
  },
  "task-daily-02": {
    labels: ["task", "daily"],
    description:
      "Daily task: the boxes of `task-01` with a calendar badge in the secondary tone in place of the second task's line.",
  },
  "tiff-02": {
    labels: ["tiff"],
    description:
      "TIFF file: the top of `file-01` over the letters T, I, F and F of `tiff-01` in the secondary tone, as in `wav-01`.",
  },
  "time-setting-02": {
    labels: ["time", "setting"],
    description:
      "Clock of `clock-01` with the cog badge of `calendar-cog` in the secondary tone: time settings.",
  },
  "tired-02": {
    labels: ["tired"],
    description:
      "Yawning face: the round face of `tired-01` with closed eyes and an open mouth in the secondary tone.",
  },
  "touchpad-02": {
    labels: ["touchpad"],
    description:
      "Touchpad of `touchpad-01` with a ring-shaped touch point in the secondary tone on a taller pad and a one-row button strip.",
  },
  "tree-02": {
    labels: ["tree"],
    description: "Tree with a three-lobed canopy on the trunk of `tree-01` in the secondary tone.",
  },
  "txt-02": {
    labels: ["txt"],
    description:
      "TXT file: the top of `file-01` over the letters T, X and T in the secondary tone, as in `wav-01`.",
  },
  "underpants-02": {
    labels: ["underpants"],
    description: "Boxer shorts: the waistband of `underpants-01` over two short legs.",
  },
  "upload-03": {
    labels: ["upload"],
    description:
      "Upload to the top: the thin arrow of `upload-01` in the secondary tone rising to a bar.",
  },
  "upload-square-02": {
    labels: ["upload", "square"],
    description:
      "Upload in a square: the frame of `square-arrow-up-01` around an arrow over a tray line in the secondary tone.",
  },
  "user-multiple-03": {
    labels: ["user", "multiple"],
    description:
      "Two people staggered: a person of `user-multiple` in front and a second one behind in the secondary tone.",
  },
  "wav-02": {
    labels: ["wav"],
    description:
      "WAV: the three letters W, A and V of `wav-01`, without the file, in the style of `tiff-01`.",
  },
  "web-design-02": {
    labels: ["web", "design"],
    description:
      "Web design: the browser window of `web-design-01` cut back around a pencil in the secondary tone.",
  },
  "weight-scale-01": {
    labels: ["weight", "scale"],
    description:
      "Bathroom scale: a square platform with a reading window in the secondary tone; the kitchen scale is `weight-scale`.",
  },
  "disc-album": {
    labels: ["disc", "album"],
    description: "Album: a vinyl disc inside its square sleeve, the label in the secondary tone.",
  },
  "discount-tag-01": {
    labels: ["discount", "tag"],
    description:
      "Discount tag: an upright price tag with its hole, a percent sign in the secondary tone.",
  },
  "dish-washer": {
    labels: ["dish", "washer"],
    description:
      "Dishwasher: an appliance box with a control strip and a round door window, the water in the secondary tone.",
  },
  "divide-sign-square": {
    labels: ["divide", "sign", "square"],
    description:
      "Division sign in the rounded box of `plus-sign-square`, the sign in the secondary tone.",
  },
  "drag-drop": {
    labels: ["drag", "drop"],
    description: "Drag handle: three rows of three square dots.",
  },
  drum: {
    labels: ["drum"],
    description:
      "Drum: two crossed sticks in the secondary tone over the drumhead, the shell with two lugs.",
  },
  "dump-truck": {
    labels: ["dump", "truck"],
    description:
      "Dump truck: the tipping bed raised at the back, a cab and two wheels in the secondary tone.",
  },
  "ear-off": {
    labels: ["ear", "off"],
    description: "Ear struck through: `ear` with a 45\u00b0 slash in the secondary tone.",
  },
  "edit-off": {
    labels: ["edit", "off"],
    description:
      "Edit off: the pencil of `edit-02` struck by a 45\u00b0 slash in the secondary tone.",
  },
  eggs: {
    labels: ["eggs"],
    description: "Eggs: two small eggs, the one in front overlapping the one behind.",
  },
  elder: {
    labels: ["elder"],
    description: "Elderly person: a figure leaning on a walking cane in the secondary tone.",
  },
  "electricity-stack": {
    labels: ["electricity", "stack"],
    description:
      "Electricity stack: a box with a lightning bolt in the secondary tone, a second box behind it.",
  },
  "energy-ellipse": {
    labels: ["energy", "ellipse"],
    description: "A circle with the lightning bolt of `energy-rectangle` in the secondary tone.",
  },
  engine: {
    labels: ["engine"],
    description:
      "Engine: a block with a filler cap on top, an intake on the left and an outlet on the right.",
  },
  "ev-charger": {
    labels: ["ev", "charger"],
    description:
      "EV charger: the pump of `fuel-station` with a lightning bolt in the secondary tone.",
  },
  "discount-tag-01-fill": {
    reference:
      "Filled variant of our own `discount-tag-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "discount"],
    description:
      "Filled: discount tag: an upright price tag with its hole, a percent sign in the secondary tone.",
  },
  "divide-sign-square-fill": {
    reference:
      "Filled variant of our own `divide-sign-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "divide"],
    description:
      "Filled: division sign in the rounded box of `plus-sign-square`, the sign in the secondary tone.",
  },
  "energy-ellipse-fill": {
    reference:
      "Filled variant of our own `energy-ellipse`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "energy"],
    description:
      "Filled: a circle with the lightning bolt of `energy-rectangle` in the secondary tone.",
  },
  "badge-indian-rupee": {
    labels: ["badge", "indian", "rupee"],
    description:
      "Badge indian rupee: the badge rosette with an Indian rupee sign in the secondary tone.",
  },
  "badge-japanese-yen": {
    labels: ["badge", "japanese", "yen"],
    description: "Badge japanese yen: the badge rosette with a yen sign in the secondary tone.",
  },
  "badge-swiss-franc": {
    labels: ["badge", "swiss", "franc"],
    description: "Badge swiss franc: the badge rosette with a franc sign in the secondary tone.",
  },
  baseline: {
    labels: ["baseline"],
    description: "Baseline: a letter A standing on a baseline drawn in the secondary tone.",
  },
  "bbq-grill": {
    labels: ["bbq", "grill"],
    description:
      "Bbq grill: a kettle barbecue: two sausages on the grate, the bowl and three legs.",
  },
  beater: {
    labels: ["beater"],
    description: "Beater: a whisk: a loop of wires on a hollow handle.",
  },
  "bell-electric": {
    labels: ["bell", "electric"],
    description: "Bell electric: a bell with a lightning bolt in the secondary tone.",
  },
  blender: {
    labels: ["blender"],
    description: "Blender: a blender: a jar with a handle and a blade on a motor base.",
  },
  blinds: {
    labels: ["blinds"],
    description: "Blinds: window blinds: a head rail, three slats and the pull cord.",
  },
  "book-dashed": {
    labels: ["book", "dashed"],
    description: "Book dashed: the book with its cover drawn as a dashed outline.",
  },
  "book-text": {
    labels: ["book", "text"],
    description: "Book text: the book with three lines of text on its cover.",
  },
  "bookmark-block-01": {
    labels: ["bookmark", "block"],
    description: "Bookmark block 01: the bookmark with a blocked sign in the shared badge corner.",
  },
  "bookmark-block-02": {
    labels: ["bookmark", "block"],
    description:
      "Bookmark block 02: the labelled bookmark with a blocked sign in the shared badge corner.",
  },
  "bounce-left": {
    labels: ["bounce", "left"],
    description: "Bounce left: a ball bouncing to the left: two arcs and the ball.",
  },
  "bounce-right": {
    labels: ["bounce", "right"],
    description: "Bounce right: a ball bouncing to the right: two arcs and the ball.",
  },
  "bow-tie": {
    labels: ["bow", "tie"],
    description: "Bow tie: a bow tie: two triangles tied by a knot.",
  },
  bridge: {
    labels: ["bridge"],
    description: "Bridge: a suspension bridge: two towers, the cables and the deck.",
  },
  broccoli: {
    labels: ["broccoli"],
    description: "Broccoli: a broccoli: three bumpy florets on a branching stem.",
  },
  cable: {
    labels: ["cable"],
    description: "Cable: a cable with a plug at each end.",
  },
  "2nd-bracket-square": {
    labels: ["2nd", "bracket", "square"],
    description: "Square with a pair of curly braces inside in the secondary tone.",
  },
  abacus: {
    labels: ["abacus"],
    description: "Abacus: a frame, two rods and their beads in the secondary tone.",
  },
  "ai-laptop": {
    labels: ["ai", "laptop"],
    description:
      "AI laptop: `laptop` one column left, open at the lower right for the AI sparkle badge in the secondary tone.",
  },
  "ai-programming": {
    labels: ["ai", "programming"],
    description:
      "AI programming: two angle brackets and a steep slash, the AI sparkle badge in the secondary tone.",
  },
  "ai-search": {
    labels: ["ai", "search"],
    description:
      "AI search: the lens of `search-add` with the AI sparkle inside in the secondary tone.",
  },
  "alpha-circle": {
    labels: ["alpha", "circle"],
    description:
      "Alpha in a circle: the ring of `circle` and the letter \u03b1 in the secondary tone.",
  },
  "alpha-square": {
    labels: ["alpha", "square"],
    description:
      "Alpha in a square: the box of `square` and the letter \u03b1 in the secondary tone.",
  },
  amphora: {
    labels: ["amphora"],
    description: "Amphora: a narrow neck, two loop handles, a body tapering to a foot.",
  },
  apricot: {
    labels: ["apricot"],
    description: "Apricot: a round fruit with a dimple, its stem and a leaf in the secondary tone.",
  },
  "alpha-circle-fill": {
    reference:
      "Filled variant of our own `alpha-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "alpha"],
    description:
      "Filled: alpha in a circle: the ring of `circle` and the letter \u03b1 in the secondary tone.",
  },
  "alpha-square-fill": {
    reference:
      "Filled variant of our own `alpha-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "alpha"],
    description:
      "Filled: alpha in a square: the box of `square` and the letter \u03b1 in the secondary tone.",
  },
  "calendar-mortarboard": {
    labels: ["calendar", "mortarboard"],
    description:
      "Calendar of `calendar-add-01` with a mortarboard badge in the lower-right corner: an academic calendar.",
  },
  "calendar-off": {
    labels: ["calendar", "off"],
    description: "Calendar of `calendar-01` crossed by a slash in the secondary tone: no calendar.",
  },
  "calendar-sync": {
    labels: ["calendar", "sync"],
    description:
      "Calendar of `calendar-add-01` with the sync loop of `file-sync` in the lower-right corner.",
  },
  "calendar-user": {
    labels: ["calendar", "user"],
    description:
      "Calendar of `calendar-add-01` with a small person badge in the lower-right corner.",
  },
  camel: {
    labels: ["camel"],
    description: "Camel in profile: two humps, a raised neck and head, four thin legs.",
  },
  carrot: {
    labels: ["carrot"],
    description:
      "Carrot: a solid tapering root pointing down-left, its leaves in the secondary tone.",
  },
  cashback: {
    labels: ["cashback"],
    description: "Cashback: the return arrow ring of `cashback-euro` around a dollar sign.",
  },
  "cashback-yen": {
    labels: ["cashback", "yen"],
    description: "Cashback: the return arrow ring of `cashback-euro` around a yen sign.",
  },
  "check-unread-01": {
    labels: ["check", "unread"],
    description: "Two check marks side by side: delivered, not yet read.",
  },
  cheese: {
    labels: ["cheese"],
    description:
      "Wedge of cheese: a sloped top over a front face with two holes in the secondary tone.",
  },
  cherry: {
    labels: ["cherry"],
    description:
      "Pair of cherries: two round fruits on stems meeting at the top, a leaf in the secondary tone.",
  },
  "chevrons-left-right-ellipsis": {
    labels: ["chevrons", "left", "right"],
    description:
      "A left and a right chevron around three dots in the secondary tone: an expandable range.",
  },
  "chicken-thighs": {
    labels: ["chicken", "thighs"],
    description: "Chicken drumstick: a solid rounded piece of meat on a short bone with a knuckle.",
  },
  "circle-arrow-reload-01": {
    labels: ["circle", "arrow", "reload"],
    description: "Reload: the loop of `square-arrow-reload-01` inside a ring.",
  },
  "circle-parking-off": {
    labels: ["circle", "parking", "off"],
    description: "Parking sign of `parking-area-circle` crossed by a slash in the secondary tone.",
  },
  "circuit-board": {
    labels: ["circuit", "board"],
    description:
      "Circuit board: a square board with a trace between two pads in the secondary tone.",
  },
  "cloud-angled-rain-zap": {
    labels: ["cloud", "angled", "rain"],
    description: "Storm: the cloud and bolt of `cloud-angled-zap` with slanted rain on both sides.",
  },
  "cloud-backup": {
    labels: ["cloud", "backup"],
    description:
      "Cloud of `cloud-cog` with the clock badge of `calendar-clock`: a scheduled backup.",
  },
  "cloud-server": {
    labels: ["cloud", "server"],
    description: "Cloud above a server unit whose status light is in the secondary tone.",
  },
  "cloud-sync": {
    labels: ["cloud", "sync"],
    description: "Cloud of `cloud-cog` with the sync loop of `file-sync`.",
  },
  "coins-01": {
    labels: ["coins"],
    description: "Stack of coins seen from the side, the top coin's face in the secondary tone.",
  },
  "cheese-fill": {
    reference: "Filled variant of our own `cheese`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cheese"],
    description:
      "Filled: wedge of cheese: a sloped top over a front face with two holes in the secondary tone.",
  },
  "coins-euro": {
    labels: ["coins", "euro"],
    description:
      "Two stacked coins (the coins-pound base) with a euro sign on the front coin in the secondary tone.",
  },
  collapse: {
    labels: ["collapse"],
    description:
      "Two chevrons pointing at a line in the secondary tone: content folding toward it.",
  },
  "congruent-to": {
    labels: ["congruent", "to"],
    description: "Congruence sign: a tilde over two bars.",
  },
  connect: {
    labels: ["connect"],
    description:
      "Two plugs facing each other, their prongs in the secondary tone, about to connect.",
  },
  construction: {
    labels: ["construction"],
    description: "Road barrier: a board with diagonal stripes in the secondary tone on two legs.",
  },
  "coordinate-01": {
    labels: ["coordinate"],
    description: "Two axes and a point in the secondary tone.",
  },
  cos: {
    labels: ["cos"],
    description: 'The word "cos" in pixel letters.',
  },
  covariate: {
    labels: ["covariate"],
    description: "Scatter of three points along a trend line in the secondary tone, on two axes.",
  },
  crazy: {
    labels: ["crazy"],
    description:
      "Crazy face: mismatched eyes and a wavy mouth in the secondary tone (the smile base).",
  },
  cube: {
    labels: ["cube"],
    description: "Cube in perspective: front face and the two visible edges behind it.",
  },
  "cursor-hold-01": {
    labels: ["cursor", "hold"],
    description: "Pointer (the cursor-01 base) with a press-and-hold ring in the secondary tone.",
  },
  "cursor-move-01": {
    labels: ["cursor", "move"],
    description: "Pointer (the cursor-01 base) with two motion lines in the secondary tone.",
  },
  curtains: {
    labels: ["curtains"],
    description: "Curtains on a rod, each drape held back by a tie in the secondary tone.",
  },
  "custom-field": {
    labels: ["custom", "field"],
    description:
      "Input field (the input-text base) with a placeholder line and an add sign in the secondary tone.",
  },
  developer: {
    labels: ["developer"],
    description: "Person (the user-settings-01 base) with a command prompt in the secondary tone.",
  },
  "device-access": {
    labels: ["device", "access"],
    description: "Phone (the smartphone base) with a padlock in the secondary tone beside it.",
  },
  "eye-closed": {
    labels: ["eye", "closed"],
    description: "Closed eye: the lower lid of `eye` as an arc, with four lashes.",
  },
  "falling-star": {
    labels: ["falling", "star"],
    description:
      "Falling star: a small star at the upper right and its trail in the secondary tone.",
  },
  fence: {
    labels: ["fence"],
    description: "Fence: three pickets held by two rails, solid.",
  },
  fencing: {
    labels: ["fencing"],
    description: "Fencing: two crossed foils with their guards and grips.",
  },
  "file-archive": {
    labels: ["file", "archive"],
    description:
      "Archived file: the sheet of `file-x`, an archive box badge in the secondary tone at the lower right.",
  },
  "file-attachment": {
    labels: ["file", "attachment"],
    description:
      "File with an attachment: the sheet of `file-x`, the paper clip of `folder-attachment` as a badge.",
  },
  "file-sliders": {
    labels: ["file", "sliders"],
    description:
      "File with sliders: the `file-01` sheet with two slider lines and their knobs in the secondary tone.",
  },
  "file-zip": {
    labels: ["file", "zip"],
    description:
      "Zipped file: the `file-01` sheet with the zipper and pull of `folder-zip` in the secondary tone.",
  },
  "filter-reset": {
    labels: ["filter", "reset"],
    description:
      "Reset filter: a shortened funnel of `filter` and the reset arrow of `reset-password` in the secondary tone.",
  },
  "fishing-rod": {
    labels: ["fishing", "rod"],
    description: "Fishing rod: a rod on the diagonal, its line and hook in the secondary tone.",
  },
  "flowchart-01": {
    labels: ["flowchart"],
    description:
      "Flowchart: a decision diamond branching to two boxes, the links in the secondary tone; the boxes of `flowchart-02`.",
  },
  flushed: {
    labels: ["flushed"],
    description:
      "Flushed face: the round face of `smile`, wide square eyes, a small round mouth and blushing cheeks in the secondary tone.",
  },
  "folder-archive": {
    labels: ["folder", "archive"],
    description:
      "Archived folder: the cut folder of `folder-remove`, an archive box badge in the secondary tone.",
  },
  "folder-transfer": {
    labels: ["folder", "transfer"],
    description:
      "Folder transfer: the cut folder of `folder-remove`, two opposite arrows in the secondary tone.",
  },
  "folder-tree": {
    labels: ["folder", "tree"],
    description: "Folder tree: two small folders hanging off a tree line in the secondary tone.",
  },
  "folder-x": {
    labels: ["folder", "x"],
    description:
      "Folder with a cross: the cut folder of `folder-remove`, the cross badge of `file-x`.",
  },
  "forgot-password": {
    labels: ["forgot", "password"],
    description:
      "Forgotten password: the masked field of `reset-password` and the question mark of `folder-unknown` as a badge.",
  },
  form: {
    labels: ["form"],
    description: "Form: two labelled input fields and a submit button in the secondary tone.",
  },
  gameboy: {
    labels: ["gameboy"],
    description:
      "Handheld console: a tall body with its screen, a cross pad and two buttons in the secondary tone.",
  },
  glove: {
    labels: ["glove"],
    description: "The open hand of the set with a wide cuff in the secondary tone.",
  },
  "gold-ingots": {
    labels: ["gold", "ingots"],
    description: "Gold ingots: three bars stacked, one on two.",
  },
  "golf-bat": {
    labels: ["golf", "bat"],
    description:
      "Golf club: a shaft on the diagonal ending in a solid head, a ball beside it in the secondary tone.",
  },
  "gameboy-fill": {
    reference: "Filled variant of our own `gameboy`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "gameboy"],
    description:
      "Filled: handheld console: a tall body with its screen, a cross pad and two buttons in the secondary tone.",
  },
  "gold-ingots-fill": {
    reference: "Filled variant of our own `gold-ingots`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "gold"],
    description: "Filled: gold ingots: three bars stacked, one on two.",
  },
  haze: {
    labels: ["haze"],
    description: "Haze: half a sun with rays over two haze bands in the secondary tone.",
  },
  heater: {
    labels: ["heater"],
    description:
      "Heater: a radiator panel with vertical fins on feet, three wisps of heat in the secondary tone.",
  },
  "hierarchy-files": {
    labels: ["hierarchy", "files"],
    description:
      "File hierarchy: a file at the root, a bus and two child files, laid out like `hierarchy`.",
  },
  horse: {
    labels: ["horse"],
    description: "Horse: a solid side silhouette walking right, head raised.",
  },
  "hot-tube": {
    labels: ["hot", "tube"],
    description: "Hot tub: a tub with three wisps of steam in the secondary tone.",
  },
  hotspot: {
    labels: ["hotspot"],
    description: "Hotspot: a dot in the secondary tone broadcasting two arcs each side.",
  },
  "hotspot-offline": {
    labels: ["hotspot", "offline"],
    description:
      "Hotspot offline: `hotspot` in the primary tone, struck by a 45\u00b0 slash in the secondary tone.",
  },
  hyperbole: {
    labels: ["hyperbole"],
    description: "Hyperbola: two curves turned back to back, each bending at its vertex.",
  },
  "ice-cream-02": {
    labels: ["ice", "cream"],
    description: "Ice lolly: a rounded bar on a stick.",
  },
  "inequality-square-01": {
    labels: ["inequality", "square"],
    description:
      "A rounded square holding the inequality of `inequality-01` in the secondary tone.",
  },
  "inequality-square-02": {
    labels: ["inequality", "square"],
    description:
      "A rounded square holding the inequality of `inequality-02` in the secondary tone.",
  },
  "input-long-text": {
    labels: ["input", "long", "text"],
    description: "Long text input: a tall field with three lines of text.",
  },
  "input-short-text": {
    labels: ["input", "short", "text"],
    description:
      "Short text input: a field with a short line of text and a cursor in the secondary tone.",
  },
  jumpers: {
    labels: ["jumpers"],
    description: "Jumper: a crew-neck knit with long sleeves and cuffs.",
  },
  "look-bottom": {
    labels: ["look", "bottom"],
    description:
      "A round face looking down: the ring of `dollar-circle` with two eyes, in the secondary tone, near the bottom.",
  },
  "look-left": {
    labels: ["look", "left"],
    description:
      "A round face looking left: the ring of `dollar-circle` with two eyes, in the secondary tone, pushed to the left.",
  },
  "look-right": {
    labels: ["look", "right"],
    description:
      "A round face looking right: the ring of `dollar-circle` with two eyes, in the secondary tone, pushed to the right.",
  },
  "look-top": {
    labels: ["look", "top"],
    description:
      "A round face looking up: the ring of `dollar-circle` with two eyes, in the secondary tone, near the top.",
  },
  lungs: {
    labels: ["lungs"],
    description: "Lungs: two rounded lobes either side of the windpipe.",
  },
  "mail-reply-all-01": {
    labels: ["mail", "reply", "all"],
    description: "Envelope of `mail-reply-01` with a double reply arrow in the secondary tone.",
  },
  "map-minus": {
    labels: ["map", "minus"],
    description: "Folded map of `map-plus` with a minus badge in the secondary tone.",
  },
  "maps-circle-01": {
    labels: ["maps", "circle"],
    description:
      "Map in a circle: the ring of `dollar-circle`, a road cutting the lower-left edge and a pin, in the secondary tone.",
  },
  "maps-off": {
    labels: ["maps", "off"],
    description: "Folded map of `maps` struck by a 45\u00b0 slash in the secondary tone.",
  },
  "maps-square-01": {
    labels: ["maps", "square"],
    description:
      "Map in a rounded square: a road cutting the lower-left corner and a pin, in the secondary tone.",
  },
  maze: {
    labels: ["maze"],
    description:
      "Maze: a square with an entrance at the top and an exit at the bottom, walls one pixel apart.",
  },
  "meal-scan": {
    labels: ["meal", "scan"],
    description: "Scan a meal: the brackets of `scan` round an apple in the secondary tone.",
  },
  "medal-second-place": {
    labels: ["medal", "second", "place"],
    description: "Second-place medal: two straps over a large disc with a 2 in the secondary tone.",
  },
  "medal-third-place": {
    labels: ["medal", "third", "place"],
    description: "Third-place medal: two straps over a large disc with a 3 in the secondary tone.",
  },
  "medicine-syrup": {
    labels: ["medicine", "syrup"],
    description: "Syrup bottle: a cap, a short neck and a body with a drop in the secondary tone.",
  },
  mentor: {
    labels: ["mentor"],
    description:
      "Mentor: a person beside a board with lines of text, the lines in the secondary tone.",
  },
  "message-square-diff": {
    labels: ["message", "square", "diff"],
    description:
      "Square speech bubble of `message-square-x` with a plus over a minus inside, in the secondary tone.",
  },
  "message-square-quote": {
    labels: ["message", "square", "quote"],
    description:
      "Square speech bubble of `message-square-x` with two quotation marks inside, in the secondary tone.",
  },
  "mic-vocal": {
    labels: ["mic", "vocal"],
    description: "Handheld microphone: a round head and a handle on a 45\u00b0 slope.",
  },
  microscope: {
    labels: ["microscope"],
    description:
      "Microscope: an eyepiece tube on an arm over a stage with a slide in the secondary tone, on a base.",
  },
  "milk-carton": {
    labels: ["milk", "carton"],
    description:
      "Milk carton in perspective: a fin on the gable, the front and side panels, a label band in the secondary tone.",
  },
  "money-receive-flow-01": {
    labels: ["money", "receive", "flow"],
    description:
      "Banknote with an arrow flowing in from the right and up into it, in the secondary tone.",
  },
  "monitor-cog": {
    labels: ["monitor", "cog"],
    description: "Monitor with a cog on its screen in the secondary tone.",
  },
  moonset: {
    labels: ["moonset"],
    description:
      "Moonset: a crescent sinking below the horizon, with a down arrow in the secondary tone.",
  },
  "lungs-fill": {
    reference: "Filled variant of our own `lungs`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "lungs"],
    description: "Filled: lungs: two rounded lobes either side of the windpipe.",
  },
  "medicine-syrup-fill": {
    reference:
      "Filled variant of our own `medicine-syrup`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "medicine"],
    description:
      "Filled: syrup bottle: a cap, a short neck and a body with a drop in the secondary tone.",
  },
  replay: {
    labels: ["replay"],
    description:
      "Replay: the open circle of `rotate-left-01` with a play triangle inside in the secondary tone.",
  },
  repository: {
    labels: ["repository"],
    description:
      "Repository: a book-shaped page with two lines of text and a bookmark ribbon hanging below in the secondary tone.",
  },
  "resize-field": {
    labels: ["resize", "field"],
    description: "Resize grip: two parallel 45\u00b0 strokes in the lower-right corner.",
  },
  "resize-field-rectangle": {
    labels: ["resize", "field", "rectangle"],
    description:
      "Field with a resize grip: a rounded box with two short 45\u00b0 strokes in its lower-right corner in the secondary tone.",
  },
  "resources-add": {
    labels: ["resources", "add"],
    description:
      "Resources add: three small shapes in a two-by-two grid, a plus in the secondary tone in the fourth place.",
  },
  "resources-remove": {
    labels: ["resources", "remove"],
    description:
      "Resources remove: three small shapes in a two-by-two grid, a minus in the secondary tone in the fourth place.",
  },
  ripple: {
    labels: ["ripple"],
    description: "Ripple: a dot in the secondary tone, a ring around it and two outer arcs.",
  },
  "rocking-chair": {
    labels: ["rocking", "chair"],
    description: "Rocking chair: the side-view chair of `chair-01` on a curved rocker.",
  },
  "root-1st-bracket": {
    labels: ["root", "1st", "bracket"],
    description:
      "Square root in parentheses: the radical of `square-radical` in the secondary tone between two round brackets.",
  },
  "root-2nd-bracket": {
    labels: ["root", "2nd", "bracket"],
    description:
      "Square root in braces: the radical of `square-radical` in the secondary tone between two curly brackets.",
  },
  "root-3rd-bracket": {
    labels: ["root", "3rd", "bracket"],
    description:
      "Square root in square brackets: the radical of `square-radical` in the secondary tone between two square brackets.",
  },
  "root-circle": {
    labels: ["root", "circle"],
    description:
      "Square root in a circle: the radical of `square-radical` in the secondary tone inside a round outline.",
  },
  rose: {
    labels: ["rose"],
    description: "Rose: a closed bloom on a stem with one leaf.",
  },
  "rows-4": {
    labels: ["rows"],
    description: "Four rows: four solid horizontal bars stacked.",
  },
  "sad-dizzy": {
    labels: ["sad", "dizzy"],
    description:
      "Dizzy sad face: the face of `sad-01` with two crosses for eyes and a frown in the secondary tone.",
  },
  sandwich: {
    labels: ["sandwich"],
    description:
      "Sandwich: two slices of bread with a layer of filling in the secondary tone between them.",
  },
  satellite: {
    labels: ["satellite"],
    description:
      "Satellite: a body with a dish in the secondary tone on top and a solar panel on each side.",
  },
  "satellite-dish": {
    labels: ["satellite", "dish"],
    description:
      "Satellite dish: a tilted bowl with its feed arm and head in the secondary tone, on a short stand.",
  },
  "scan-eye": {
    labels: ["scan", "eye"],
    description:
      "Scan eye: the corners of `scan` around a small eye whose pupil is in the secondary tone.",
  },
  "scissors-line-dashed": {
    labels: ["scissors", "line", "dashed"],
    description: "Cut here: small scissors pointing right and a dashed line in the secondary tone.",
  },
  "scooter-electric": {
    labels: ["scooter", "electric"],
    description:
      "Electric scooter: the scooter of `scooter-01` with a lightning bolt in the secondary tone.",
  },
  "scratch-card": {
    labels: ["scratch", "card"],
    description:
      "Scratch card: a card whose panel is half scratched off, the scratch coating in the secondary tone.",
  },
  "semi-truck": {
    labels: ["semi", "truck"],
    description:
      "Semi truck: a long trailer coupled to a cab with a sloped windscreen, three pairs of wheels in the secondary tone.",
  },
  "send-horizontal": {
    labels: ["send", "horizontal"],
    description: "Send: a paper plane pointing right, with its notch on the left.",
  },
  "server-off": {
    labels: ["server", "off"],
    description:
      "Server off: the two units of `server-stack-01` crossed by a slash in the secondary tone.",
  },
  "repository-fill": {
    reference: "Filled variant of our own `repository`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "repository"],
    description:
      "Filled: repository: a book-shaped page with two lines of text and a bookmark ribbon hanging below in the secondary tone.",
  },
  "resize-field-rectangle-fill": {
    reference:
      "Filled variant of our own `resize-field-rectangle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "resize"],
    description:
      "Filled: field with a resize grip: a rounded box with two short 45\u00b0 strokes in its lower-right corner in the secondary tone.",
  },
  "root-circle-fill": {
    reference: "Filled variant of our own `root-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "root"],
    description:
      "Filled: square root in a circle: the radical of `square-radical` in the secondary tone inside a round outline.",
  },
  "sad-dizzy-fill": {
    reference: "Filled variant of our own `sad-dizzy`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "sad"],
    description:
      "Filled: dizzy sad face: the face of `sad-01` with two crosses for eyes and a frown in the secondary tone.",
  },
  "scratch-card-fill": {
    reference:
      "Filled variant of our own `scratch-card`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "scratch"],
    description:
      "Filled: scratch card: a card whose panel is half scratched off, the scratch coating in the secondary tone.",
  },
  "send-horizontal-fill": {
    reference:
      "Filled variant of our own `send-horizontal`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "send"],
    description: "Filled: send: a paper plane pointing right, with its notch on the left.",
  },
  kayak: {
    labels: ["kayak"],
    description: "Kayak: a long pointed hull, a double paddle above it in the secondary tone.",
  },
  "keyframe-add": {
    labels: ["keyframe", "add"],
    description: "Keyframe with a plus: a diamond, a plus badge in the secondary tone.",
  },
  "keyframe-align-center": {
    labels: ["keyframe", "align", "center"],
    description:
      "Keyframe centred on two guides: a diamond, the cross guides in the secondary tone.",
  },
  "keyframe-align-horizontal": {
    labels: ["keyframe", "align", "horizontal"],
    description: "Keyframe on a horizontal guide: a diamond, the guide in the secondary tone.",
  },
  "keyframe-align-vertical": {
    labels: ["keyframe", "align", "vertical"],
    description: "Keyframe on a vertical guide: a diamond, the guide in the secondary tone.",
  },
  "keyframe-bottom": {
    labels: ["keyframe", "bottom"],
    description:
      "Keyframe aligned to the bottom: a diamond over a guide line in the secondary tone.",
  },
  "keyframe-left": {
    labels: ["keyframe", "left"],
    description:
      "Keyframe aligned to the left: a diamond beside a guide line in the secondary tone.",
  },
  "keyframe-remove": {
    labels: ["keyframe", "remove"],
    description: "Keyframe with a minus: a diamond, a minus badge in the secondary tone.",
  },
  "keyframe-right": {
    labels: ["keyframe", "right"],
    description:
      "Keyframe aligned to the right: a diamond beside a guide line in the secondary tone.",
  },
  "keyframe-top": {
    labels: ["keyframe", "top"],
    description: "Keyframe aligned to the top: a diamond under a guide line in the secondary tone.",
  },
  "keyframes-double": {
    labels: ["keyframes", "double"],
    description: "Two keyframes: a diamond with the edge of a second one behind it.",
  },
  "keyframes-double-add": {
    labels: ["keyframes", "double", "add"],
    description: "Two keyframes with a plus badge in the secondary tone.",
  },
  "keyframes-double-remove": {
    labels: ["keyframes", "double", "remove"],
    description: "Two keyframes with a minus badge in the secondary tone.",
  },
  "keyframes-multiple": {
    labels: ["keyframes", "multiple"],
    description: "Several keyframes: a diamond with the edges of two more behind it.",
  },
  "keyframes-multiple-add": {
    labels: ["keyframes", "multiple", "add"],
    description: "Several keyframes with a plus badge in the secondary tone.",
  },
  "keyframes-multiple-remove": {
    labels: ["keyframes", "multiple", "remove"],
    description: "Several keyframes with a minus badge in the secondary tone.",
  },
  kite: {
    labels: ["kite"],
    description: "Kite: a diamond kite with its cross spars in the secondary tone and a tail.",
  },
  "knife-bread": {
    labels: ["knife", "bread"],
    description:
      "Bread knife: a handle and a long blade with a serrated edge in the secondary tone.",
  },
  kurta: {
    labels: ["kurta"],
    description: "Kurta: a long tunic with long sleeves, the neck placket in the secondary tone.",
  },
  lake: {
    labels: ["lake"],
    description: "Lake: two peaks over a shoreline and the water's waves in the secondary tone.",
  },
  "lamp-wall-down": {
    labels: ["lamp", "wall", "down"],
    description:
      "Wall lamp pointing down: a wall bracket, an arm, a shade, the light in the secondary tone.",
  },
  "lamp-wall-up": {
    labels: ["lamp", "wall", "up"],
    description:
      "Wall lamp pointing up: a wall bracket, an arm, a shade, the light in the secondary tone.",
  },
  "land-plot": {
    labels: ["land", "plot"],
    description:
      "Land plot: a parcel of ground with a flag on a pole, the flag in the secondary tone.",
  },
  "lasso-select": {
    labels: ["lasso", "select"],
    description: "Lasso select: a dashed selection loop and a pointer in the secondary tone.",
  },
  "layer-add": {
    labels: ["layer", "add"],
    description: "Add a layer: a stack of sheets with a plus badge in the secondary tone.",
  },
  "layout-right": {
    labels: ["layout", "right"],
    description: "Layout with a right panel: a frame whose right column is in the secondary tone.",
  },
  "layout-template": {
    labels: ["layout", "template"],
    description: "Layout template: a wide header block over a large and a narrow block.",
  },
  lectern: {
    labels: ["lectern"],
    description: "Lectern: a reading desk on a post with a base.",
  },
  "lens-convex": {
    labels: ["lens", "convex"],
    description: "Convex lens: a lens that bulges on both sides.",
  },
  lighthouse: {
    labels: ["lighthouse"],
    description: "Lighthouse: a tapering tower with a lamp room, its beams in the secondary tone.",
  },
  "limit-order": {
    labels: ["limit", "order"],
    description: "Limit order: two price candles under a dashed limit line in the secondary tone.",
  },
  "list-filter": {
    labels: ["list", "filter"],
    description: "List filter: three centred lines getting shorter.",
  },
  "list-todo": {
    labels: ["list", "todo"],
    description:
      "To-do list: a checked item in the secondary tone and an empty box, each with a line.",
  },
  "location-check-01": {
    labels: ["location", "check"],
    description: "The shared map pin with a one-pixel check badge in the secondary tone.",
  },
  "location-update-01": {
    labels: ["location", "update"],
    description: "The shared map pin with a one-headed circular arrow badge in the secondary tone.",
  },
  "more-or-less-square": {
    labels: ["more", "or", "less"],
    description: "Square with a plus above a minus in the secondary tone.",
  },
  mortar: {
    labels: ["mortar"],
    description: "Mortar bowl on a flat foot with a pestle resting in it.",
  },
  "mouse-pointer-off": {
    labels: ["mouse", "pointer", "off"],
    description: "Pointer arrow crossed by a diagonal slash in the secondary tone.",
  },
  "n-th-root-circle": {
    labels: ["n", "th", "root"],
    description: "Radical sign in the secondary tone inside a circle.",
  },
  "napkins-01": {
    labels: ["napkins"],
    description: "Two folded triangular napkins, one laid over the other.",
  },
  "no-meeting-room": {
    labels: ["no", "meeting", "room"],
    description: "Door with a no-entry sign in the secondary tone.",
  },
  "non-binary": {
    labels: ["non", "binary"],
    description:
      "Non-binary symbol: a circle with a stem topped by an asterisk in the secondary tone.",
  },
  "notification-block-01": {
    labels: ["notification", "block"],
    description: "Bell with a no-entry sign in the secondary tone.",
  },
  "notification-block-02": {
    labels: ["notification", "block"],
    description: "Round-topped bell with a no-entry sign in the secondary tone.",
  },
  "notification-block-03": {
    labels: ["notification", "block"],
    description: "Ringing bell with a no-entry sign in the secondary tone.",
  },
  "nut-off": {
    labels: ["nut", "off"],
    description: "Hexagon nut crossed by a diagonal slash in the secondary tone.",
  },
  "octagon-x": {
    labels: ["octagon", "x"],
    description: "Octagon with an X in the secondary tone.",
  },
  octopus: {
    labels: ["octopus"],
    description: "Octopus: a domed head with two eyes and four curling tentacles.",
  },
  "online-learning-01": {
    labels: ["online", "learning"],
    description: "Graduation cap in the secondary tone above a laptop.",
  },
  "online-learning-03": {
    labels: ["online", "learning"],
    description: "Small graduation cap in the secondary tone above a smartphone.",
  },
  "options-call": {
    labels: ["options", "call"],
    description: "Square with a capital C in the secondary tone, for a call option.",
  },
  "package-open": {
    labels: ["package", "open"],
    description: "Open box seen from the front with its two flaps folded out.",
  },
  "paint-bucket": {
    labels: ["paint", "bucket"],
    description: "Bucket with a handle and a drop of paint in the secondary tone.",
  },
  panda: {
    labels: ["panda"],
    description: "Panda head with round ears, eye patches and a nose.",
  },
  paragliding: {
    labels: ["paragliding"],
    description: "Paraglider canopy with lines down to a pilot in the secondary tone.",
  },
  "pathfinder-outline": {
    labels: ["pathfinder", "outline"],
    description: "Two overlapping squares, both outlined, as the pathfinder outline mode.",
  },
  patio: {
    labels: ["patio"],
    description: "Patio parasol over a small table.",
  },
  "pen-connect-bluetooth": {
    labels: ["pen", "connect", "bluetooth"],
    description: "Pen with a Bluetooth sign in the secondary tone.",
  },
  "pen-connect-usb": {
    labels: ["pen", "connect", "usb"],
    description: "Pen with a USB plug in the secondary tone.",
  },
  "pen-connect-wifi": {
    labels: ["pen", "connect", "wifi"],
    description: "Pen with a Wi-Fi signal in the secondary tone.",
  },
  "pen-off": {
    labels: ["pen", "off"],
    description: "Pen crossed by a diagonal slash in the secondary tone.",
  },
  "pen-tool-01": {
    labels: ["pen", "tool"],
    description: "Pen tool nib pointing up, with its slit hole and holder band.",
  },
  "pen-tool-02": {
    labels: ["pen", "tool"],
    description: "Pen tool nib pointing down from its holder band.",
  },
  "pencil-off": {
    labels: ["pencil", "off"],
    description: "Pencil crossed by a diagonal slash in the secondary tone.",
  },
  pensive: {
    labels: ["pensive"],
    description: "Face with lowered closed eyes and a small frown in the secondary tone.",
  },
  periscope: {
    labels: ["periscope"],
    description: "Periscope: a Z-shaped tube with its two mirrors in the secondary tone.",
  },
  "phone-developer-mode": {
    labels: ["phone", "developer", "mode"],
    description: "Smartphone whose middle is replaced by angle brackets in the secondary tone.",
  },
  "phone-off-01": {
    labels: ["phone", "off"],
    description: "Smartphone with a notch, crossed by a diagonal slash in the secondary tone.",
  },
  "phone-off-02": {
    labels: ["phone", "off"],
    description:
      "Smartphone with a home button, crossed by a diagonal slash in the secondary tone.",
  },
  "more-or-less-square-fill": {
    reference:
      "Filled variant of our own `more-or-less-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "more"],
    description: "Filled: square with a plus above a minus in the secondary tone.",
  },
  "n-th-root-circle-fill": {
    reference:
      "Filled variant of our own `n-th-root-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "n"],
    description: "Filled: radical sign in the secondary tone inside a circle.",
  },
  "octagon-x-fill": {
    reference: "Filled variant of our own `octagon-x`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "octagon"],
    description: "Filled: octagon with an X in the secondary tone.",
  },
  "options-call-fill": {
    reference:
      "Filled variant of our own `options-call`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "options"],
    description: "Filled: square with a capital C in the secondary tone, for a call option.",
  },
  "pen-tool-01-fill": {
    reference: "Filled variant of our own `pen-tool-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pen"],
    description: "Filled: pen tool nib pointing up, with its slit hole and holder band.",
  },
  "pen-tool-02-fill": {
    reference: "Filled variant of our own `pen-tool-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pen"],
    description: "Filled: pen tool nib pointing down from its holder band.",
  },
  pie: {
    labels: ["pie"],
    description:
      "Pie from the side: a domed crust with two vents in the secondary tone over a sloped dish.",
  },
  pillow: {
    labels: ["pillow"],
    description: "Pillow: a soft square with its four corners pinched out.",
  },
  "pills-tablet": {
    labels: ["pills", "tablet"],
    description: "Tablet in perspective: a flat disc with its score line in the secondary tone.",
  },
  pipeline: {
    labels: ["pipeline"],
    description: "Pipeline: a pipe elbow, flanges at both ends in the secondary tone.",
  },
  plate: {
    labels: ["plate"],
    description: "Plate from above: a round rim around the flat well.",
  },
  "plus-minus-circle-02": {
    labels: ["plus", "minus", "circle"],
    description:
      "Plus-minus in a circle: `circle` with `plus-minus` drawn small inside in the secondary tone.",
  },
  "pocket-knife": {
    labels: ["pocket", "knife"],
    description:
      "Pocket knife: a rounded handle with the blade folded out at the top left in the secondary tone.",
  },
  "police-cap": {
    labels: ["police", "cap"],
    description:
      "Police cap from the front: a wide crown with the badge in the secondary tone, a band, a peak.",
  },
  "poly-tank": {
    labels: ["poly", "tank"],
    description: "Water tank: a domed cylinder with a lid on top and two moulded ribs.",
  },
  "pool-table": {
    labels: ["pool", "table"],
    description:
      "Pool table from the side: three balls on the cloth in the secondary tone, the table on legs.",
  },
  "presentation-podium": {
    labels: ["presentation", "podium"],
    description:
      "Lectern: a wide top on a column and a base, the microphone in the secondary tone.",
  },
  pumpkin: {
    labels: ["pumpkin"],
    description: "Pumpkin: a wide ribbed body with the stalk in the secondary tone.",
  },
  "punching-ball-01": {
    labels: ["punching", "ball"],
    description: "Punching bag hanging from its chains, the band in the secondary tone.",
  },
  rabbit: {
    labels: ["rabbit"],
    description:
      "Rabbit sitting, seen from the side: two long ears laid back, a round head, a round body and a tail.",
  },
  "radio-off": {
    labels: ["radio", "off"],
    description: "The `radio` crossed by a slash in the secondary tone.",
  },
  "rar-01": {
    labels: ["rar"],
    description:
      "RAR file: the top of `file-01` over the letters R, A and R in the secondary tone.",
  },
  "raw-01": {
    labels: ["raw"],
    description:
      "RAW file: the top of `file-01` over the letters R, A and W in the secondary tone.",
  },
  "refresh-ccw": {
    labels: ["refresh", "ccw"],
    description: "Refresh anticlockwise: `refresh` mirrored.",
  },
  "refresh-ccw-dot": {
    labels: ["refresh", "ccw", "dot"],
    description: "Refresh anticlockwise with a dot: `refresh-dot` mirrored.",
  },
  regex: {
    labels: ["regex"],
    description: "Regular expression: an asterisk over a square dot, the `.*` of a pattern.",
  },
  "pie-fill": {
    reference: "Filled variant of our own `pie`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pie"],
    description:
      "Filled: pie from the side: a domed crust with two vents in the secondary tone over a sloped dish.",
  },
  "pillow-fill": {
    reference: "Filled variant of our own `pillow`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pillow"],
    description: "Filled: pillow: a soft square with its four corners pinched out.",
  },
  "pills-tablet-fill": {
    reference:
      "Filled variant of our own `pills-tablet`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pills"],
    description:
      "Filled: tablet in perspective: a flat disc with its score line in the secondary tone.",
  },
  "plus-minus-circle-02-fill": {
    reference:
      "Filled variant of our own `plus-minus-circle-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "plus"],
    description:
      "Filled: plus-minus in a circle: `circle` with `plus-minus` drawn small inside in the secondary tone.",
  },
  "poly-tank-fill": {
    reference: "Filled variant of our own `poly-tank`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "poly"],
    description: "Filled: water tank: a domed cylinder with a lid on top and two moulded ribs.",
  },
  "pumpkin-fill": {
    reference: "Filled variant of our own `pumpkin`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pumpkin"],
    description: "Filled: pumpkin: a wide ribbed body with the stalk in the secondary tone.",
  },
  "punching-ball-01-fill": {
    reference:
      "Filled variant of our own `punching-ball-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "punching"],
    description: "Filled: punching bag hanging from its chains, the band in the secondary tone.",
  },
  "rabbit-fill": {
    reference: "Filled variant of our own `rabbit`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rabbit"],
    description:
      "Filled: rabbit sitting, seen from the side: two long ears laid back, a round head, a round body and a tail.",
  },
  "ship-wheel": {
    labels: ["ship", "wheel"],
    description: "Ship's wheel: a ring with spokes, a hub and handles at the four points.",
  },
  shocked: {
    labels: ["shocked"],
    description:
      "Shocked face: the face of `smile` with raised eyes and a round open mouth in the secondary tone.",
  },
  "shop-sign": {
    labels: ["shop", "sign"],
    description:
      "Shop sign: a board hanging from a nail by two strings, two lines of lettering in the secondary tone.",
  },
  "shopping-bag-favorite": {
    labels: ["shopping", "bag", "favorite"],
    description: "Shopping bag of `shopping-bag-add` with a star badge in the secondary tone.",
  },
  "shopping-bag-remove": {
    labels: ["shopping", "bag", "remove"],
    description: "Shopping bag of `shopping-bag-add` with a minus badge in the secondary tone.",
  },
  "shorts-pants": {
    labels: ["shorts", "pants"],
    description: "Shorts: a waistband and two short legs.",
  },
  shovel: {
    labels: ["shovel"],
    description: "Shovel: a D grip, a shaft and a pointed blade.",
  },
  shrub: {
    labels: ["shrub"],
    description: "Shrub: a wide rounded bush on a short trunk, standing on the ground.",
  },
  sleeveless: {
    labels: ["sleeveless"],
    description: "Sleeveless top: two straps, a scooped neck and a straight body.",
  },
  slide: {
    labels: ["slide"],
    description: "Playground slide: a ladder on the left and the slide running down to the right.",
  },
  snail: {
    labels: ["snail"],
    description:
      "Snail: a round shell with its core in the secondary tone, on a long body with a head and two feelers.",
  },
  socks: {
    labels: ["socks"],
    description: "Sock: a cuff, a leg, a heel and a foot pointing left.",
  },
  "soda-can": {
    labels: ["soda", "can"],
    description:
      "Soda can: a tapered lid with its pull tab in the secondary tone, a straight body.",
  },
  soup: {
    labels: ["soup"],
    description: "Bowl of soup: two wisps of steam in the secondary tone over a bowl on a foot.",
  },
  spatula: {
    labels: ["spatula"],
    description: "Spatula: a slotted blade on a solid handle.",
  },
  "speed-train-02": {
    labels: ["speed", "train"],
    description:
      "High-speed train seen from the side: a long sloping nose, windows in the secondary tone, on a rail.",
  },
  spool: {
    labels: ["spool"],
    description: "Spool of thread: two flanges and the wound thread in the secondary tone.",
  },
  spoon: {
    labels: ["spoon"],
    description: "Spoon: an oval bowl on a solid handle, drawn like `fork`.",
  },
  sql: {
    labels: ["sql"],
    description: "SQL: the three letters S, Q and L.",
  },
  "square-terminal": {
    labels: ["square", "terminal"],
    description:
      "Square with a terminal prompt: a chevron in the secondary tone and an underscore.",
  },
  "shorts-pants-fill": {
    reference:
      "Filled variant of our own `shorts-pants`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "shorts"],
    description: "Filled: shorts: a waistband and two short legs.",
  },
  "shrub-fill": {
    reference: "Filled variant of our own `shrub`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "shrub"],
    description: "Filled: shrub: a wide rounded bush on a short trunk, standing on the ground.",
  },
  "sleeveless-fill": {
    reference: "Filled variant of our own `sleeveless`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "sleeveless"],
    description: "Filled: sleeveless top: two straps, a scooped neck and a straight body.",
  },
  "socks-fill": {
    reference: "Filled variant of our own `socks`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "socks"],
    description: "Filled: sock: a cuff, a leg, a heel and a foot pointing left.",
  },
  "soda-can-fill": {
    reference: "Filled variant of our own `soda-can`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "soda"],
    description:
      "Filled: soda can: a tapered lid with its pull tab in the secondary tone, a straight body.",
  },
  "soup-fill": {
    reference: "Filled variant of our own `soup`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "soup"],
    description:
      "Filled: bowl of soup: two wisps of steam in the secondary tone over a bowl on a foot.",
  },
  "spoon-fill": {
    reference: "Filled variant of our own `spoon`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "spoon"],
    description: "Filled: spoon: an oval bowl on a solid handle, drawn like `fork`.",
  },
  "user-story": {
    labels: ["user", "story"],
    description:
      "Person with a story card badge in the secondary tone, lower right. Built on `user-settings-01`.",
  },
  "vacuum-cleaner": {
    labels: ["vacuum", "cleaner"],
    description: "Upright vacuum cleaner: grip, handle, body with a dust bag, floor head.",
  },
  "venetian-mask": {
    labels: ["venetian", "mask"],
    description: "Venetian eye mask: solid band with two eye holes and a nose notch.",
  },
  "voice-comment": {
    labels: ["voice", "comment"],
    description: "Speech bubble of `comment-01` holding sound bars in the secondary tone.",
  },
  "vr-glasses": {
    labels: ["vr", "glasses"],
    description:
      "Virtual-reality headset seen from the front: visor with a nose notch, strap ends in the secondary tone.",
  },
  waiter: {
    labels: ["waiter"],
    description:
      "Person with a serving cloche badge in the secondary tone, lower right. Built on `user-settings-01`.",
  },
  "water-polo": {
    labels: ["water", "polo"],
    description:
      "Swimmer's head and shoulders above waves, one arm up holding a ball in the secondary tone.",
  },
  waypoints: {
    labels: ["waypoints"],
    description:
      "Four waypoints in a diamond, linked by diagonal lines; the points in the secondary tone.",
  },
  webhook: {
    labels: ["webhook"],
    description: "Webhook: three rings joined in a triangle; the joins in the secondary tone.",
  },
  wedding: {
    labels: ["wedding"],
    description: "Two interlocked rings, a stone in the secondary tone on the right one.",
  },
  wellness: {
    labels: ["wellness"],
    description: "Lotus flower: a tall middle petal between two side petals.",
  },
  "wifi-location": {
    labels: ["wifi", "location"],
    description: "Wi-Fi of `wifi-unlock` with a location pin badge in the secondary tone.",
  },
  "wifi-lock": {
    labels: ["wifi", "lock"],
    description: "Wi-Fi of `wifi-unlock` with a closed padlock badge in the secondary tone.",
  },
  "wind-arrow-down": {
    labels: ["wind", "arrow", "down"],
    description: "Two gusts of wind with a down arrow in the secondary tone.",
  },
  "wind-turbine": {
    labels: ["wind", "turbine"],
    description: "Wind turbine: three blades round a hub in the secondary tone, on a tower.",
  },
  wink: {
    labels: ["wink"],
    description: "Winking face: one open eye, one closed, a smile in the secondary tone.",
  },
  workflow: {
    labels: ["workflow"],
    description: "Workflow: two boxes linked by an elbow connector in the secondary tone.",
  },
  "yoga-mat": {
    labels: ["yoga", "mat"],
    description: "Yoga mat half rolled: a roll on the left, the flat end to the right.",
  },
  yurt: {
    labels: ["yurt"],
    description: "Yurt: domed roof over a round wall, an arched door in the secondary tone.",
  },
  zeppelin: {
    labels: ["zeppelin"],
    description: "Airship: long envelope with tail fins and a gondola in the secondary tone.",
  },
  "voice-comment-fill": {
    reference:
      "Filled variant of our own `voice-comment`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "voice"],
    description: "Filled: speech bubble of `comment-01` holding sound bars in the secondary tone.",
  },
  "vr-glasses-fill": {
    reference: "Filled variant of our own `vr-glasses`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "vr"],
    description:
      "Filled: virtual-reality headset seen from the front: visor with a nose notch, strap ends in the secondary tone.",
  },
  "wink-fill": {
    reference: "Filled variant of our own `wink`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "wink"],
    description: "Filled: winking face: one open eye, one closed, a smile in the secondary tone.",
  },
  "yurt-fill": {
    reference: "Filled variant of our own `yurt`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "yurt"],
    description:
      "Filled: yurt: domed roof over a round wall, an arched door in the secondary tone.",
  },
  "star-face": {
    labels: ["star", "face"],
    description: "Star of the set with a smiling face inside in the secondary tone.",
  },
  stars: {
    labels: ["stars"],
    description: "One large and one small solid star.",
  },
  status: {
    labels: ["status"],
    description: "A ring broken into four arcs, a status indicator.",
  },
  stone: {
    labels: ["stone"],
    description: "Three flat stones stacked in a cairn.",
  },
  strategy: {
    labels: ["strategy"],
    description: "An X and an O joined by a move arrow in the secondary tone.",
  },
  "stroke-center": {
    labels: ["stroke", "center"],
    description:
      "A square frame whose path runs along the middle of the stroke, in the secondary tone.",
  },
  "structure-add": {
    labels: ["structure", "add"],
    description: "Three linked boxes of a structure with a plus badge.",
  },
  "structure-check": {
    labels: ["structure", "check"],
    description: "Three linked boxes of a structure with a check badge.",
  },
  "structure-fail": {
    labels: ["structure", "fail"],
    description: "Three linked boxes of a structure with a cross badge.",
  },
  "structure-folder": {
    labels: ["structure", "folder"],
    description: "Folders linked as a structure, the branch lines in the secondary tone.",
  },
  "study-desk": {
    labels: ["study", "desk"],
    description: "The desk of the set with a reading lamp on it in the secondary tone.",
  },
  submarine: {
    labels: ["submarine"],
    description: "A submarine with its tower and periscope.",
  },
  subtitle: {
    labels: ["subtitle"],
    description: "A screen with two subtitle lines along the bottom in the secondary tone.",
  },
  "suit-01": {
    labels: ["suit"],
    description: "A suit jacket with lapels and a tie in the secondary tone.",
  },
  "sun-cloud-angled-rain-zap-01": {
    labels: ["sun", "cloud", "angled"],
    description: "The sun and cloud of the set with slanted rain and a lightning bolt.",
  },
  "sun-cloud-angled-zap-01": {
    labels: ["sun", "cloud", "angled"],
    description: "The sun and cloud of the set with a lightning bolt below.",
  },
  "sun-moon": {
    labels: ["sun", "moon"],
    description: "A sun in the secondary tone and a crescent moon.",
  },
  "sun-snow": {
    labels: ["sun", "snow"],
    description: "A sun in the secondary tone and a snowflake.",
  },
  surfboard: {
    labels: ["surfboard"],
    description:
      "An upright surfboard with a pointed nose, a centre stripe in the secondary tone and a fin.",
  },
  surprise: {
    labels: ["surprise"],
    description: "A round face with raised eyes and an open mouth.",
  },
  suspicious: {
    labels: ["suspicious"],
    description: "A round face with narrowed eyes and a mouth pushed to one side.",
  },
  "system-update-01": {
    labels: ["system", "update"],
    description: "The computer of the set with a download arrow on the screen.",
  },
  "table-properties": {
    labels: ["table", "properties"],
    description: "A table with a settings cog badge.",
  },
  "table-tennis-bat": {
    labels: ["table", "tennis", "bat"],
    description: "A solid table tennis bat with the ball in the secondary tone.",
  },
  "tap-01": {
    labels: ["tap"],
    description: "Tap: the pointing hand of the set under a short arc in the secondary tone.",
  },
  taxes: {
    labels: ["taxes"],
    description: "A document with a percent sign in the secondary tone.",
  },
  "television-table": {
    labels: ["television", "table"],
    description: "A television standing on a low cabinet.",
  },
  "tent-tree": {
    labels: ["tent", "tree"],
    description: "A small tent and a round tree beside it, the trunk in the secondary tone.",
  },
  "stone-fill": {
    reference: "Filled variant of our own `stone`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "stone"],
    description: "Filled: three flat stones stacked in a cairn.",
  },
  "submarine-fill": {
    reference: "Filled variant of our own `submarine`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "submarine"],
    description: "Filled: a submarine with its tower and periscope.",
  },
  "surfboard-fill": {
    reference: "Filled variant of our own `surfboard`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "surfboard"],
    description:
      "Filled: an upright surfboard with a pointed nose, a centre stripe in the secondary tone and a fin.",
  },
  "three-finger-04": {
    labels: ["three", "finger"],
    description: "Three fingers: the three-finger hand mirrored, seen from the back.",
  },
  "tic-tac-toe": {
    labels: ["tic", "tac", "toe"],
    description: "A tic-tac-toe grid with a cross and a nought.",
  },
  "ticket-percent": {
    labels: ["ticket", "percent"],
    description: "A ticket with a percent sign: a discount ticket. Ticket of `ticket-01`.",
  },
  "time-zone": {
    labels: ["time", "zone"],
    description:
      "A globe with a clock: a time zone. Globe of `globe-lock`, clock of `user-time-01`.",
  },
  torus: {
    labels: ["torus"],
    description: "A torus: a flat ring seen from above and in front.",
  },
  "touch-01": {
    labels: ["touch"],
    description: "Touch: the fingertip of the pointing hand inside a ring in the secondary tone.",
  },
  "touch-02": {
    labels: ["touch"],
    description: "Touch: the pointing hand of the set with three short rays above the fingertip.",
  },
  "touch-interaction-01": {
    labels: ["touch", "interaction"],
    description:
      "Touch interaction: the pointing hand of the set under a button in the secondary tone.",
  },
  "touch-interaction-02": {
    labels: ["touch", "interaction"],
    description: "Touch interaction: the pointing hand of the set under two arrows going apart.",
  },
  "touch-locked-01": {
    labels: ["touch", "locked"],
    description:
      "Touch locked: the pointing hand of the set beside a padlock in the secondary tone.",
  },
  "tow-truck": {
    labels: ["tow", "truck"],
    description: "A tow truck: a cab, a bed and a boom with a hook at the back.",
  },
  "towel-rack": {
    labels: ["towel", "rack"],
    description: "A towel hanging over a rack.",
  },
  towels: {
    labels: ["towels"],
    description: "A stack of three folded towels.",
  },
  "toy-train": {
    labels: ["toy", "train"],
    description: "A toy locomotive: chimney, boiler, cab and three wheels.",
  },
  tractor: {
    labels: ["tractor"],
    description: "A tractor: cab, hood, exhaust, a big rear wheel and a small front wheel.",
  },
  "train-front-tunnel": {
    labels: ["train", "front", "tunnel"],
    description: "The front of a train in a tunnel arch. Train front after `train-01`, smaller.",
  },
  "train-track": {
    labels: ["train", "track"],
    description: "A straight railway track seen from above: two rails on sleepers.",
  },
  "transition-bottom": {
    labels: ["transition", "bottom"],
    description:
      "A tray with an arrow leaving through the bottom: transition to the bottom. `transition-top`, flipped.",
  },
  "transition-left": {
    labels: ["transition", "left"],
    description:
      "A tray with an arrow leaving to the left: transition to the left. `transition-top`, turned.",
  },
  "transition-right": {
    labels: ["transition", "right"],
    description:
      "A tray with an arrow leaving to the right: transition to the right. `transition-top`, turned.",
  },
  "transition-top": {
    labels: ["transition", "top"],
    description: "A tray with an arrow leaving through the top: transition to the top.",
  },
  trees: {
    labels: ["trees"],
    description: "Two round trees, a small and a tall one. Tree of `tree-01`.",
  },
  "trolley-01": {
    labels: ["trolley"],
    description: "A hand trolley carrying two stacked boxes.",
  },
  "truck-return": {
    labels: ["truck", "return"],
    description: "A truck under an arrow pointing back: a return shipment. Truck of `truck`.",
  },
  tsunami: {
    labels: ["tsunami"],
    description: "A tall wave curling over the water: a tsunami. Water of `wave`.",
  },
  tulip: {
    labels: ["tulip"],
    description: "A tulip: a three-pointed cup on a stem with a leaf.",
  },
  turntable: {
    labels: ["turntable"],
    description: "A turntable: a record on a platter and a tone arm.",
  },
  turtle: {
    labels: ["turtle"],
    description: "A turtle seen from the side: a domed shell, head and legs.",
  },
  "turtle-neck": {
    labels: ["turtle", "neck"],
    description: "A sweater with a high rolled collar: a turtleneck.",
  },
  "two-circle": {
    labels: ["two", "circle"],
    description: "The digit two in a circle. Circle and digit style of `three-circle`.",
  },
  "two-finger-01": {
    labels: ["two", "finger"],
    description:
      "Two fingers: the open hand with the index and middle fingers raised, the others and the thumb folded.",
  },
  "two-square": {
    labels: ["two", "square"],
    description: "The digit two in a square. Square and digit style of `three-square`.",
  },
  "umbrella-dollar": {
    labels: ["umbrella", "dollar"],
    description:
      "An umbrella with a dollar sign: financial cover. Umbrella of `umbrella`, sign of `user-dollar`.",
  },
  unamused: {
    labels: ["unamused"],
    description:
      "A face with half-closed eyes glancing aside and a flat mouth: unamused. Face of `neutral`.",
  },
  "upload-circle-02": {
    labels: ["upload", "circle"],
    description: "An arrow up over a line, in a circle: upload. Circle of `circle-arrow-up-01`.",
  },
  "user-roadside": {
    labels: ["user", "roadside"],
    description: "A person with a traffic cone: roadside assistance. Person of `user-lock-01`.",
  },
  "ticket-percent-fill": {
    reference:
      "Filled variant of our own `ticket-percent`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "ticket"],
    description: "Filled: a ticket with a percent sign: a discount ticket. Ticket of `ticket-01`.",
  },
  "two-circle-fill": {
    reference: "Filled variant of our own `two-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "two"],
    description: "Filled: the digit two in a circle. Circle and digit style of `three-circle`.",
  },
  "two-square-fill": {
    reference: "Filled variant of our own `two-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "two"],
    description: "Filled: the digit two in a square. Square and digit style of `three-square`.",
  },
  "upload-circle-02-fill": {
    reference:
      "Filled variant of our own `upload-circle-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "upload"],
    description:
      "Filled: an arrow up over a line, in a circle: upload. Circle of `circle-arrow-up-01`.",
  },
  kettlebell: {
    labels: ["kettlebell"],
    description: "Kettlebell: a round weight with a handle loop on top.",
  },
  van: {
    labels: ["van"],
    description:
      "Delivery van in profile: long box body, sloped windscreen, two wheels in the secondary tone.",
  },
  whisk: {
    labels: ["whisk"],
    description: "Balloon whisk: outer and inner wire loops over a handle.",
  },
  "kettlebell-fill": {
    reference: "Filled variant of our own `kettlebell`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "kettlebell"],
    description: "Filled: kettlebell: a round weight with a handle loop on top.",
  },
  "van-fill": {
    reference: "Filled variant of our own `van`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "van"],
    description:
      "Filled: delivery van in profile: long box body, sloped windscreen, two wheels in the secondary tone.",
  },
  dam: {
    labels: ["dam"],
    description:
      "Dam seen from the side: a tapered concrete wall holding water lines in the secondary tone.",
  },
  desert: {
    labels: ["desert"],
    description: "Desert: a sun in the secondary tone over a dune and the ground line.",
  },
  detergent: {
    labels: ["detergent"],
    description: "Detergent bottle: a cap, sloped shoulders, a label in the secondary tone.",
  },
  diaper: {
    labels: ["diaper"],
    description:
      "Diaper seen from the front: a wide waist with the elastic band in the secondary tone, narrowing to the crotch.",
  },
  "discover-square": {
    labels: ["discover", "square"],
    description: "Discover: the needle of `compass` in a square frame.",
  },
  dna: {
    labels: ["dna"],
    description:
      "DNA: two strands crossing in a double helix, three base pairs in the secondary tone.",
  },
  "dna-01": {
    labels: ["dna"],
    description: "DNA lying down: `dna` turned a quarter.",
  },
  "doctor-01": {
    labels: ["doctor"],
    description: "Doctor: a person with a medical cross in the secondary tone on the chest.",
  },
  "doctor-02": {
    labels: ["doctor"],
    description: "Doctor: a person wearing a stethoscope in the secondary tone.",
  },
  "drag-01": {
    labels: ["drag"],
    description:
      "Drag: a dashed square with the pointer in the secondary tone dragging it from its corner.",
  },
  drooling: {
    labels: ["drooling"],
    description:
      "Drooling face: two eyes, a flat mouth, a drop in the secondary tone running off the chin.",
  },
  "eco-energy": {
    labels: ["eco", "energy"],
    description:
      "Green energy: the leaf of `leaf-01` with a lightning bolt in the secondary tone along its midrib.",
  },
  "engine-slash": {
    labels: ["engine", "slash"],
    description: "Engine struck through: `engine` with a 45\u00b0 slash in the secondary tone.",
  },
  evil: {
    labels: ["evil"],
    description: "Devil face: horns in the secondary tone, slanted angry eyes, a grin.",
  },
  "ferry-boat": {
    labels: ["ferry", "boat"],
    description:
      "Ferry: a funnel, a cabin with a strip of windows in the secondary tone, a wide hull.",
  },
  "fire-pit": {
    labels: ["fire", "pit"],
    description: "Fire pit: the flame of `fire` in a bowl.",
  },
  "fish-food": {
    labels: ["fish", "food"],
    description: "Fish food: the fish of `fish` under three pellets in the secondary tone.",
  },
  "flame-kindling": {
    labels: ["flame", "kindling"],
    description:
      "Kindling: a small flame with its core in the secondary tone over two crossed sticks.",
  },
  "flower-pot": {
    labels: ["flower", "pot"],
    description:
      "Flower pot: a round flower in the secondary tone on a stem over the pot of `plant-01`.",
  },
  "folder-root": {
    labels: ["folder", "root"],
    description: "Root folder: `folder-01` with a slash in the secondary tone inside.",
  },
  "detergent-fill": {
    reference: "Filled variant of our own `detergent`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "detergent"],
    description:
      "Filled: detergent bottle: a cap, sloped shoulders, a label in the secondary tone.",
  },
  "diaper-fill": {
    reference: "Filled variant of our own `diaper`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "diaper"],
    description:
      "Filled: diaper seen from the front: a wide waist with the elastic band in the secondary tone, narrowing to the crotch.",
  },
  "discover-square-fill": {
    reference:
      "Filled variant of our own `discover-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "discover"],
    description: "Filled: discover: the needle of `compass` in a square frame.",
  },
  "folder-root-fill": {
    reference: "Filled variant of our own `folder-root`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "folder"],
    description: "Filled: root folder: `folder-01` with a slash in the secondary tone inside.",
  },
  "add-team": {
    labels: ["add", "team"],
    description: "Two people side by side, the second one's body replaced by a plus badge.",
  },
  affiliate: {
    labels: ["affiliate"],
    description: "One person with a chain-link badge: someone linked to you.",
  },
  "ai-brain-01": {
    labels: ["ai", "brain"],
    description: "The brain-01 outline with a small sparkle inside in the secondary tone.",
  },
  "american-football": {
    labels: ["american", "football"],
    description: "An American football lying on the diagonal, its stitches in the secondary tone.",
  },
  "analysis-text-link": {
    labels: ["analysis", "text", "link"],
    description: "Three lines of text with a chain-link badge in the lower-right corner.",
  },
  "attachment-off": {
    labels: ["attachment", "off"],
    description: "The attachment paper clip crossed by the off slash.",
  },
  avalanche: {
    labels: ["avalanche"],
    description: "A steep slope with snow blocks tumbling down it in the secondary tone.",
  },
  barns: {
    labels: ["barns"],
    description: "A barn front: a gambrel roof over a big door crossed in the secondary tone.",
  },
  "baseball-helmet": {
    labels: ["baseball", "helmet"],
    description:
      "A batting helmet in profile: a dome, an ear guard in the secondary tone, a bill to the right.",
  },
  bean: {
    labels: ["bean"],
    description: "A coffee bean: an oval split by an S-shaped crease.",
  },
  "bean-off": {
    labels: ["bean", "off"],
    description: "The coffee bean crossed by the off slash.",
  },
  "billiard-01": {
    labels: ["billiard"],
    description: "Billiard balls racked in a triangle, the front ball in the secondary tone.",
  },
  blueprint: {
    labels: ["blueprint"],
    description: "A blueprint: a sheet rolled on the left with a floor plan in the secondary tone.",
  },
  blur: {
    labels: ["blur"],
    description:
      "A blur: a disc of square dots, solid in the middle, fading to the secondary tone outside.",
  },
  "body-part-leg": {
    labels: ["body", "part", "leg"],
    description: "A leg: thigh, knee and shin down to a foot pointing right.",
  },
  "bot-off": {
    labels: ["bot", "off"],
    description: "The bot crossed by the off slash.",
  },
  "american-football-fill": {
    reference:
      "Filled variant of our own `american-football`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "american"],
    description:
      "Filled: an American football lying on the diagonal, its stitches in the secondary tone.",
  },
  "baseball-helmet-fill": {
    reference:
      "Filled variant of our own `baseball-helmet`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "baseball"],
    description:
      "Filled: a batting helmet in profile: a dome, an ear guard in the secondary tone, a bill to the right.",
  },
  "bean-fill": {
    reference: "Filled variant of our own `bean`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "bean"],
    description: "Filled: a coffee bean: an oval split by an S-shaped crease.",
  },
  "body-part-leg-fill": {
    reference:
      "Filled variant of our own `body-part-leg`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "body"],
    description: "Filled: a leg: thigh, knee and shin down to a foot pointing right.",
  },
  "boxing-glove": {
    labels: ["boxing", "glove"],
    description:
      "Boxing glove, solid: a big rounded mitt with the thumb set apart, the cuff in the secondary tone.",
  },
  "boxing-glove-01": {
    labels: ["boxing", "glove"],
    description:
      "Boxing glove, one-pixel outline: a rounded mitt, the thumb set apart, a cuff in the secondary tone.",
  },
  "brain-cog": {
    labels: ["brain", "cog"],
    description:
      "Brain of `brain-01` without its folds, with the cog badge of `computer-settings` in the lower right corner.",
  },
  brochure: {
    labels: ["brochure"],
    description:
      "Brochure: a tri-fold leaflet, three panels and two folds, the middle panel's picture in the secondary tone.",
  },
  "bubble-tea-01": {
    labels: ["bubble", "tea"],
    description:
      "Bubble tea: the lidded cup of `cup-soda` with a straight straw, the pearls at the bottom in the secondary tone.",
  },
  "burning-cd": {
    labels: ["burning", "cd"],
    description:
      "Burning a disc: the compact disc of `cd` with a small flame in the secondary tone in the lower right corner.",
  },
  c: {
    labels: ["c"],
    description: "Letter C: the ring of `clock-01` open on the right.",
  },
  "camera-rotated-01": {
    labels: ["camera", "rotated"],
    description:
      "Camera of `camera-add-01` with the clockwise arrow badge of `image-rotation-clockwise` in the lower right corner.",
  },
  "camera-rotated-02": {
    labels: ["camera", "rotated"],
    description:
      "Camera of `camera-add-02` with the counter-clockwise arrow badge of `image-counter-clockwise` in the lower right corner.",
  },
  "candelier-02": {
    labels: ["candelier"],
    description:
      "Chandelier: a chain, a wide bowl under five candles, their flames in the secondary tone.",
  },
  "cellular-network-offline": {
    labels: ["cellular", "network", "offline"],
    description:
      "Cellular mast of `cellular-network` struck by a 45\u00b0 slash in the secondary tone.",
  },
  "chair-barber": {
    labels: ["chair", "barber"],
    description:
      "Barber chair: a headrest on a tall back, an armrest over the seat, a footrest, one column on a round base.",
  },
  "character-phonetic": {
    labels: ["character", "phonetic"],
    description: "Phonetic character: a schwa, an upside-down e.",
  },
  "chart-rose": {
    labels: ["chart", "rose"],
    description:
      "Rose chart: four quarter-circle petals of different sizes around one centre, the largest in the secondary tone.",
  },
  child: {
    labels: ["child"],
    description: "Child: a small person, a round head over short shoulders, in the user style.",
  },
  "coins-dollar": {
    labels: ["coins", "dollar"],
    description:
      "Two stacked coins (the coins-euro base) with a dollar sign on the front coin in the secondary tone.",
  },
  "computer-dollar": {
    labels: ["computer", "dollar"],
    description: "Monitor of `computer` with a dollar sign on its screen, in the secondary tone.",
  },
  conference: {
    labels: ["conference"],
    description:
      "Conference: three people seated behind a table, the one in the middle a little taller.",
  },
  "cowboy-hat": {
    labels: ["cowboy", "hat"],
    description:
      "Cowboy hat: a creased crown, a band in the secondary tone, a wide brim curled up at both ends.",
  },
  crab: {
    labels: ["crab"],
    description: "Crab: a wide solid shell, two raised claws and three legs each side.",
  },
  "credit-card-change": {
    labels: ["credit", "card", "change"],
    description: "Card of `credit-card` with a badge of two opposite arrows: change the card.",
  },
  "credit-card-link": {
    labels: ["credit", "card", "link"],
    description: "Card of `credit-card` with a badge of two linked rings: link a card.",
  },
  "cricket-bat": {
    labels: ["cricket", "bat"],
    description:
      "Cricket bat: a flat blade on the diagonal with a thin handle, the ball beside it in the secondary tone.",
  },
  crowdfunding: {
    labels: ["crowdfunding"],
    description: "Crowdfunding: a coin in the secondary tone above three small people.",
  },
  curling: {
    labels: ["curling"],
    description:
      "Curling stone: a wide rounded stone with a band in the secondary tone, the handle on top.",
  },
  currency: {
    labels: ["currency"],
    description: "Currency sign: a ring with four short diagonal spokes.",
  },
  "curvy-up-down-direction": {
    labels: ["curvy", "up", "down"],
    description:
      "Curvy up and down: one S-shaped line with an arrowhead up at one end and down at the other, symmetric by a half turn.",
  },
  "cylinder-01": {
    labels: ["cylinder"],
    description: "Cylinder: the top ellipse of `database` over plain sides and a rounded bottom.",
  },
  "cylinder-02": {
    labels: ["cylinder"],
    description:
      "Cylinder of `cylinder-01` with its radius drawn on the top face in the secondary tone.",
  },
  "boxing-glove-01-fill": {
    reference:
      "Filled variant of our own `boxing-glove-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "boxing"],
    description:
      "Filled: boxing glove, one-pixel outline: a rounded mitt, the thumb set apart, a cuff in the secondary tone.",
  },
  "cowboy-hat-fill": {
    reference: "Filled variant of our own `cowboy-hat`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cowboy"],
    description:
      "Filled: cowboy hat: a creased crown, a band in the secondary tone, a wide brim curled up at both ends.",
  },
  "curling-fill": {
    reference: "Filled variant of our own `curling`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "curling"],
    description:
      "Filled: curling stone: a wide rounded stone with a band in the secondary tone, the handle on top.",
  },
  "cylinder-01-fill": {
    reference: "Filled variant of our own `cylinder-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cylinder"],
    description:
      "Filled: cylinder: the top ellipse of `database` over plain sides and a rounded bottom.",
  },
  footprints: {
    labels: ["footprints"],
    description: "Two footprints: a sole and a heel each, the right one a step ahead.",
  },
  "four-finger-02": {
    labels: ["four", "finger"],
    description: "Four fingers: the open hand with the thumb folded.",
  },
  frisbee: {
    labels: ["frisbee"],
    description: "Frisbee: a flat disc seen in perspective, its rim ring in the secondary tone.",
  },
  galaxy: {
    labels: ["galaxy"],
    description:
      "Spiral galaxy: two arms curling round a bright core in the secondary tone, half-turn symmetric.",
  },
  "garbage-truck": {
    labels: ["garbage", "truck"],
    description: "Garbage truck: the `truck` base with the ribs of its compactor box.",
  },
  garlands: {
    labels: ["garlands"],
    description: "Garlands: two strings of pennant flags, the pennants in the secondary tone.",
  },
  "gas-stove": {
    labels: ["gas", "stove"],
    description:
      "Gas stove: a cooker with its oven window, two burner flames in the secondary tone.",
  },
  "gold-buy": {
    labels: ["gold", "buy"],
    description: "Gold buy: the ingots of `gold-ingots` with a plus badge in the secondary tone.",
  },
  "gold-sell": {
    labels: ["gold", "sell"],
    description: "Gold sell: the ingots of `gold-ingots` with a minus badge in the secondary tone.",
  },
  "golf-ball": {
    labels: ["golf", "ball"],
    description: "Golf ball on a tee, the tee in the secondary tone.",
  },
  "golf-cart": {
    labels: ["golf", "cart"],
    description:
      "Golf cart: a roof over a seat and a windscreen, two wheels in the secondary tone.",
  },
  gpu: {
    labels: ["gpu"],
    description: "Graphics card: a board with a round fan in the secondary tone and its connector.",
  },
  gravity: {
    labels: ["gravity"],
    description: "Gravity: a ball falling down an arrow in the secondary tone onto the ground.",
  },
  ham: {
    labels: ["ham"],
    description: "Ham: a leg of ham with the bone end in the secondary tone.",
  },
  "hand-pointing-down-01": {
    labels: ["hand", "pointing", "down"],
    description: "Hand pointing down: the pointing hand of the set turned over, cuff at the top.",
  },
  hiking: {
    labels: ["hiking"],
    description:
      "Hiking: the walking person of `walking` with a trekking pole in the secondary tone.",
  },
  hockey: {
    labels: ["hockey"],
    description: "Hockey: a stick with its blade on the ice and a puck in the secondary tone.",
  },
  "hold-01": {
    labels: ["hold"],
    description:
      "Hand holding a box: the offering hand of the set under a parcel in the secondary tone.",
  },
  "hold-locked-01": {
    labels: ["hold", "locked"],
    description:
      "Hand holding a padlock: the offering hand of the set under a padlock in the secondary tone.",
  },
  "hold-phone": {
    labels: ["hold", "phone"],
    description:
      "Hand holding a phone upright: the offering hand of the set under a phone in the secondary tone.",
  },
  hop: {
    labels: ["hop"],
    description: "Hop cone: overlapping scales on a short stem, a leaf in the secondary tone.",
  },
  "horse-head": {
    labels: ["horse", "head"],
    description: "Horse head in profile, ears up, facing left.",
  },
  "golf-ball-fill": {
    reference: "Filled variant of our own `golf-ball`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "golf"],
    description: "Filled: golf ball on a tee, the tee in the secondary tone.",
  },
  "horse-head-fill": {
    reference: "Filled variant of our own `horse-head`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "horse"],
    description: "Filled: horse head in profile, ears up, facing left.",
  },
  nerd: {
    labels: ["nerd"],
    description:
      "Nerd face: a round head with big square glasses in the secondary tone and a small grin.",
  },
  noodles: {
    labels: ["noodles"],
    description:
      "Noodles: the bowl of rice-bowl-01, wavy noodles in the secondary tone lifted by a pair of chopsticks.",
  },
  nose: {
    labels: ["nose"],
    description:
      "Nose seen from the front: a narrow bridge widening into the wings, two nostrils in the secondary tone.",
  },
  "ok-finger": {
    labels: ["ok", "finger"],
    description:
      "OK sign: the open hand with the index and thumb closed into a ring, three fingers raised.",
  },
  origami: {
    labels: ["origami"],
    description:
      "Origami crane: a raised folded wing, the neck and the tail as two points, solid shapes.",
  },
  paella: {
    labels: ["paella"],
    description:
      "Paella pan from the side: a wide shallow pan with two handles, the rice in the secondary tone.",
  },
  patient: {
    labels: ["patient"],
    description:
      "Patient: a person with a medical cross badge in the secondary tone, lower right. Built on `user-warning-01`.",
  },
  pavilon: {
    labels: ["pavilon"],
    description: "Pavilion: a curved pointed roof on four columns, a railing and a floor.",
  },
  physics: {
    labels: ["physics"],
    description: "Physics: an atom, two crossed orbits around a nucleus in the secondary tone.",
  },
  pivot: {
    labels: ["pivot"],
    description:
      "Pivot table: a header row, a header column, and an arrow in the secondary tone turning one into the other.",
  },
  prism: {
    labels: ["prism"],
    description:
      "Triangular prism lying down: the front triangle on the left, the ridge and the back edge running right.",
  },
  pyramid: {
    labels: ["pyramid"],
    description: "Pyramid seen on a corner: a triangle split by its front edge into two faces.",
  },
  "pyramid-maslowo": {
    labels: ["pyramid", "maslowo"],
    description:
      "Maslow's pyramid: a triangle in three tiers, the top tier filled in the secondary tone.",
  },
  "pyramid-structure-01": {
    labels: ["pyramid", "structure"],
    description: "Pyramid chart: three solid tiers stacked, the middle one in the secondary tone.",
  },
  "pyramid-structure-02": {
    labels: ["pyramid", "structure"],
    description:
      "Stepped pyramid: three square steps in outline, the top step in the secondary tone.",
  },
  radial: {
    labels: ["radial"],
    description:
      "Radial: the ring of `circle` around a small concentric ring in the secondary tone.",
  },
  "resize-01": {
    labels: ["resize"],
    description:
      "Resize: a small square at the lower left and a diagonal arrow in the secondary tone pulling its corner out.",
  },
  "resize-02": {
    labels: ["resize"],
    description:
      "Resize grip: the rounded square of `square` with the diagonal grip lines in its lower right corner in the secondary tone.",
  },
  "prism-fill": {
    reference: "Filled variant of our own `prism`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "prism"],
    description:
      "Filled: triangular prism lying down: the front triangle on the left, the ridge and the back edge running right.",
  },
  "pyramid-fill": {
    reference: "Filled variant of our own `pyramid`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pyramid"],
    description:
      "Filled: pyramid seen on a corner: a triangle split by its front edge into two faces.",
  },
  "pyramid-maslowo-fill": {
    reference:
      "Filled variant of our own `pyramid-maslowo`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pyramid"],
    description:
      "Filled: maslow's pyramid: a triangle in three tiers, the top tier filled in the secondary tone.",
  },
  "pyramid-structure-02-fill": {
    reference:
      "Filled variant of our own `pyramid-structure-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pyramid"],
    description:
      "Filled: stepped pyramid: three square steps in outline, the top step in the secondary tone.",
  },
  "horse-saddle": {
    labels: ["horse", "saddle"],
    description: "Horse (the horse drawing) with a saddle on its back in the secondary tone.",
  },
  hotdog: {
    labels: ["hotdog"],
    description: "Hot dog: a bun cut in two halves around a sausage that sticks out at both ends.",
  },
  "house-solar-panel": {
    labels: ["house", "solar", "panel"],
    description: "House whose roof is a solar panel, drawn in the secondary tone.",
  },
  humidity: {
    labels: ["humidity"],
    description: "Water drop with a percent sign inside, in the secondary tone.",
  },
  "ice-hockey": {
    labels: ["ice", "hockey"],
    description: "Ice hockey stick with its blade, and a puck in the secondary tone.",
  },
  "in-love": {
    labels: ["in", "love"],
    description: "Round face with heart eyes in the secondary tone.",
  },
  ipod: {
    labels: ["ipod"],
    description:
      "Pocket music player: a tall case with a screen in the secondary tone and a click wheel.",
  },
  island: {
    labels: ["island"],
    description: "Island: a palm tree on a mound above waves in the secondary tone.",
  },
  joker: {
    labels: ["joker"],
    description:
      "Jester hat: a central bell on top, two drooping points with bells, in the secondary tone.",
  },
  kid: {
    labels: ["kid"],
    description: "Child: a big round head over a short body with arms out.",
  },
  kissing: {
    labels: ["kissing"],
    description: "Round face with closed eyes and puckered lips in the secondary tone.",
  },
  knives: {
    labels: ["knives"],
    description: "Two kitchen knives crossed.",
  },
  "knowledge-01": {
    labels: ["knowledge"],
    description: "Apple in the secondary tone on a closed book lying flat.",
  },
  "knowledge-02": {
    labels: ["knowledge"],
    description: "Reading glasses in the secondary tone on a closed book lying flat.",
  },
  "laptop-phone-sync": {
    labels: ["laptop", "phone", "sync"],
    description: "Small laptop next to a phone in the secondary tone.",
  },
  "laptop-settings": {
    labels: ["laptop", "settings"],
    description: "Laptop with a cog badge in the secondary tone.",
  },
  "list-restart": {
    labels: ["list", "restart"],
    description: "List with a circular restart arrow in the secondary tone.",
  },
  "milk-coconut": {
    labels: ["milk", "coconut"],
    description: "Half coconut filled with milk in the secondary tone, with a straw.",
  },
  "milk-off": {
    labels: ["milk", "off"],
    description:
      "Milk carton (the milk-carton drawing) crossed out by a slash in the secondary tone.",
  },
  mochi: {
    labels: ["mochi"],
    description:
      "Kagami mochi: two stacked rice cakes with an orange on top in the secondary tone.",
  },
  "money-receive-circle": {
    labels: ["money", "receive", "circle"],
    description:
      "Coin with a dollar sign and an arrow coming in at the top right, in the secondary tone.",
  },
  "money-receive-square": {
    labels: ["money", "receive", "square"],
    description:
      "Square with a dollar sign and an arrow coming in at the top right, in the secondary tone.",
  },
  "money-send-circle": {
    labels: ["money", "send", "circle"],
    description:
      "Coin with a dollar sign and an arrow going out at the top right, in the secondary tone.",
  },
  "money-send-square": {
    labels: ["money", "send", "square"],
    description:
      "Square with a dollar sign and an arrow going out at the top right, in the secondary tone.",
  },
  "monocle-01": {
    labels: ["monocle"],
    description: "Round face wearing a monocle in the secondary tone.",
  },
  "moon-angled-rain-zap": {
    labels: ["moon", "angled", "rain"],
    description: "Crescent moon above angled rain and a lightning bolt in the secondary tone.",
  },
  "moon-slow-wind": {
    labels: ["moon", "slow", "wind"],
    description: "Crescent moon above two short wind lines in the secondary tone.",
  },
  "napkins-02": {
    labels: ["napkins"],
    description: "Folded napkins: a diamond over a second layer.",
  },
  "ipod-fill": {
    reference: "Filled variant of our own `ipod`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "ipod"],
    description:
      "Filled: pocket music player: a tall case with a screen in the secondary tone and a click wheel.",
  },
  "mochi-fill": {
    reference: "Filled variant of our own `mochi`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "mochi"],
    description:
      "Filled: kagami mochi: two stacked rice cakes with an orange on top in the secondary tone.",
  },
  stake: {
    labels: ["stake"],
    description:
      "Wooden stake: a post with a pointed tip driven into the ground line in the secondary tone.",
  },
  tan: {
    labels: ["tan"],
    description:
      "Tangent: a circle and a line touching it at one point, the line in the secondary tone.",
  },
  "three-finger-01": {
    labels: ["three", "finger"],
    description:
      "Three fingers: the open hand with the index, middle and ring fingers raised, the thumb folded.",
  },
  "three-finger-02": {
    labels: ["three", "finger"],
    description: "Three fingers: the open hand with the thumb, index and middle finger out.",
  },
  "three-finger-03": {
    labels: ["three", "finger"],
    description: "Three fingers: the open hand with the middle, ring and little fingers raised.",
  },
  "tree-palm": {
    labels: ["tree", "palm"],
    description: "Palm tree: drooping fronds over a leaning trunk in the secondary tone.",
  },
  volleyball: {
    labels: ["volleyball"],
    description:
      "Volleyball: the ring of `basketball-01` with three curved seams in the secondary tone.",
  },
  "wifi-cog": {
    labels: ["wifi", "cog"],
    description: "Wi-Fi settings: the arcs of `wifi-lock` with the cog badge of `cloud-cog`.",
  },
  "wifi-sync": {
    labels: ["wifi", "sync"],
    description: "Wi-Fi sync: the arcs of `wifi-lock` with the sync badge of `cloud-sync`.",
  },
  "yoga-ball": {
    labels: ["yoga", "ball"],
    description:
      "Exercise ball: a big ball with a curved highlight in the secondary tone, on the floor.",
  },
  yogurt: {
    labels: ["yogurt"],
    description: "Yogurt: a tapered pot with a spoon and a label band in the secondary tone.",
  },
  "rocking-horse": {
    labels: ["rocking", "horse"],
    description: "Rocking horse: a horse's head and body on legs that stand on a curved rocker.",
  },
  "rubiks-cube": {
    labels: ["rubiks", "cube"],
    description: "Rubik's cube: the cube of `cube`, its front face cut into a three-by-three grid.",
  },
  sausage: {
    labels: ["sausage"],
    description: "Sausage on the diagonal, tied at both ends.",
  },
  senseless: {
    labels: ["senseless"],
    description: "Blank face: the ring of `smile`, flat eyes and a flat mouth.",
  },
  seo: {
    labels: ["seo"],
    description: "Search engine optimisation: the lens of `search-01` with two rising bars inside.",
  },
  "shaka-01": {
    labels: ["shaka"],
    description: "Shaka sign: the open hand with only the little finger and a long thumb out.",
  },
  "sing-left": {
    labels: ["sing", "left"],
    description: "Singing: a person with a music note on the left.",
  },
  "sing-right": {
    labels: ["sing", "right"],
    description: "Singing: a person with a music note on the right.",
  },
  "smile-plus": {
    labels: ["smile", "plus"],
    description: "Add a reaction: a smiling face with a plus badge.",
  },
  space: {
    labels: ["space"],
    description: "Space bar: a wide key with the space symbol.",
  },
  "square-parking-off": {
    labels: ["square", "parking", "off"],
    description: "Parking not allowed: the P of `parking-area-square` struck through.",
  },
  "stack-star": {
    labels: ["stack", "star"],
    description: "Stack with a star: two cards, the front one marked with a star.",
  },
  "sausage-fill": {
    reference: "Filled variant of our own `sausage`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "sausage"],
    description: "Filled: sausage on the diagonal, tied at both ends.",
  },
  cap: {
    labels: ["cap"],
    description:
      "Cap: a baseball cap seen from the side, a round crown and a long peak to the right, the button in the secondary tone.",
  },
  "cap-fill": {
    reference: "Filled variant of our own `cap`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cap"],
    description:
      "Filled: cap: a baseball cap seen from the side, a round crown and a long peak to the right, the button in the secondary tone.",
  },
  "ai-dna": {
    labels: ["ai", "dna"],
    description: "A double helix with a sparkle badge.",
  },
  "airport-tower": {
    labels: ["airport", "tower"],
    description: "An airport control tower with a glazed cab.",
  },
  "atomic-power": {
    labels: ["atomic", "power"],
    description: "Radiation trefoil: three blades around a centre dot.",
  },
  "bowling-pins": {
    labels: ["bowling", "pins"],
    description: "Two bowling pins side by side.",
  },
  "bubble-chat-question": {
    labels: ["bubble", "chat", "question"],
    description: "Round speech bubble with a question-mark badge.",
  },
  "bubble-chat-search": {
    labels: ["bubble", "chat", "search"],
    description: "Round speech bubble with a magnifier badge.",
  },
  "bubble-chat-upload": {
    labels: ["bubble", "chat", "upload"],
    description: "Round speech bubble with an upload arrow badge.",
  },
  "bubble-tea-02": {
    labels: ["bubble", "tea"],
    description: "A bubble tea with a domed lid, straw and pearls.",
  },
  bullet: {
    labels: ["bullet"],
    description: "A cartridge: the bullet on its case.",
  },
  "candelier-01": {
    labels: ["candelier"],
    description: "Hanging chandelier with two lit candles.",
  },
  "car-signal": {
    labels: ["car", "signal"],
    description: "Car with signal bars badge.",
  },
  caravan: {
    labels: ["caravan"],
    description: "Trailer with a window, a door, a tow bar and a wheel.",
  },
  "coffee-beans": {
    labels: ["coffee", "beans"],
    description: "An oval coffee bean with its S-shaped crease.",
  },
  "cylinder-03": {
    labels: ["cylinder"],
    description: "A cylinder lying on its side.",
  },
  "function-circle": {
    labels: ["function", "circle"],
    description: "Circle with a function sign f inside.",
  },
  "function-square": {
    labels: ["function", "square"],
    description: "Square with a function sign f inside.",
  },
  "gas-pipe": {
    labels: ["gas", "pipe"],
    description: "Horizontal pipe through a valve with its wheel.",
  },
  "give-pill": {
    labels: ["give", "pill"],
    description:
      "Hand offering a capsule: the offering hand of the set under a pill in the secondary tone.",
  },
  grapes: {
    labels: ["grapes"],
    description: "A bunch of grapes with a stem and a leaf.",
  },
  grip: {
    labels: ["grip"],
    description: "A three-by-three grid of dots used as a drag handle.",
  },
  "hand-pointing-down-02": {
    labels: ["hand", "pointing", "down"],
    description: "Hand pointing down, thumb on the right: the downward pointing hand mirrored.",
  },
  hologram: {
    labels: ["hologram"],
    description: "Projector casting a light cone under a floating shape.",
  },
  "inequality-circle-01": {
    labels: ["inequality", "circle"],
    description: "Less-than-or-equal sign in a circle.",
  },
  "inequality-circle-02": {
    labels: ["inequality", "circle"],
    description: "Greater-than-or-equal sign in a circle.",
  },
  "location-check-02": {
    labels: ["location", "check"],
    description: "The shared map pin with a bold two-pixel check badge in the secondary tone.",
  },
  "location-update-02": {
    labels: ["location", "update"],
    description: "The shared map pin with a badge of two circling arrows in the secondary tone.",
  },
  "login-method": {
    labels: ["login", "method"],
    description: "Padlock above three password dots.",
  },
  "map-pin-check-inside": {
    labels: ["map", "pin", "check"],
    description:
      "An odd-width map pin with a check centred in its head in thin one-pixel strokes, in the secondary tone.",
  },
  "map-pin-minus-inside": {
    labels: ["map", "pin", "minus"],
    description:
      "An odd-width map pin with a minus centred in its head in a thin one-pixel stroke, in the secondary tone.",
  },
  "map-pin-plus-inside": {
    labels: ["map", "pin", "plus"],
    description:
      "An odd-width map pin with a plus centred in its head in thin one-pixel strokes, in the secondary tone.",
  },
  "map-pin-x-inside": {
    labels: ["map", "pin", "x"],
    description:
      "An odd-width map pin with a cross centred in its head in thin one-pixel strokes, in the secondary tone.",
  },
  mixer: {
    labels: ["mixer"],
    description: "Stand mixer with its bowl on a base.",
  },
  monster: {
    labels: ["monster"],
    description: "Horned round monster with one big eye.",
  },
  "navigator-01": {
    labels: ["navigator"],
    description: "Road with a navigation arrow.",
  },
  "nuclear-power": {
    labels: ["nuclear", "power"],
    description: "Cooling tower with a cloud of steam.",
  },
  "payment-02": {
    labels: ["payment"],
    description:
      "A bank card held above the offering hand of the set, the card in the secondary tone.",
  },
  "pen-tool-add": {
    labels: ["pen", "tool", "add"],
    description: "Small pen tool nib with a plus.",
  },
  "pen-tool-minus": {
    labels: ["pen", "tool", "minus"],
    description: "Small pen tool nib with a minus.",
  },
  pendulum: {
    labels: ["pendulum"],
    description: "A pendulum swinging from its bar.",
  },
  "plug-socket": {
    labels: ["plug", "socket"],
    description: "Plug pointing down into a socket plate.",
  },
  "power-socket-01": {
    labels: ["power", "socket"],
    description: "A wall socket with two pin holes.",
  },
  "prism-01": {
    labels: ["prism"],
    description: "Optical prism splitting a beam into rays.",
  },
  "prison-guard": {
    labels: ["prison", "guard"],
    description: "A person wearing a peaked cap.",
  },
  prisoner: {
    labels: ["prisoner"],
    description: "Person in a striped uniform.",
  },
  "product-loading": {
    labels: ["product", "loading"],
    description: "A package with a spinner arc badge.",
  },
  "quote-down-circle": {
    labels: ["quote", "down", "circle"],
    description: "Closing quotation marks in a circle.",
  },
  "quote-down-square": {
    labels: ["quote", "down", "square"],
    description: "Closing quotation marks in a square.",
  },
  "quote-up-circle": {
    labels: ["quote", "up", "circle"],
    description: "Opening quotation marks in a circle.",
  },
  "quote-up-square": {
    labels: ["quote", "up", "square"],
    description: "Opening quotation marks in a square.",
  },
  "road-location-01": {
    labels: ["road", "location"],
    description:
      "The shared map pin above a road whose dashed centre line is in the secondary tone.",
  },
  shoes: {
    labels: ["shoes"],
    description: "Sneaker seen from the side on a flat sole.",
  },
  software: {
    labels: ["software"],
    description: "A window with a title bar and code brackets.",
  },
  "solar-energy": {
    labels: ["solar", "energy"],
    description: "A sun rising behind a solar panel.",
  },
  "sorting-1-9": {
    labels: ["sorting"],
    description: "Sort ascending by number: 1 over 9 beside a down arrow.",
  },
  "sorting-9-1": {
    labels: ["sorting"],
    description: "Sort descending by number: 9 over 1 beside a down arrow.",
  },
  "square-bottom-dashed-scissors": {
    labels: ["square", "bottom", "dashed"],
    description: "Square with a dashed bottom edge and scissors inside.",
  },
  "square-scissors": {
    labels: ["square", "scissors"],
    description: "Square with scissors inside.",
  },
  "table-lamp-01": {
    labels: ["table", "lamp"],
    description: "A table lamp with a tapered shade.",
  },
  "table-lamp-02": {
    labels: ["table", "lamp"],
    description: "A table lamp with a round shade.",
  },
  "taco-01": {
    labels: ["taco"],
    description: "A domed taco shell under an arc of filling.",
  },
  "tap-02": {
    labels: ["tap"],
    description: "Tap: the pointing hand of the set under a wide arc in the secondary tone.",
  },
  "tape-measure": {
    labels: ["tape", "measure"],
    description: "A tape measure case with its tape pulled out.",
  },
  "text-select": {
    labels: ["text", "select"],
    description: "Lines of text inside a dashed frame.",
  },
  "trolley-02": {
    labels: ["trolley"],
    description: "A hand truck carrying a box, with its wheel.",
  },
  "truck-monster": {
    labels: ["truck", "monster"],
    description: "A pickup on huge wheels.",
  },
  unplug: {
    labels: ["unplug"],
    description: "A plug pulled away from the wall.",
  },
  "water-pump": {
    labels: ["water", "pump"],
    description: "A hand pump with a lever, a spout and a drop.",
  },
  "x-variable-circle": {
    labels: ["x", "variable", "circle"],
    description: "Circle with a variable x.",
  },
  "x-variable-square": {
    labels: ["x", "variable", "square"],
    description: "Square with a variable x.",
  },
  "function-circle-fill": {
    reference:
      "Filled variant of our own `function-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "function"],
    description: "Filled: circle with a function sign f inside.",
  },
  "function-square-fill": {
    reference:
      "Filled variant of our own `function-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "function"],
    description: "Filled: square with a function sign f inside.",
  },
  "inequality-circle-01-fill": {
    reference:
      "Filled variant of our own `inequality-circle-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "inequality"],
    description: "Filled: less-than-or-equal sign in a circle.",
  },
  "inequality-circle-02-fill": {
    reference:
      "Filled variant of our own `inequality-circle-02`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "inequality"],
    description: "Filled: greater-than-or-equal sign in a circle.",
  },
  "quote-down-circle-fill": {
    reference:
      "Filled variant of our own `quote-down-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "quote"],
    description: "Filled: closing quotation marks in a circle.",
  },
  "quote-down-square-fill": {
    reference:
      "Filled variant of our own `quote-down-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "quote"],
    description: "Filled: closing quotation marks in a square.",
  },
  "quote-up-circle-fill": {
    reference:
      "Filled variant of our own `quote-up-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "quote"],
    description: "Filled: opening quotation marks in a circle.",
  },
  "quote-up-square-fill": {
    reference:
      "Filled variant of our own `quote-up-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "quote"],
    description: "Filled: opening quotation marks in a square.",
  },
  "x-variable-square-fill": {
    reference:
      "Filled variant of our own `x-variable-square`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "x"],
    description: "Filled: square with a variable x.",
  },
  "x-variable-circle-fill": {
    reference:
      "Filled variant of our own `x-variable-circle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "x"],
    description: "Filled: circle with a variable x.",
  },
  "drag-left-01": {
    labels: ["drag", "left"],
    description: "Drag left: `drag-right-01` mirrored.",
  },
  "drag-left-02": {
    labels: ["drag", "left"],
    description: "Drag left: `drag-right-02` mirrored.",
  },
  "drag-left-03": {
    labels: ["drag", "left"],
    description: "Drag left: `drag-right-03` mirrored.",
  },
  "drag-left-04": {
    labels: ["drag", "left"],
    description: "Drag left: `drag-right-04` mirrored.",
  },
  "drag-right-01": {
    labels: ["drag", "right"],
    description: "Drag right: the fist of the set, cut at the wrist, under an arrow to the right.",
  },
  "drag-right-02": {
    labels: ["drag", "right"],
    description:
      "Drag right: the fist of the set, cut at the wrist, under an arrow to the right with a dashed trail.",
  },
  "drag-right-03": {
    labels: ["drag", "right"],
    description:
      "Drag an item right: the fist of the set, cut at the wrist, under a small box and an arrow to the right.",
  },
  "drag-right-04": {
    labels: ["drag", "right"],
    description: "Drag right with the left hand: `drag-right-01` with the fist mirrored.",
  },
  "swipe-down-02": {
    labels: ["swipe", "down"],
    description:
      "A touch point with an arrow down in the secondary tone: `swipe-up-02` turned upside down.",
  },
  "swipe-down-03": {
    labels: ["swipe", "down"],
    description:
      "Two touch points, each with an arrow down in the secondary tone: `swipe-up-03` turned upside down.",
  },
  "swipe-down-04": {
    labels: ["swipe", "down"],
    description:
      "Two-finger swipe down: the pointing hand of the set with two fingers raised, beside an arrow down.",
  },
  "swipe-down-05": {
    labels: ["swipe", "down"],
    description: "Swipe down with the left hand: `swipe-down-01` mirrored.",
  },
  "swipe-down-06": {
    labels: ["swipe", "down"],
    description:
      "Swipe down: the pointing hand of the set, cut at the wrist, under a long arrow down to its fingertip.",
  },
  "swipe-down-07": {
    labels: ["swipe", "down"],
    description:
      "Fast swipe down: the pointing hand of the set, cut at the wrist, under two arrows down.",
  },
  "swipe-down-08": {
    labels: ["swipe", "down"],
    description: "Swipe down: the pointing hand of the set with the arrow down on the thumb side.",
  },
  "swipe-left-02": {
    labels: ["swipe", "left"],
    description:
      "A touch point with an arrow to the left in the secondary tone: `swipe-right-02` mirrored.",
  },
  "swipe-left-03": {
    labels: ["swipe", "left"],
    description:
      "Two touch points, each with an arrow to the left in the secondary tone: `swipe-right-03` mirrored.",
  },
  "swipe-left-04": {
    labels: ["swipe", "left"],
    description: "Swipe left: `swipe-right-04` mirrored.",
  },
  "swipe-left-05": {
    labels: ["swipe", "left"],
    description: "Swipe left: `swipe-right-05` mirrored.",
  },
  "swipe-left-06": {
    labels: ["swipe", "left"],
    description: "Swipe left: `swipe-right-06` mirrored.",
  },
  "swipe-left-07": {
    labels: ["swipe", "left"],
    description: "Swipe left: `swipe-right-07` mirrored.",
  },
  "swipe-left-08": {
    labels: ["swipe", "left"],
    description: "Swipe left: `swipe-right-08` mirrored.",
  },
  "swipe-left-09": {
    labels: ["swipe", "left"],
    description: "Swipe left: `swipe-right-09` mirrored.",
  },
  "swipe-right-04": {
    labels: ["swipe", "right"],
    description: "Swipe right: the pointing hand of the set beside a short arrow to the right.",
  },
  "swipe-right-05": {
    labels: ["swipe", "right"],
    description:
      "Two-finger swipe right: the pointing hand of the set with two fingers raised, under an arrow to the right.",
  },
  "swipe-right-06": {
    labels: ["swipe", "right"],
    description:
      "Swipe right with the left hand: `swipe-right-01` with the pointing hand mirrored.",
  },
  "swipe-right-07": {
    labels: ["swipe", "right"],
    description:
      "Swipe right: the pointing hand of the set beside an arrow to the right with a dashed trail.",
  },
  "swipe-right-08": {
    labels: ["swipe", "right"],
    description:
      "Fast swipe right: the pointing hand of the set, cut at the wrist, under two staggered arrows to the right.",
  },
  "swipe-right-09": {
    labels: ["swipe", "right"],
    description:
      "Swipe right along a curve: the pointing hand of the set under an arc that comes down on the right into an arrowhead.",
  },
  "swipe-up-04": {
    labels: ["swipe", "up"],
    description:
      "Two-finger swipe up: the pointing hand of the set with two fingers raised, beside an arrow up.",
  },
  "swipe-up-05": {
    labels: ["swipe", "up"],
    description: "Swipe up with the left hand: `swipe-up-01` mirrored.",
  },
  "swipe-up-06": {
    labels: ["swipe", "up"],
    description:
      "Swipe up: the pointing hand of the set, cut at the wrist, under a long arrow up from its fingertip.",
  },
  "swipe-up-07": {
    labels: ["swipe", "up"],
    description:
      "Fast swipe up: the pointing hand of the set, cut at the wrist, under two arrows up.",
  },
  "swipe-up-08": {
    labels: ["swipe", "up"],
    description: "Swipe up: the pointing hand of the set with the arrow up on the thumb side.",
  },
  "tap-03": {
    labels: ["tap"],
    description: "Tap: the pointing hand of the set under three short rays aimed at the fingertip.",
  },
  "tap-04": {
    labels: ["tap"],
    description: "Tap with the left hand: `tap-01` mirrored.",
  },
  "tap-05": {
    labels: ["tap"],
    description:
      "Two-finger tap: the pointing hand of the set with two fingers raised under a wide arc.",
  },
  "tap-06": {
    labels: ["tap"],
    description:
      "Double tap: the pointing hand of the set, cut at the wrist, under two nested arcs.",
  },
  "tap-07": {
    labels: ["tap"],
    description:
      "Long press: the pointing hand of the set, cut at the wrist, under a short arc beside a small clock.",
  },
  "tap-08": {
    labels: ["tap"],
    description: "Tap on a target: the pointing hand of the set with its fingertip in a crosshair.",
  },
  "clapping-01": {
    labels: ["clapping"],
    description:
      "Clapping: the hands of `hand-prayer` parting at the fingertips, three motion marks in the secondary tone.",
  },
  "hand-prayer": {
    labels: ["hand", "prayer"],
    description:
      "Praying hands: two hands joined upright palm to palm, a one-pixel seam between them and a cuff under each.",
  },
  "hands-clapping": {
    labels: ["hands", "clapping"],
    description:
      "Hands clapping: the hands of `hand-prayer` palm to palm, clap marks in the secondary tone on both sides.",
  },
  handshake: {
    labels: ["handshake"],
    description:
      "Handshake: two hands clasped along a diagonal seam between a cuff on each side, the fingers of one under the other.",
  },
  "heart-handshake": {
    labels: ["heart", "handshake"],
    description: "Handshake with a heart: `handshake` under a small heart in the secondary tone.",
  },
  "love-korean-finger": {
    labels: ["love", "korean", "finger"],
    description:
      "Finger heart: the fist of `hand-fist` with the thumb and index crossed above it, a small heart in the secondary tone.",
  },
  "sign-language-c": {
    labels: ["sign", "language", "c"],
    description:
      "Sign language C: a hand curved into the letter C, the fingers over the top, the thumb under, a cuff below.",
  },
  "thumbs-up-down": {
    labels: ["thumbs", "up", "down"],
    description:
      "Thumbs up and down: a small `thumbs-up` top left and a small `thumbs-down` bottom right, cuffs outside.",
  },
  "victory-finger-01": {
    labels: ["victory", "finger"],
    description:
      "Victory sign: the index and middle fingers of `hand` spread into a V, the other two folded on the palm.",
  },
  "victory-finger-02": {
    labels: ["victory", "finger"],
    description:
      "Victory sign with the thumb: the V of `victory-finger-01` with the thumb of `hand` out at 45\u00b0.",
  },
  "victory-finger-03": {
    labels: ["victory", "finger"],
    description:
      "Victory sign from the back: the V of `victory-finger-01` mirrored, the folded fingers hidden behind the hand.",
  },
  "cursor-hold-02": {
    labels: ["cursor", "hold"],
    description:
      "Pointer (the cursor-loading-01 base) with a clock in the secondary tone: press and hold.",
  },
  "do-not-touch-02": {
    labels: ["do", "not", "touch"],
    description:
      "Do not touch: the pointing hand of the set crossed by a slash in the secondary tone.",
  },
  "four-finger-03": {
    labels: ["four", "finger"],
    description: "Four fingers, back of the hand: `four-finger-02` mirrored.",
  },
  "hand-grip": {
    labels: ["hand", "grip"],
    description: "Hand grip: the fist of the set closed on a bar in the secondary tone.",
  },
  "hand-helping": {
    labels: ["hand", "helping"],
    description:
      "Helping hand: the offering hand of the set, empty, raised to the middle of the grid.",
  },
  "hand-pointing-down-03": {
    labels: ["hand", "pointing", "down"],
    description: "Hand pointing down: `hand-pointing-down-01` with the thumb folded.",
  },
  "hand-pointing-down-04": {
    labels: ["hand", "pointing", "down"],
    description:
      "Hand pointing down at a spot: `hand-pointing-down-01` over a short line in the secondary tone.",
  },
  "hand-pointing-left-02": {
    labels: ["hand", "pointing", "left"],
    description: "Hand pointing left: `hand-pointing-right-02` mirrored.",
  },
  "hand-pointing-left-03": {
    labels: ["hand", "pointing", "left"],
    description: "Hand pointing left: `hand-pointing-right-03` mirrored.",
  },
  "hand-pointing-left-04": {
    labels: ["hand", "pointing", "left"],
    description: "Hand pointing left: `hand-pointing-right-04` mirrored.",
  },
  "hand-pointing-right-02": {
    labels: ["hand", "pointing", "right"],
    description: "Hand pointing right: `hand-pointing-right-01` with the thumb folded.",
  },
  "hand-pointing-right-03": {
    labels: ["hand", "pointing", "right"],
    description:
      "Hand pointing right, palm side: `hand-pointing-right-02` turned over, the finger along the lower edge.",
  },
  "hand-pointing-right-04": {
    labels: ["hand", "pointing", "right"],
    description:
      "Hand pointing right, palm side: `hand-pointing-right-01` turned over, the thumb underneath.",
  },
  "hold-02": {
    labels: ["hold"],
    description:
      "Hand holding a card: the offering hand of the set under a bank card in the secondary tone.",
  },
  "hold-03": {
    labels: ["hold"],
    description:
      "Hand holding a document: the offering hand of the set under a page with two lines in the secondary tone.",
  },
  "hold-04": {
    labels: ["hold"],
    description:
      "Hand holding a coin: the offering hand of the set under one coin in the secondary tone.",
  },
  "hold-05": {
    labels: ["hold"],
    description:
      "Hand holding an idea: the offering hand of the set under a light bulb in the secondary tone.",
  },
  "hold-locked-02": {
    labels: ["hold", "locked"],
    description:
      "Hand holding an open padlock: `hold-locked-01` with the shackle lifted on one side.",
  },
  "pointing-left-01": {
    labels: ["pointing", "left"],
    description: "Pointing left: `pointing-right-01` mirrored.",
  },
  "pointing-left-02": {
    labels: ["pointing", "left"],
    description: "Pointing left: `pointing-right-02` mirrored.",
  },
  "pointing-left-03": {
    labels: ["pointing", "left"],
    description: "Pointing left: `pointing-right-03` mirrored.",
  },
  "pointing-left-04": {
    labels: ["pointing", "left"],
    description: "Pointing left: `pointing-right-04` mirrored.",
  },
  "pointing-left-05": {
    labels: ["pointing", "left"],
    description: "Pointing left: `pointing-right-05` mirrored.",
  },
  "pointing-left-06": {
    labels: ["pointing", "left"],
    description: "Pointing left: `pointing-right-06` mirrored.",
  },
  "pointing-left-07": {
    labels: ["pointing", "left"],
    description: "Pointing left: `pointing-right-07` mirrored.",
  },
  "pointing-left-08": {
    labels: ["pointing", "left"],
    description: "Pointing left: `pointing-right-08` mirrored.",
  },
  "pointing-right-01": {
    labels: ["pointing", "right"],
    description:
      "Pointing right: the pointing hand of the set with the thumb folded, under a long arrow in the secondary tone.",
  },
  "pointing-right-02": {
    labels: ["pointing", "right"],
    description:
      "Pointing right: the pointing hand of the set with the thumb folded, under a short arrow in the secondary tone.",
  },
  "pointing-right-03": {
    labels: ["pointing", "right"],
    description:
      "Pointing right: the pointing hand of the set with the thumb folded, under an arrow to a stop bar in the secondary tone.",
  },
  "pointing-right-04": {
    labels: ["pointing", "right"],
    description:
      "Pointing right: the pointing hand of the set with the thumb folded, under a double chevron in the secondary tone.",
  },
  "pointing-right-05": {
    labels: ["pointing", "right"],
    description:
      "Pointing right: the pointing hand of the set with the thumb folded, under a dashed arrow in the secondary tone.",
  },
  "pointing-right-06": {
    labels: ["pointing", "right"],
    description:
      "Pointing right: the pointing hand of the set with the thumb folded, over a long arrow in the secondary tone.",
  },
  "pointing-right-07": {
    labels: ["pointing", "right"],
    description:
      "Pointing right, palm side: the pointing hand turned over, finger along the lower edge, under a long arrow in the secondary tone.",
  },
  "pointing-right-08": {
    labels: ["pointing", "right"],
    description:
      "Pointing right, palm side: the pointing hand turned over, finger along the lower edge, under a short arrow in the secondary tone.",
  },
  "shaka-02": {
    labels: ["shaka"],
    description: "Shaka sign, back of the hand: `shaka-01` mirrored.",
  },
  "three-finger-05": {
    labels: ["three", "finger"],
    description:
      "Three fingers, back of the hand: `three-finger-02` mirrored, the thumb on the right.",
  },
  "touch-03": {
    labels: ["touch"],
    description:
      "Touch, left hand: `touch-01` mirrored, the fingertip inside a ring in the secondary tone.",
  },
  "touch-04": {
    labels: ["touch"],
    description: "Touch, left hand: `touch-02` mirrored, three short rays above the fingertip.",
  },
  "touch-05": {
    labels: ["touch"],
    description:
      "Touch: the pointing hand of the set with the thumb folded, the fingertip inside a ring in the secondary tone.",
  },
  "touch-06": {
    labels: ["touch"],
    description:
      "Touch: the pointing hand of the set with the thumb folded, three short rays above the fingertip.",
  },
  "touch-07": {
    labels: ["touch"],
    description:
      "Touch from the side: `hand-pointing-right-01` pressing a short arc in the secondary tone at its fingertip.",
  },
  "touch-08": {
    labels: ["touch"],
    description: "Touch from the side, left hand: `touch-07` mirrored.",
  },
  "touch-10": {
    labels: ["touch"],
    description:
      "Two-finger touch: the index and middle fingers of the set under a wide arc in the secondary tone.",
  },
  "touch-interaction-03": {
    labels: ["touch", "interaction"],
    description:
      "Touch interaction: the pointing hand of the set pressing inside a frame in the secondary tone.",
  },
  "touch-interaction-04": {
    labels: ["touch", "interaction"],
    description: "Touch interaction, left hand: `touch-interaction-03` mirrored.",
  },
  "touch-locked-02": {
    labels: ["touch", "locked"],
    description:
      "Touch unlocked: the pointing hand of the set beside an open padlock in the secondary tone.",
  },
  "touch-locked-03": {
    labels: ["touch", "locked"],
    description: "Touch locked, left hand: `touch-locked-01` mirrored.",
  },
  "touch-locked-04": {
    labels: ["touch", "locked"],
    description: "Touch unlocked, left hand: `touch-locked-02` mirrored.",
  },
  "two-finger-02": {
    labels: ["two", "finger"],
    description: "Two fingers, back of the hand: `two-finger-01` mirrored.",
  },
  "two-finger-03": {
    labels: ["two", "finger"],
    description: "Peace sign: `two-finger-01` with the two raised fingers spread apart.",
  },
  "two-finger-04": {
    labels: ["two", "finger"],
    description: "Fingers crossed: `two-finger-01` with the middle finger crossed over the index.",
  },
  "two-finger-05": {
    labels: ["two", "finger"],
    description:
      "Two fingers pointing right: `two-finger-01` turned a quarter turn, cuff on the left.",
  },
  "waving-hand-02": {
    labels: ["waving", "hand"],
    description:
      "Waving hand, back of the hand: `waving-hand-01` mirrored, the motion mark on the left.",
  },
  egg: {
    labels: ["egg"],
    description: "Egg: a one-pixel oval, narrower at the top.",
  },
  energy: {
    labels: ["energy"],
    description: "Energy: a solid lightning bolt, symmetric by a half turn.",
  },
  gauge: {
    labels: ["gauge"],
    description: "Gauge: a dial open at the bottom, its needle and hub in the secondary tone.",
  },
  hat: {
    labels: ["hat"],
    description:
      "Hat: a crown with a band in the secondary tone over a brim curled up at both ends.",
  },
  label: {
    labels: ["label"],
    description: "Label: a tag with a square left end and a pointed right end.",
  },
  mask: {
    labels: ["mask"],
    description:
      "Face mask: a pleated mask, two pleats in the secondary tone, with ear loops either side.",
  },
  merge: {
    labels: ["merge"],
    description: "Merge: two paths joining into one that goes up, ending in an arrowhead.",
  },
  paragraph: {
    labels: ["paragraph"],
    description: "Pilcrow: a solid bowl with two stems.",
  },
  ratio: {
    labels: ["ratio"],
    description: "Aspect ratio: a portrait frame in the secondary tone inside a landscape one.",
  },
  tie: {
    labels: ["tie"],
    description: "A necktie: a small knot over a long pointed blade.",
  },
  utensils: {
    labels: ["utensils"],
    description: "Fork and knife side by side, upright; the fork is the one of `spoon-and-fork`.",
  },
  vest: {
    labels: ["vest"],
    description:
      "Sleeveless vest: narrow straps, a deep V neck and two buttons in the secondary tone.",
  },
  "tie-fill": {
    reference: "Filled variant of our own `tie`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "tie"],
    description: "Filled: a necktie: a small knot over a long pointed blade.",
  },
  "vest-fill": {
    reference: "Filled variant of our own `vest`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "vest"],
    description:
      "Filled: sleeveless vest: narrow straps, a deep V neck and two buttons in the secondary tone.",
  },
  "label-fill": {
    reference: "Filled variant of our own `label`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "label"],
    description: "Filled: label: a tag with a square left end and a pointed right end.",
  },
  "mask-fill": {
    reference: "Filled variant of our own `mask`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "mask"],
    description:
      "Filled: face mask: a pleated mask, two pleats in the secondary tone, with ear loops either side.",
  },
  "bitcoin-03": {
    labels: ["bitcoin"],
    description:
      "The offering hand of `save-money-dollar` under a bitcoin sign in the secondary tone.",
  },
  "bitcoin-bag": {
    labels: ["bitcoin", "bag"],
    description: "The money bag of `money-bag-02` with a bitcoin sign in the secondary tone.",
  },
  "bitcoin-down-01": {
    labels: ["bitcoin", "down"],
    description:
      "Bitcoin down: the thin arrow of `arrow-down-03` and the bitcoin badge of `file-bitcoin` in the lower-right corner.",
  },
  "bitcoin-down-02": {
    labels: ["bitcoin", "down"],
    description:
      "Bitcoin trend down: the zigzag of `chart-down` under the bitcoin badge of `file-bitcoin`, moved to the upper right.",
  },
  "bitcoin-money-01": {
    labels: ["bitcoin", "money"],
    description: "A banknote with a bitcoin sign in the middle, in the secondary tone.",
  },
  "bitcoin-money-02": {
    labels: ["bitcoin", "money"],
    description:
      "Two banknotes stacked like `money-02`, a bitcoin sign on the front one in the secondary tone.",
  },
  "bitcoin-receive": {
    labels: ["bitcoin", "receive"],
    description:
      "The bitcoin sign of `bitcoin-01`, moved left, with the arrow badge of `pound-receive` pointing in, in the secondary tone.",
  },
  "bitcoin-safe": {
    labels: ["bitcoin", "safe"],
    description: "The safe of `money-safe` with a bitcoin sign on its door in the secondary tone.",
  },
  "bitcoin-send": {
    labels: ["bitcoin", "send"],
    description:
      "The bitcoin sign of `bitcoin-01`, moved left, with the arrow badge of `pound-send` pointing out, in the secondary tone.",
  },
  "bitcoin-square": {
    labels: ["bitcoin", "square"],
    description: "A bitcoin sign in the rounded square of `dollar-square`, in the secondary tone.",
  },
  "bitcoin-transaction": {
    labels: ["bitcoin", "transaction"],
    description:
      "Two arrows turning around a bitcoin sign, symmetric by a half turn, the sign in the secondary tone.",
  },
  "bitcoin-up-01": {
    labels: ["bitcoin", "up"],
    description:
      "Bitcoin up: the thin arrow of `arrow-up-03` and the bitcoin badge of `file-bitcoin` in the lower-right corner.",
  },
  "bitcoin-up-02": {
    labels: ["bitcoin", "up"],
    description:
      "Bitcoin trend up: the zigzag of `chart-up` and the bitcoin badge of `file-bitcoin` in the lower-right corner.",
  },
  "bitcoin-wallet": {
    labels: ["bitcoin", "wallet"],
    description:
      "The wallet of `wallet-01` and the bitcoin badge of `file-bitcoin` in the lower-right corner.",
  },
  "bitcoin-withdraw": {
    labels: ["bitcoin", "withdraw"],
    description:
      "A cash slot with a note coming out of it, a bitcoin sign on the note in the secondary tone.",
  },
  "cashback-bitcoin": {
    labels: ["cashback", "bitcoin"],
    description:
      "Cashback in bitcoin: the return arrow ring of `cashback` around a bitcoin sign in the secondary tone.",
  },
  "exchange-bitcoin": {
    labels: ["exchange", "bitcoin"],
    description:
      "Exchange: an arrow right above, an arrow left below, a bitcoin sign between them in the secondary tone.",
  },
  "bitcoin-cloud": {
    labels: ["bitcoin", "cloud"],
    description: "The cloud of `cloud` and a bitcoin sign badge.",
  },
  "bitcoin-cpu": {
    labels: ["bitcoin", "cpu"],
    description: "The chip of `cpu` and a bitcoin sign badge.",
  },
  "bitcoin-credit-card": {
    labels: ["bitcoin", "credit", "card"],
    description:
      "The card of `credit-card`, its band in the primary tone, and a bitcoin sign badge.",
  },
  "bitcoin-database": {
    labels: ["bitcoin", "database"],
    description: "The cylinder of `database-01` and a bitcoin sign badge.",
  },
  "bitcoin-eye": {
    labels: ["bitcoin", "eye"],
    description: "A small eye with its pupil and a bitcoin sign badge.",
  },
  "bitcoin-filter": {
    labels: ["bitcoin", "filter"],
    description: "A narrow funnel after `filter` and a bitcoin sign badge.",
  },
  "bitcoin-flashdisk": {
    labels: ["bitcoin", "flashdisk"],
    description: "The memory stick of `usb-memory-01` and a bitcoin sign badge.",
  },
  "bitcoin-graph": {
    labels: ["bitcoin", "graph"],
    description: "The rising trend line of `chart-up` and a bitcoin sign badge.",
  },
  "bitcoin-invoice": {
    labels: ["bitcoin", "invoice"],
    description: "The sheet of `invoice-01`, torn at the bottom, and a bitcoin sign badge.",
  },
  "bitcoin-key": {
    labels: ["bitcoin", "key"],
    description: "The key of `key-01` with single teeth and a bitcoin sign badge.",
  },
  "bitcoin-location": {
    labels: ["bitcoin", "location"],
    description: "The small pin of `location-add-01` and a bitcoin sign badge.",
  },
  "bitcoin-lock": {
    labels: ["bitcoin", "lock"],
    description: "A padlock with a bitcoin sign on its body.",
  },
  "bitcoin-mail": {
    labels: ["bitcoin", "mail"],
    description: "The envelope of `mail-lock-01` and a bitcoin sign badge.",
  },
  "bitcoin-mind": {
    labels: ["bitcoin", "mind"],
    description: "The brain of `brain-cog` and a bitcoin sign badge.",
  },
  "bitcoin-pie-chart": {
    labels: ["bitcoin", "pie", "chart"],
    description:
      "A pie chart with its lower-right slice taken out and a bitcoin sign in its place.",
  },
  "bitcoin-presentation": {
    labels: ["bitcoin", "presentation"],
    description: "A presentation board on its stand with a bitcoin sign on the board.",
  },
  "bitcoin-receipt": {
    labels: ["bitcoin", "receipt"],
    description: "The receipt of `receipt`, torn top and bottom, and a bitcoin sign badge.",
  },
  "bitcoin-search": {
    labels: ["bitcoin", "search"],
    description: "A magnifying glass with a bitcoin sign in its lens.",
  },
  "bitcoin-setting": {
    labels: ["bitcoin", "setting"],
    description:
      "The cog of `settings-01` with a quarter taken out and a bitcoin sign in its place.",
  },
  "bitcoin-shield": {
    labels: ["bitcoin", "shield"],
    description: "The shield of `shield-01` with a bitcoin sign inside.",
  },
  "bitcoin-shopping": {
    labels: ["bitcoin", "shopping"],
    description: "A shopping bag with its handle and a bitcoin sign on the bag.",
  },
  "bitcoin-smartphone-01": {
    labels: ["bitcoin", "smartphone"],
    description: "The phone of `phone-lock` and a bitcoin sign badge.",
  },
  "bitcoin-smartphone-02": {
    labels: ["bitcoin", "smartphone"],
    description: "A wider phone with a bitcoin sign on its screen.",
  },
  "bitcoin-store": {
    labels: ["bitcoin", "store"],
    description: "The shop of `store-01`, its awning in outline, and a bitcoin sign badge.",
  },
  "bitcoin-tag": {
    labels: ["bitcoin", "tag"],
    description: "The price tag of `tag-01` with its tip replaced by a bitcoin sign badge.",
  },
  coinbase: {
    category: "brands",
    labels: ["coinbase", "exchange", "crypto"],
    description: "The Coinbase C in a circle.",
    reference:
      "Coinbase logo composition (thick C, square counter, open on the right), redrawn by hand on 2026-11-18; simple-icons:coinbase is now the wordmark.",
    trademark:
      "Coinbase and the Coinbase logo are trademarks of Coinbase, Inc., used here only to refer to Coinbase.",
  },
  ethereum: {
    category: "brands",
    labels: ["ethereum", "ether", "crypto"],
    description: "The Ethereum mark: a diamond over a chevron.",
    reference:
      "simple-icons:ethereum (Iconify, 2026-11-18): cell-centre sample on 12, redrawn by hand.",
    trademark:
      "Ethereum and the Ethereum logo are trademarks of the Ethereum Foundation, used here only to refer to Ethereum.",
  },
  "ethereum-ellipse": {
    category: "brands",
    labels: ["ethereum", "coin", "crypto"],
    description: "The Ethereum mark in a coin ring.",
    reference:
      "simple-icons:ethereum (Iconify, 2026-11-18): cell-centre sample on 12, redrawn by hand inside the ring of bitcoin-01.",
    trademark:
      "Ethereum and the Ethereum logo are trademarks of the Ethereum Foundation, used here only to refer to Ethereum.",
  },
  "ethereum-rectangle": {
    category: "brands",
    labels: ["ethereum", "token", "crypto"],
    description: "The Ethereum mark in a rounded square.",
    reference:
      "simple-icons:ethereum (Iconify, 2026-11-18): cell-centre sample on 12, redrawn by hand inside a rounded square.",
    trademark:
      "Ethereum and the Ethereum logo are trademarks of the Ethereum Foundation, used here only to refer to Ethereum.",
  },
  litecoin: {
    category: "brands",
    labels: ["litecoin", "coin", "crypto"],
    description: "The Litecoin L with its crossing stroke in a coin ring.",
    reference:
      "simple-icons:litecoin (Iconify, 2026-11-18): cell-centre sample on 12, redrawn by hand as a positive glyph in the ring of bitcoin-01.",
    trademark:
      "Litecoin and the Litecoin logo are trademarks of the Litecoin Foundation, used here only to refer to Litecoin.",
  },
  "mining-01": {
    labels: ["mining", "pickaxe", "bitcoin"],
    description: "A pickaxe on the diagonal with a bitcoin badge.",
  },
  "mining-03": {
    labels: ["mining", "rig", "gpu"],
    description: "A graphics board with a fan and a bitcoin badge.",
  },
  "token-circle": {
    labels: ["token", "coin", "hexagon"],
    description: "A coin ring with a hexagon inside.",
  },
  "token-square": {
    labels: ["token", "square", "hexagon"],
    description: "A rounded square with a hexagon inside.",
  },
  usdt: {
    category: "brands",
    labels: ["tether", "stablecoin", "crypto"],
    description: "The Tether T with its crossing bar in a coin ring.",
    reference:
      "simple-icons:tether (Iconify, 2026-11-18): cell-centre sample on 12, redrawn by hand as a positive glyph in the ring of bitcoin-01.",
    trademark:
      "Tether, USDT and the Tether logo are trademarks of Tether Operations Limited, used here only to refer to Tether.",
  },
  "java-script": {
    category: "brands",
    labels: ["js", "language", "code"],
    description: "The JavaScript mark: the letters JS cut out of a square.",
    reference: "simple-icons:javascript (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "JavaScript is a trademark of Oracle Corporation, used here only to refer to JavaScript.",
  },
  "kickstarter-01": {
    category: "brands",
    labels: ["crowdfunding", "funding", "projects"],
    description: "The Kickstarter K: a rounded bar with two rounded arms.",
    reference: "simple-icons:kickstarter (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Kickstarter and the Kickstarter logo are trademarks of Kickstarter, PBC, used here only to refer to Kickstarter.",
  },
  "kickstarter-02": {
    category: "brands",
    labels: ["crowdfunding", "funding", "app"],
    description: "The Kickstarter K cut out of a rounded square.",
    reference: "simple-icons:kickstarter (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Kickstarter and the Kickstarter logo are trademarks of Kickstarter, PBC, used here only to refer to Kickstarter.",
  },
  "kimi-ai": {
    category: "brands",
    labels: ["assistant", "chatbot", "ai"],
    description: "The Kimi mark: a K with a dot at its upper right.",
    reference: "simple-icons:kimi (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Kimi and the Kimi logo are trademarks of Moonshot AI, used here only to refer to Kimi.",
  },
  klarna: {
    category: "brands",
    labels: ["payment", "checkout", "credit"],
    description: "The Klarna mark: a bar, a curved stroke and the full stop.",
    reference: "simple-icons:klarna (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Klarna and the Klarna logo are trademarks of Klarna Bank AB, used here only to refer to Klarna.",
  },
  "ko-fi": {
    category: "brands",
    labels: ["donation", "tip", "creator"],
    description: "The Ko-fi mark: a coffee cup with the heart inside in the secondary tone.",
    reference: "simple-icons:kofi (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Ko-fi and the Ko-fi logo are trademarks of Ko-fi Labs Limited, used here only to refer to Ko-fi.",
  },
  "last-fm": {
    category: "brands",
    labels: ["music", "scrobble", "radio"],
    description: "The Last.fm mark: the joined letters a and s.",
    reference: "simple-icons:lastdotfm (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Last.fm and the Last.fm logo are trademarks of Last.fm Ltd., used here only to refer to Last.fm.",
  },
  leetcode: {
    category: "brands",
    labels: ["coding", "interview", "practice"],
    description: "The LeetCode mark: the curled open bracket with the bar in its mouth.",
    reference: "simple-icons:leetcode (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "LeetCode and the LeetCode logo are trademarks of LeetCode LLC, used here only to refer to LeetCode.",
  },
  "linkedin-01": {
    category: "brands",
    labels: ["professional", "network", "social"],
    description: "The LinkedIn mark: the letters in cut out of a rounded square.",
    reference: "simple-icons:linkedin (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "LinkedIn and the LinkedIn logo are trademarks of LinkedIn Corporation, used here only to refer to LinkedIn.",
  },
  "linkedin-02": {
    category: "brands",
    labels: ["professional", "network", "letters"],
    description: "The LinkedIn letters in on their own, without the square.",
    reference: "simple-icons:linkedin (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "LinkedIn and the LinkedIn logo are trademarks of LinkedIn Corporation, used here only to refer to LinkedIn.",
  },
  loom: {
    category: "brands",
    labels: ["video", "recording", "screen"],
    description: "The Loom mark: a starburst of rays round an empty centre.",
    reference: "simple-icons:loom (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Loom and the Loom logo are trademarks of Loom, Inc., used here only to refer to Loom.",
  },
  lottiefiles: {
    category: "brands",
    labels: ["animation", "motion", "lottie"],
    description: "The LottieFiles mark: the eased curve cut out of a rounded square.",
    reference: "simple-icons:lottiefiles (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "LottieFiles and the LottieFiles logo are trademarks of Design Barn Inc., used here only to refer to LottieFiles.",
  },
  "master-card": {
    category: "brands",
    labels: ["card", "payment", "credit"],
    description: "The Mastercard mark: two overlapping discs, the overlap in the secondary tone.",
    reference: "simple-icons:mastercard (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Mastercard and the Mastercard logo are trademarks of Mastercard International Incorporated, used here only to refer to Mastercard.",
  },
  mastodon: {
    category: "brands",
    labels: ["fediverse", "social", "decentralised"],
    description: "The Mastodon mark: a rounded balloon with the m cut out and its tail.",
    reference: "simple-icons:mastodon (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Mastodon and the Mastodon logo are trademarks of Mastodon gGmbH, used here only to refer to Mastodon.",
  },
  "mcp-server": {
    labels: ["server", "protocol", "clients"],
    description: "A server unit wired down to three clients, its lights in the secondary tone.",
  },
  medium: {
    category: "brands",
    labels: ["blog", "writing", "publishing"],
    description: "The Medium mark: a disc, a narrower ellipse and a thin bar.",
    reference: "simple-icons:medium (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Medium and the Medium logo are trademarks of A Medium Corporation, used here only to refer to Medium.",
  },
  "medium-signal": {
    labels: ["signal", "strength", "bars"],
    description: "Three rising bars, the two short ones full, the tallest only outlined.",
  },
  "medium-square": {
    category: "brands",
    labels: ["blog", "writing", "app"],
    description: "The Medium mark cut out of a rounded square.",
    reference: "simple-icons:medium (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Medium and the Medium logo are trademarks of A Medium Corporation, used here only to refer to Medium.",
  },
  messenger: {
    category: "brands",
    labels: ["chat", "messaging", "bolt"],
    description: "The Messenger mark: a round balloon with the zigzag bolt cut out.",
    reference: "simple-icons:messenger (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Messenger and the Messenger logo are trademarks of Meta Platforms, Inc., used here only to refer to Messenger.",
  },
  meta: {
    category: "brands",
    labels: ["infinity", "company", "social"],
    description: "The Meta mark: the looped infinity sign.",
    reference: "simple-icons:meta (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Meta and the Meta logo are trademarks of Meta Platforms, Inc., used here only to refer to Meta.",
  },
  microsoft: {
    category: "brands",
    labels: ["windows", "company", "squares"],
    description: "The Microsoft mark: four squares in a two by two grid.",
    reference: "simple-icons:microsoft (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Microsoft and the Microsoft logo are trademarks of Microsoft Corporation, used here only to refer to Microsoft.",
  },
  "microsoft-admin": {
    category: "brands",
    labels: ["admin", "shield", "management"],
    description: "A shield split in four by a cross, two quarters in the secondary tone.",
    trademark:
      "Microsoft is a trademark of Microsoft Corporation, used here only to refer to Microsoft.",
  },
  "microsoft-teams": {
    category: "brands",
    labels: ["meetings", "chat", "collaboration"],
    description: "The Teams mark: the T plaque in front of two people in the secondary tone.",
    reference:
      "simple-icons:microsoftteams (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Microsoft Teams and the Microsoft Teams logo are trademarks of Microsoft Corporation, used here only to refer to Microsoft Teams.",
  },
  "new-twitter": {
    category: "brands",
    labels: ["x", "social", "post"],
    description: "The X mark: the hollow falling stroke crossed by the thin rising one.",
    reference: "simple-icons:x (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark: "X and the X logo are trademarks of X Corp., used here only to refer to X.",
  },
  "new-twitter-ellipse": {
    category: "brands",
    labels: ["x", "social", "circle"],
    description: "The X mark inside a coin ring.",
    reference: "simple-icons:x (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark: "X and the X logo are trademarks of X Corp., used here only to refer to X.",
  },
  "new-twitter-rectangle": {
    category: "brands",
    labels: ["x", "social", "square"],
    description: "The X mark inside a rounded square.",
    reference: "simple-icons:x (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark: "X and the X logo are trademarks of X Corp., used here only to refer to X.",
  },
  nike: {
    category: "brands",
    labels: ["swoosh", "sport", "apparel"],
    description: "The Nike swoosh: a small hook sweeping up to a thin point.",
    reference: "simple-icons:nike (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark: "Nike and the Swoosh are trademarks of Nike, Inc., used here only to refer to Nike.",
  },
  nintendo: {
    category: "brands",
    labels: ["console", "handheld", "gaming"],
    description: "A handheld console: the screen between two controllers with their sticks.",
    trademark:
      "Nintendo is a trademark of Nintendo Co., Ltd., used here only to refer to Nintendo.",
  },
  "nintendo-switch": {
    category: "brands",
    labels: ["console", "gaming", "joycon"],
    description: "The Switch mark: the outlined left controller and the solid right one.",
    reference:
      "simple-icons:nintendoswitch (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Nintendo Switch and the Nintendo Switch logo are trademarks of Nintendo Co., Ltd., used here only to refer to Nintendo Switch.",
  },
  npm: {
    category: "brands",
    labels: ["package", "registry", "javascript"],
    description: "The npm mark: the letter n cut out of a square.",
    reference: "simple-icons:npm (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark: "npm and the npm logo are trademarks of npm, Inc., used here only to refer to npm.",
  },
  "open-source": {
    labels: ["licence", "community", "keyhole"],
    description: "A thick ring with a keyhole slot cut down to its bottom edge.",
  },
  "orthogonal-edge": {
    labels: ["connector", "diagram", "nodes"],
    description: "Two nodes joined by a connector with a right angle.",
  },
  "pacman-01": {
    category: "brands",
    labels: ["arcade", "game", "retro"],
    description: "Pac-Man with his mouth open and two pellets in the secondary tone.",
    trademark:
      "Pac-Man is a trademark of Bandai Namco Entertainment Inc., used here only to refer to Pac-Man.",
  },
  "pacman-02": {
    category: "brands",
    labels: ["ghost", "arcade", "game"],
    description: "A Pac-Man ghost with a wavy hem and eyes looking aside.",
    trademark:
      "Pac-Man is a trademark of Bandai Namco Entertainment Inc., used here only to refer to Pac-Man.",
  },
  paypal: {
    category: "brands",
    labels: ["payment", "wallet", "checkout"],
    description: "The PayPal mark: the front P in the secondary tone over the back P.",
    reference: "simple-icons:paypal (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "PayPal and the PayPal logo are trademarks of PayPal, Inc., used here only to refer to PayPal.",
  },
  pexels: {
    category: "brands",
    labels: ["photos", "stock", "images"],
    description: "The Pexels mark: the letter P cut out of a rounded square.",
    reference: "simple-icons:pexels (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Pexels and the Pexels logo are trademarks of Pexels GmbH, used here only to refer to Pexels.",
  },
  php: {
    category: "brands",
    labels: ["language", "server", "code"],
    description: "The PHP logo: the letters php cut out of a flat oval.",
    reference: "simple-icons:php (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "PHP and the PHP logo are trademarks of The PHP Group, used here only to refer to PHP.",
  },
  picasa: {
    category: "brands",
    labels: ["photos", "gallery", "aperture"],
    description: "The Picasa mark: a disc with a pentagon at its centre and five turning blades.",
    reference: "logos:picasa (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Picasa and the Picasa logo are trademarks of Google LLC, used here only to refer to Picasa.",
  },
  "adobe-after-effect": {
    category: "brands",
    labels: ["motion", "video", "adobe"],
    description: "The Adobe After Effects mark: \u201cAe\u201d cut out of a rounded square.",
    reference:
      "simple-icons:adobeaftereffects (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Adobe After Effects and the Adobe After Effects logo are trademarks of Adobe Inc., used here only to refer to Adobe After Effects.",
  },
  "adobe-illustrator": {
    category: "brands",
    labels: ["vector", "design", "adobe"],
    description: "The Adobe Illustrator mark: \u201cAi\u201d cut out of a rounded square.",
    reference:
      "simple-icons:adobeillustrator (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Adobe Illustrator and the Adobe Illustrator logo are trademarks of Adobe Inc., used here only to refer to Adobe Illustrator.",
  },
  "adobe-indesign": {
    category: "brands",
    labels: ["layout", "publishing", "adobe"],
    description: "The Adobe InDesign mark: \u201cId\u201d cut out of a rounded square.",
    reference:
      "simple-icons:adobeindesign (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Adobe InDesign and the Adobe InDesign logo are trademarks of Adobe Inc., used here only to refer to Adobe InDesign.",
  },
  "adobe-photoshop": {
    category: "brands",
    labels: ["photo", "editing", "adobe"],
    description: "The Adobe Photoshop mark: \u201cPs\u201d cut out of a rounded square.",
    reference:
      "simple-icons:adobephotoshop (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Adobe Photoshop and the Adobe Photoshop logo are trademarks of Adobe Inc., used here only to refer to Adobe Photoshop.",
  },
  "adobe-premier": {
    category: "brands",
    labels: ["video", "editing", "adobe"],
    description: "The Adobe Premiere Pro mark: \u201cPr\u201d cut out of a rounded square.",
    reference:
      "simple-icons:adobepremierepro (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Adobe Premiere Pro and the Adobe Premiere Pro logo are trademarks of Adobe Inc., used here only to refer to Adobe Premiere Pro.",
  },
  "adobe-xd": {
    category: "brands",
    labels: ["prototype", "design", "adobe"],
    description: "The Adobe XD mark: \u201cXd\u201d cut out of a rounded square.",
    reference: "simple-icons:adobexd (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Adobe XD and the Adobe XD logo are trademarks of Adobe Inc., used here only to refer to Adobe XD.",
  },
  airbnb: {
    category: "brands",
    labels: ["travel", "rental", "stay"],
    description: "The Airbnb B\u00e9lo: an outlined drop with an inner loop and two lobes.",
    reference: "simple-icons:airbnb (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Airbnb and the Airbnb logo are trademarks of Airbnb, Inc., used here only to refer to Airbnb.",
  },
  airdrop: {
    labels: ["share", "wireless", "nearby"],
    description: "Wireless sharing: concentric arcs over a small triangle.",
  },
  amazon: {
    category: "brands",
    labels: ["shopping", "store", "retail"],
    description: "The Amazon mark: a lowercase \u201ca\u201d over the arrow smile.",
    reference: "simple-icons:amazon (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Amazon and the Amazon logo are trademarks of Amazon.com, Inc., used here only to refer to Amazon.",
  },
  android: {
    category: "brands",
    labels: ["mobile", "robot", "os"],
    description: "The Android robot head with its antennae and eyes.",
    reference: "simple-icons:android (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Android and the Android robot logo are trademarks of Google LLC, used here only to refer to Android.",
  },
  "app-store": {
    category: "brands",
    labels: ["apps", "download", "apple"],
    description: "The App Store mark: an \u201cA\u201d built of crossed sticks over a bar.",
    reference: "simple-icons:appstore (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "App Store and the App Store logo are trademarks of Apple Inc., used here only to refer to App Store.",
  },
  apple: {
    category: "brands",
    labels: ["mac", "iphone", "logo"],
    description: "The Apple logo: the bitten apple with its leaf.",
    reference: "simple-icons:apple (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Apple and the Apple logo are trademarks of Apple Inc., used here only to refer to Apple.",
  },
  "apple-01": {
    labels: ["fruit", "food", "apple"],
    description: "An apple fruit in outline, with its stem and a leaf.",
  },
  "apple-finder": {
    category: "brands",
    labels: ["files", "mac", "face"],
    description: "The Finder face: a two-tone split square with eyes and a smile.",
    trademark:
      "Finder and the Finder logo are trademarks of Apple Inc., used here only to refer to Finder.",
  },
  "apple-music": {
    category: "brands",
    labels: ["music", "streaming", "note"],
    description: "The Apple Music mark: a pair of beamed notes cut out of a rounded square.",
    reference: "simple-icons:applemusic (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Apple Music and the Apple Music logo are trademarks of Apple Inc., used here only to refer to Apple Music.",
  },
  "apple-news": {
    category: "brands",
    labels: ["news", "reading", "apple"],
    description: "The Apple News mark: a rounded square crossed by diagonal bands.",
    reference: "simple-icons:applenews (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Apple News and the Apple News logo are trademarks of Apple Inc., used here only to refer to Apple News.",
  },
  "apple-pie": {
    labels: ["pie", "dessert", "baking"],
    description: "An apple pie: a lattice crust domed over a deep tin.",
  },
  "apple-reminder": {
    labels: ["reminders", "list", "todo"],
    description: "A reminders list: three dots and lines in a rounded square.",
  },
  "apple-stocks": {
    labels: ["stocks", "chart", "market"],
    description: "A stocks app: a zigzag price line in a rounded square.",
  },
  "apple-vision-pro": {
    labels: ["headset", "spatial", "goggles"],
    description: "A spatial headset seen from the front, with its nose notch.",
  },
  "aws-lambda": {
    category: "brands",
    labels: ["serverless", "function", "aws"],
    description: "The AWS Lambda mark: a bold lowercase lambda.",
    reference: "simple-icons:awslambda (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "AWS Lambda and the AWS Lambda logo are trademarks of Amazon.com, Inc., used here only to refer to AWS Lambda.",
  },
  bebo: {
    category: "brands",
    labels: ["social", "network", "letter"],
    description: "The Bebo mark: a rounded lowercase \u201cb\u201d.",
    trademark:
      "Bebo and the Bebo logo are trademarks of Bebo, Inc., used here only to refer to Bebo.",
  },
  "behance-01": {
    category: "brands",
    labels: ["portfolio", "design", "adobe"],
    description: "The Behance mark: the letters \u201cB\u0113\u201d.",
    reference: "simple-icons:behance (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Behance and the Behance logo are trademarks of Adobe Inc., used here only to refer to Behance.",
  },
  "behance-02": {
    category: "brands",
    labels: ["portfolio", "design", "adobe"],
    description: "The Behance mark: \u201cB\u0113\u201d cut out of a rounded square.",
    reference: "simple-icons:behance (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Behance and the Behance logo are trademarks of Adobe Inc., used here only to refer to Behance.",
  },
  bing: {
    category: "brands",
    labels: ["search", "microsoft", "engine"],
    description: "The Microsoft Bing mark: a tall stem folding into a pointed bowl.",
    reference:
      "simple-icons:microsoftbing (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Microsoft Bing and the Microsoft Bing logo are trademarks of Microsoft Corporation, used here only to refer to Microsoft Bing.",
  },
  blogger: {
    category: "brands",
    labels: ["blog", "writing", "google"],
    description:
      "The Blogger mark: a rounded square with a \u201cB\u201d cut out, its two bars kept solid.",
    reference: "simple-icons:blogger (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Blogger and the Blogger logo are trademarks of Google LLC, used here only to refer to Blogger.",
  },
  bluesky: {
    category: "brands",
    labels: ["social", "butterfly", "network"],
    description: "The Bluesky butterfly: two large upper wings and two smaller lower ones.",
    reference: "simple-icons:bluesky (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Bluesky and the Bluesky butterfly logo are trademarks of Bluesky Social, PBC, used here only to refer to Bluesky.",
  },
  bootstrap: {
    category: "brands",
    labels: ["css", "framework", "frontend"],
    description: "The Bootstrap mark: a \u201cB\u201d cut out of a rounded square.",
    reference: "simple-icons:bootstrap (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Bootstrap and the Bootstrap logo are trademarks of the Bootstrap project, used here only to refer to Bootstrap.",
  },
  brandfetch: {
    category: "brands",
    labels: ["brand", "assets", "logos"],
    description:
      "The Brandfetch mark: a slanted \u201cB\u201d whose top stroke curls out to the left.",
    reference: "simple-icons:brandfetch (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Brandfetch and the Brandfetch logo are trademarks of Brandfetch GmbH, used here only to refer to Brandfetch.",
  },
  capcut: {
    category: "brands",
    labels: ["video", "editing", "bytedance"],
    description: "The CapCut mark: two bars joined by a crossing whose ends poke out on the right.",
    reference: "thesvg:capcut (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "CapCut and the CapCut logo are trademarks of ByteDance Ltd., used here only to refer to CapCut.",
  },
  "capcut-rectangle": {
    category: "brands",
    labels: ["video", "editing", "bytedance"],
    description: "The CapCut mark cut out of a rounded square.",
    reference: "thesvg:capcut (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "CapCut and the CapCut logo are trademarks of ByteDance Ltd., used here only to refer to CapCut.",
  },
  castbox: {
    category: "brands",
    labels: ["podcast", "audio", "player"],
    description: "The Castbox mark: a sound wave cut out of an upright hexagon.",
    reference: "simple-icons:castbox (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Castbox and the Castbox logo are trademarks of Guru Network Limited, used here only to refer to Castbox.",
  },
  chrome: {
    category: "brands",
    labels: ["browser", "google", "web"],
    description: "The Google Chrome mark: a disc split three ways around a central dot.",
    reference: "simple-icons:googlechrome (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Google Chrome and the Chrome logo are trademarks of Google LLC, used here only to refer to Google Chrome.",
  },
  claude: {
    category: "brands",
    labels: ["ai", "assistant", "anthropic"],
    description: "The Claude mark: an uneven starburst of rays around a solid core.",
    reference: "simple-icons:claude (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Claude and the Claude logo are trademarks of Anthropic, PBC, used here only to refer to Claude.",
  },
  codepen: {
    category: "brands",
    labels: ["code", "playground", "frontend"],
    description: "The CodePen mark: the outline of a cube cut out of a disc.",
    reference: "simple-icons:codepen (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "CodePen and the CodePen logo are trademarks of CodePen, Inc., used here only to refer to CodePen.",
  },
  codesandbox: {
    category: "brands",
    labels: ["code", "sandbox", "ide"],
    description: "The CodeSandbox mark: a heavy square frame.",
    reference: "simple-icons:codesandbox (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "CodeSandbox and the CodeSandbox logo are trademarks of CodeSandbox BV, used here only to refer to CodeSandbox.",
  },
  copilot: {
    category: "brands",
    labels: ["ai", "coding", "github"],
    description: "The GitHub Copilot mark: a round head with goggles and two eyes.",
    reference:
      "simple-icons:githubcopilot (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "GitHub Copilot and the GitHub Copilot logo are trademarks of GitHub, Inc., used here only to refer to GitHub Copilot.",
  },
  "creative-commons": {
    category: "brands",
    labels: ["licence", "cc", "copyright"],
    description: "The Creative Commons mark: two letters c inside a round ring.",
    reference:
      "simple-icons:creativecommons (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Creative Commons and the Creative Commons logo are trademarks of Creative Commons Corporation, used here only to refer to Creative Commons.",
  },
  "creative-market": {
    category: "brands",
    labels: ["marketplace", "tag", "design"],
    description: "A diagonal price tag with a ring hole and a star on its face.",
    trademark:
      "Creative Market and the Creative Market logo are trademarks of Creative Market Labs, Inc., used here only to refer to Creative Market.",
  },
  "css-3": {
    labels: ["stylesheet", "web", "shield"],
    description: "The CSS3 mark: a shield with the figure 3 cut out of it.",
    reference: "simple-icons:css3 (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
  },
  deepseek: {
    category: "brands",
    labels: ["ai", "whale", "chatbot"],
    description:
      "The DeepSeek whale seen side on, back and raised tail filled, belly an open curve.",
    reference: "simple-icons:deepseek (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "DeepSeek and the DeepSeek logo are trademarks of Hangzhou DeepSeek Artificial Intelligence Co., Ltd., used here only to refer to DeepSeek.",
  },
  deviantart: {
    category: "brands",
    labels: ["art", "community", "gallery"],
    description: "The DeviantArt mark: a slanted Z with a short stem at each end.",
    reference: "simple-icons:deviantart (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "DeviantArt and the DeviantArt logo are trademarks of DeviantArt, Inc., used here only to refer to DeviantArt.",
  },
  discord: {
    category: "brands",
    labels: ["chat", "community", "voice"],
    description: "The Discord mark: Clyde's rounded head with two eyes.",
    reference: "simple-icons:discord (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Discord and the Discord logo are trademarks of Discord Inc., used here only to refer to Discord.",
  },
  dribbble: {
    category: "brands",
    labels: ["design", "portfolio", "ball"],
    description: "The Dribbble mark: a basketball ring crossed by three curved seams.",
    reference: "simple-icons:dribbble (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Dribbble and the Dribbble logo are trademarks of Dribbble Holdings Ltd., used here only to refer to Dribbble.",
  },
  envato: {
    category: "brands",
    labels: ["marketplace", "assets", "creative"],
    description: "The Envato mark: a scribble zigzagging down to a dot.",
    reference: "simple-icons:envato (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Envato and the Envato logo are trademarks of Envato Pty Ltd, used here only to refer to Envato.",
  },
  "facebook-01": {
    category: "brands",
    labels: ["social", "network", "meta"],
    description: "The Facebook f cut out of a rounded square, running off its bottom edge.",
    reference: "simple-icons:facebook (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Facebook and the Facebook logo are trademarks of Meta Platforms, Inc., used here only to refer to Facebook.",
  },
  "facebook-02": {
    category: "brands",
    labels: ["social", "network", "meta"],
    description: "The Facebook f on its own: a bold stem, a hooked top and a crossbar.",
    reference: "simple-icons:facebook (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Facebook and the Facebook logo are trademarks of Meta Platforms, Inc., used here only to refer to Facebook.",
  },
  figma: {
    category: "brands",
    labels: ["design", "prototype", "interface"],
    description: "The Figma mark: four rounded pieces and a circle in alternating tones.",
    reference: "simple-icons:figma (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Figma and the Figma logo are trademarks of Figma, Inc., used here only to refer to Figma.",
  },
  fiverr: {
    category: "brands",
    labels: ["freelance", "marketplace", "gigs"],
    description: "The Fiverr mark: the letters fi cut out of a round disc.",
    trademark:
      "Fiverr and the Fiverr logo are trademarks of Fiverr International Ltd., used here only to refer to Fiverr.",
  },
  flaticon: {
    category: "brands",
    labels: ["icons", "vector", "library"],
    description: "The Flaticon mark: a letter F folded into a downward triangle.",
    trademark:
      "Flaticon and the Flaticon logo are trademarks of Freepik Company S.L., used here only to refer to Flaticon.",
  },
  flickr: {
    category: "brands",
    labels: ["photos", "sharing", "dots"],
    description: "The Flickr mark: two dots side by side, the second in the secondary tone.",
    reference: "simple-icons:flickr (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Flickr and the Flickr logo are trademarks of Flickr, Inc., used here only to refer to Flickr.",
  },
  forrst: {
    category: "brands",
    labels: ["tree", "community", "developers"],
    description: "The Forrst mark: a small branching tree inside a triangle.",
    trademark:
      "Forrst and the Forrst logo are trademarks of their owner, used here only to refer to Forrst.",
  },
  foursquare: {
    category: "brands",
    labels: ["places", "check-in", "location"],
    description: "The 2014 Foursquare mark: a letter F cut out of a shield that slants to a point.",
    trademark:
      "Foursquare and the Foursquare logo are trademarks of Foursquare Labs, Inc., used here only to refer to Foursquare.",
  },
  framer: {
    category: "brands",
    labels: ["design", "website", "builder"],
    description: "The Framer mark: a top triangle, a slanted middle square and a bottom triangle.",
    reference: "simple-icons:framer (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Framer and the Framer logo are trademarks of Framer B.V., used here only to refer to Framer.",
  },
  gitlab: {
    category: "brands",
    labels: ["git", "devops", "tanuki"],
    description: "The GitLab mark: the tanuki head with two pointed ears.",
    reference: "simple-icons:gitlab (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "GitLab and the GitLab logo are trademarks of GitLab Inc., used here only to refer to GitLab.",
  },
  google: {
    category: "brands",
    labels: ["search", "account", "g"],
    description: "The Google mark: a thick letter G with its bar running in from the right.",
    reference: "simple-icons:google (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Google and the Google logo are trademarks of Google LLC, used here only to refer to Google.",
  },
  "google-doc": {
    category: "brands",
    labels: ["docs", "document", "text"],
    description: "The Google Docs mark: a page with a cut corner and lines of text cut out of it.",
    reference: "simple-icons:googledocs (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Google Docs and the Google Docs logo are trademarks of Google LLC, used here only to refer to Google Docs.",
  },
  "google-drive": {
    category: "brands",
    labels: ["storage", "files", "triangle"],
    description: "The Google Drive mark: a triangle of three bands split by thin gaps.",
    reference: "simple-icons:googledrive (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Google Drive and the Google Drive logo are trademarks of Google LLC, used here only to refer to Google Drive.",
  },
  "google-gemini": {
    category: "brands",
    labels: ["ai", "assistant", "sparkle"],
    description: "The Gemini mark: a four-pointed sparkle with pinched sides.",
    reference: "simple-icons:googlegemini (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Gemini and the Gemini logo are trademarks of Google LLC, used here only to refer to Gemini.",
  },
  "google-home": {
    category: "brands",
    labels: ["smart", "home", "house"],
    description: "The Google Home mark: a thick house outline with a pointed roof.",
    reference: "simple-icons:googlehome (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Google Home and the Google Home logo are trademarks of Google LLC, used here only to refer to Google Home.",
  },
  "google-maps": {
    category: "brands",
    labels: ["map", "pin", "navigation"],
    description: "The Google Maps mark: a pin with a round hole and a diagonal road cut.",
    reference: "simple-icons:googlemaps (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Google Maps and the Google Maps logo are trademarks of Google LLC, used here only to refer to Google Maps.",
  },
  "google-photos": {
    category: "brands",
    labels: ["photos", "gallery", "pinwheel"],
    description:
      "The Google Photos mark: a pinwheel of four half-round blades in alternating tones.",
    reference: "simple-icons:googlephotos (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Google Photos and the Google Photos logo are trademarks of Google LLC, used here only to refer to Google Photos.",
  },
  "google-sheet": {
    category: "brands",
    labels: ["sheets", "spreadsheet", "table"],
    description: "The Google Sheets mark: a page with a cut corner and four table cells cut out.",
    reference: "simple-icons:googlesheets (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Google Sheets and the Google Sheets logo are trademarks of Google LLC, used here only to refer to Google Sheets.",
  },
  grok: {
    category: "brands",
    labels: ["ai", "chatbot", "xai"],
    description: "The Grok mark: a ring broken by a long slash from lower left to upper right.",
    reference: "logos:grok-icon (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark: "Grok and the Grok logo are trademarks of xAI, used here only to refer to Grok.",
  },
  "grok-02": {
    category: "brands",
    labels: ["ai", "xai", "chatbot"],
    description:
      "The xAI mark used by Grok: a long diagonal, a short slash and a tall bar on the right.",
    trademark: "Grok, xAI and the xAI logo are trademarks of xAI, used here only to refer to Grok.",
  },
  groww: {
    category: "brands",
    labels: ["investing", "finance", "growth"],
    description:
      "The Groww mark: a disc split by a rising line, the lower part in the secondary tone.",
    trademark:
      "Groww and the Groww logo are trademarks of Billionbrains Garage Ventures Pvt. Ltd., used here only to refer to Groww.",
  },
  hackerrank: {
    category: "brands",
    labels: ["coding", "challenges", "hiring"],
    description: "The HackerRank mark: a pointed hexagon with the letter H cut out.",
    trademark:
      "HackerRank and the HackerRank logo are trademarks of HackerRank, used here only to refer to HackerRank.",
  },
  hangout: {
    category: "brands",
    labels: ["chat", "video", "quotes"],
    description: "The Google Hangouts mark: a speech bubble with two quotation marks cut out.",
    reference:
      "simple-icons:googlehangouts (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Google Hangouts and the Hangouts logo are trademarks of Google LLC, used here only to refer to Google Hangouts.",
  },
  "html-5": {
    labels: ["markup", "web", "shield"],
    description: "The HTML5 mark: a shield with the figure 5 cut out of it.",
    reference: "simple-icons:html5 (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
  },
  imo: {
    category: "brands",
    labels: ["messenger", "chat", "calls"],
    description: "The imo mark: a speech bubble with the word imo inside.",
    trademark:
      "imo and the imo logo are trademarks of PageBites, Inc., used here only to refer to imo.",
  },
  instagram: {
    category: "brands",
    labels: ["photos", "social", "camera"],
    description: "The Instagram mark: a rounded square with a round lens and a corner dot.",
    reference: "simple-icons:instagram (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Instagram and the Instagram logo are trademarks of Meta Platforms, Inc., used here only to refer to Instagram.",
  },
  java: {
    category: "brands",
    labels: ["programming", "language", "coffee"],
    description: "The Java mark: a cup on a saucer with two wisps of steam in the secondary tone.",
    reference: "logos:java (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Java and the Java logo are trademarks of Oracle and/or its affiliates, used here only to refer to Java.",
  },
  pinterest: {
    category: "brands",
    labels: ["pin", "board", "social"],
    description: "The Pinterest mark: the P cut out of a round disc.",
    reference: "simple-icons:pinterest (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Pinterest and the Pinterest logo are trademarks of Pinterest, Inc., used here only to refer to Pinterest.",
  },
  pocket: {
    category: "brands",
    labels: ["read-later", "save", "bookmark"],
    description: "The Pocket mark: the rounded pocket with its chevron cut out.",
    reference: "simple-icons:pocket (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Pocket and the Pocket logo are trademarks of Mozilla Corporation, used here only to refer to Pocket.",
  },
  python: {
    category: "brands",
    labels: ["language", "snake", "programming"],
    description: "The Python mark: two interlocking snakes, the second in the secondary tone.",
    reference: "simple-icons:python (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Python and the Python logo are trademarks of the Python Software Foundation, used here only to refer to Python.",
  },
  quora: {
    category: "brands",
    labels: ["questions", "answers", "community"],
    description: "The Quora mark: the round Q with its tail at the lower right.",
    reference: "simple-icons:quora (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Quora and the Quora logo are trademarks of Quora, Inc., used here only to refer to Quora.",
  },
  "rail-symbol": {
    labels: ["train", "railway", "station"],
    description: "The rail symbol: two parallel tracks crossed by a three-stroke zigzag.",
  },
  react: {
    category: "brands",
    labels: ["atom", "framework", "javascript"],
    description: "The React mark: three orbits crossing around the nucleus.",
    reference: "simple-icons:react (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "React and the React logo are trademarks of Meta Platforms, Inc., used here only to refer to React.",
  },
  reddit: {
    category: "brands",
    labels: ["forum", "community", "snoo"],
    description: "The Reddit mark: the Snoo's head cut out of the round speech bubble.",
    reference: "simple-icons:reddit (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Reddit and the Reddit logo are trademarks of Reddit, Inc., used here only to refer to Reddit.",
  },
  replit: {
    category: "brands",
    labels: ["ide", "code", "cloud"],
    description: "The Replit mark: three blocks stepping right and back.",
    reference: "simple-icons:replit (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Replit and the Replit logo are trademarks of Replit, Inc., used here only to refer to Replit.",
  },
  roblox: {
    category: "brands",
    labels: ["game", "platform", "metaverse"],
    description: "The Roblox mark: the tilted square with its small square hole.",
    reference: "simple-icons:roblox (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Roblox and the Roblox logo are trademarks of Roblox Corporation, used here only to refer to Roblox.",
  },
  safari: {
    category: "brands",
    labels: ["browser", "compass", "web"],
    description:
      "The Safari mark: the compass ring and its diagonal needle, the north half in the secondary tone.",
    reference: "simple-icons:safari (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Safari and the Safari logo are trademarks of Apple Inc., used here only to refer to Safari.",
  },
  shadcn: {
    category: "brands",
    labels: ["components", "ui", "library"],
    description: "The shadcn/ui mark: a long and a short parallel slash.",
    reference: "simple-icons:shadcnui (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "shadcn/ui and the shadcn/ui logo are trademarks of shadcn, used here only to refer to shadcn/ui.",
  },
  "shadcn-square": {
    category: "brands",
    labels: ["components", "ui", "library"],
    description: "The shadcn/ui slashes cut out of a filled rounded square.",
    reference: "simple-icons:shadcnui (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "shadcn/ui and the shadcn/ui logo are trademarks of shadcn, used here only to refer to shadcn/ui.",
  },
  shopify: {
    category: "brands",
    labels: ["store", "ecommerce", "bag"],
    description:
      "The Shopify mark: the shopping bag with its handle and S, its side in the secondary tone.",
    reference: "simple-icons:shopify (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Shopify and the Shopify logo are trademarks of Shopify Inc., used here only to refer to Shopify.",
  },
  shutterstock: {
    category: "brands",
    labels: ["stock", "photos", "images"],
    description: "The Shutterstock mark: two thick corners facing each other.",
    reference: "simple-icons:shutterstock (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Shutterstock and the Shutterstock logo are trademarks of Shutterstock, Inc., used here only to refer to Shutterstock.",
  },
  sketch: {
    category: "brands",
    labels: ["design", "gem", "app"],
    description: "The Sketch mark: the cut gem with its facets.",
    reference: "simple-icons:sketch (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Sketch and the Sketch logo are trademarks of Sketch B.V., used here only to refer to Sketch.",
  },
  skype: {
    category: "brands",
    labels: ["call", "video", "chat"],
    description: "The Skype mark: the S cut out of the round shape with two bumps.",
    reference: "simple-icons:skype (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Skype and the Skype logo are trademarks of Microsoft Corporation, used here only to refer to Skype.",
  },
  slack: {
    category: "brands",
    labels: ["chat", "team", "workspace"],
    description: "The Slack mark: four bars and four dots turning around the centre.",
    reference: "simple-icons:slack (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Slack and the Slack logo are trademarks of Slack Technologies, LLC, used here only to refer to Slack.",
  },
  snapchat: {
    category: "brands",
    labels: ["ghost", "social", "messaging"],
    description: "The Snapchat mark: the ghost with its arms and ragged hem.",
    reference: "simple-icons:snapchat (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Snapchat and the Snapchat logo are trademarks of Snap Inc., used here only to refer to Snapchat.",
  },
  soundcloud: {
    category: "brands",
    labels: ["audio", "music", "streaming"],
    description: "The SoundCloud mark: the cloud with rising sound bars on its left.",
    reference: "simple-icons:soundcloud (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "SoundCloud and the SoundCloud logo are trademarks of SoundCloud Global Limited & Co. KG, used here only to refer to SoundCloud.",
  },
  spotify: {
    category: "brands",
    labels: ["music", "streaming", "audio"],
    description: "The Spotify mark: three arcs cut out of the round disc.",
    reference: "simple-icons:spotify (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Spotify and the Spotify logo are trademarks of Spotify AB, used here only to refer to Spotify.",
  },
  "straight-edge": {
    labels: ["connector", "diagram", "link"],
    description: "Two nodes joined by one straight diagonal edge.",
  },
  stripe: {
    category: "brands",
    labels: ["payments", "billing", "checkout"],
    description: "The Stripe mark: the bold S.",
    reference: "simple-icons:stripe (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Stripe and the Stripe logo are trademarks of Stripe, Inc., used here only to refer to Stripe.",
  },
  tailwindcss: {
    category: "brands",
    labels: ["css", "framework", "styling"],
    description: "The Tailwind CSS mark: two offset waves.",
    reference: "simple-icons:tailwindcss (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Tailwind CSS and the Tailwind CSS logo are trademarks of Tailwind Labs Inc., used here only to refer to Tailwind CSS.",
  },
  teamviewer: {
    category: "brands",
    labels: ["remote", "desktop", "support"],
    description: "The TeamViewer mark: the double arrow in the round window of a rounded square.",
    reference: "simple-icons:teamviewer (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "TeamViewer and the TeamViewer logo are trademarks of TeamViewer SE, used here only to refer to TeamViewer.",
  },
  telegram: {
    category: "brands",
    labels: ["messaging", "chat", "plane"],
    description: "The Telegram mark: the paper plane cut out of the round disc.",
    reference: "simple-icons:telegram (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Telegram and the Telegram logo are trademarks of Telegram FZ-LLC, used here only to refer to Telegram.",
  },
  threads: {
    category: "brands",
    labels: ["social", "meta", "posts"],
    description: "The Threads mark: the looped at sign curling into its inner bowl.",
    reference: "simple-icons:threads (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Threads and the Threads logo are trademarks of Meta Platforms, Inc., used here only to refer to Threads.",
  },
  "threads-ellipse": {
    category: "brands",
    labels: ["social", "meta", "coin"],
    description: "The Threads mark cut out of a filled disc.",
    reference: "simple-icons:threads (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Threads and the Threads logo are trademarks of Meta Platforms, Inc., used here only to refer to Threads.",
  },
  "threads-rectangle": {
    category: "brands",
    labels: ["social", "meta", "square"],
    description: "The Threads mark cut out of a filled rounded square.",
    reference: "simple-icons:threads (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Threads and the Threads logo are trademarks of Meta Platforms, Inc., used here only to refer to Threads.",
  },
  tiktok: {
    category: "brands",
    labels: ["video", "music", "social"],
    description: "The TikTok mark: the musical note with its curling flag.",
    reference: "simple-icons:tiktok (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "TikTok and the TikTok logo are trademarks of ByteDance Ltd., used here only to refer to TikTok.",
  },
  tinder: {
    category: "brands",
    labels: ["dating", "flame", "match"],
    description: "The Tinder mark: the flame with a small lick on its left.",
    reference: "simple-icons:tinder (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Tinder and the Tinder logo are trademarks of Match Group, LLC, used here only to refer to Tinder.",
  },
  "tinder-square": {
    category: "brands",
    labels: ["dating", "flame", "app"],
    description: "The Tinder flame in a rounded square, the flame in the secondary tone.",
    reference: "simple-icons:tinder (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Tinder and the Tinder logo are trademarks of Match Group, LLC, used here only to refer to Tinder.",
  },
  trello: {
    category: "brands",
    labels: ["board", "kanban", "lists"],
    description: "The Trello mark: a rounded board with a tall and a short list cut out of it.",
    reference: "simple-icons:trello (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Trello and the Trello logo are trademarks of Atlassian Pty Ltd, used here only to refer to Trello.",
  },
  tumblr: {
    category: "brands",
    labels: ["blog", "social", "letter"],
    description: "The Tumblr mark: a solid lowercase t with a tail that turns up.",
    reference: "simple-icons:tumblr (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Tumblr and the Tumblr logo are trademarks of Tumblr, Inc., used here only to refer to Tumblr.",
  },
  twitch: {
    category: "brands",
    labels: ["streaming", "live", "gaming"],
    description: "The Twitch mark: a speech bubble with a cut corner, two eyes and a tail.",
    reference: "simple-icons:twitch (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Twitch and the Twitch logo are trademarks of Twitch Interactive, Inc., used here only to refer to Twitch.",
  },
  twitter: {
    category: "brands",
    labels: ["bird", "social", "tweet"],
    description: "The Twitter bird, solid, its beak raised.",
    reference: "simple-icons:twitter (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Twitter and the Twitter logo are trademarks of X Corp., used here only to refer to Twitter.",
  },
  "twitter-square": {
    category: "brands",
    labels: ["bird", "social", "tweet"],
    description: "The Twitter bird in a rounded square, the bird in the secondary tone.",
    reference: "simple-icons:twitter (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Twitter and the Twitter logo are trademarks of X Corp., used here only to refer to Twitter.",
  },
  "typescript-01": {
    category: "brands",
    labels: ["language", "code", "javascript"],
    description: "The TypeScript mark: a solid square with the letters TS cut out of it.",
    reference: "simple-icons:typescript (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "TypeScript and the TypeScript logo are trademarks of Microsoft Corporation, used here only to refer to TypeScript.",
  },
  "typescript-02": {
    category: "brands",
    labels: ["file", "code", "language"],
    description: "A document with a cut corner and the letters TS inside, in the secondary tone.",
    reference: "simple-icons:typescript (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "TypeScript and the TypeScript logo are trademarks of Microsoft Corporation, used here only to refer to TypeScript.",
  },
  "typescript-03": {
    category: "brands",
    labels: ["file", "code", "language"],
    description: "A document with a folded corner, its lower right taken by the letters TS.",
    reference: "simple-icons:typescript (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "TypeScript and the TypeScript logo are trademarks of Microsoft Corporation, used here only to refer to TypeScript.",
  },
  unsplash: {
    category: "brands",
    labels: ["photos", "images", "stock"],
    description: "The Unsplash mark: a small block above a wide block with a matching notch.",
    reference: "simple-icons:unsplash (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Unsplash and the Unsplash logo are trademarks of Unsplash Inc., used here only to refer to Unsplash.",
  },
  upwork: {
    category: "brands",
    labels: ["freelance", "jobs", "work"],
    description: "The Upwork mark: the letters u and p joined, the p running below the line.",
    reference: "simple-icons:upwork (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Upwork and the Upwork logo are trademarks of Upwork Inc., used here only to refer to Upwork.",
  },
  viber: {
    category: "brands",
    labels: ["messaging", "call", "chat"],
    description: "The Viber mark: a rounded speech bubble with a phone handset inside.",
    reference: "simple-icons:viber (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Viber and the Viber logo are trademarks of Viber Media S.\u00e0 r.l., used here only to refer to Viber.",
  },
  vimeo: {
    category: "brands",
    labels: ["video", "hosting", "streaming"],
    description: "The Vimeo mark: a solid v with a hooked left arm.",
    reference: "simple-icons:vimeo (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Vimeo and the Vimeo logo are trademarks of Vimeo.com, Inc., used here only to refer to Vimeo.",
  },
  vine: {
    category: "brands",
    labels: ["video", "loop", "social"],
    description: "The Vine mark: a v whose right arm rises and curls into a loop.",
    trademark: "Vine and the Vine logo are trademarks of X Corp., used here only to refer to Vine.",
  },
  "vine-square": {
    category: "brands",
    labels: ["video", "loop", "social"],
    description: "The Vine mark in a rounded square, in the secondary tone.",
    trademark: "Vine and the Vine logo are trademarks of X Corp., used here only to refer to Vine.",
  },
  "visual-studio-code": {
    category: "brands",
    labels: ["editor", "code", "ide"],
    description: "The Visual Studio Code mark: a tall bar with two crossed arms reaching left.",
    reference:
      "simple-icons:visualstudiocode (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Visual Studio Code and the Visual Studio Code logo are trademarks of Microsoft Corporation, used here only to refer to Visual Studio Code.",
  },
  vk: {
    category: "brands",
    labels: ["social", "network", "letters"],
    description: "The VK mark: the letters V and K side by side.",
    reference: "simple-icons:vk (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "VK and the VK logo are trademarks of VK Company Limited, used here only to refer to VK.",
  },
  "vk-square": {
    category: "brands",
    labels: ["social", "network", "letters"],
    description: "The letters VK in a rounded square, in the secondary tone.",
    reference: "simple-icons:vk (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "VK and the VK logo are trademarks of VK Company Limited, used here only to refer to VK.",
  },
  "w-3-schools": {
    category: "brands",
    labels: ["tutorials", "web", "learning"],
    description: "The W3Schools mark: a letter W with a small raised 3.",
    reference: "simple-icons:w3schools (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "W3Schools and the W3Schools logo are trademarks of Refsnes Data AS, used here only to refer to W3Schools.",
  },
  wattpad: {
    category: "brands",
    labels: ["stories", "reading", "writing"],
    description: "The Wattpad mark: a bold W whose middle stroke splits into an arch.",
    reference: "simple-icons:wattpad (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Wattpad and the Wattpad logo are trademarks of Wattpad Corp., used here only to refer to Wattpad.",
  },
  "wattpad-square": {
    category: "brands",
    labels: ["stories", "reading", "writing"],
    description: "The Wattpad W in a rounded square, in the secondary tone.",
    reference: "simple-icons:wattpad (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Wattpad and the Wattpad logo are trademarks of Wattpad Corp., used here only to refer to Wattpad.",
  },
  waze: {
    category: "brands",
    labels: ["navigation", "maps", "traffic"],
    description: "The Waze mark: a round smiling face riding on two wheels.",
    reference: "simple-icons:waze (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Waze and the Waze logo are trademarks of Google LLC, used here only to refer to Waze.",
  },
  webflow: {
    category: "brands",
    labels: ["website", "builder", "design"],
    description: "The Webflow mark: a solid slanted W.",
    reference: "simple-icons:webflow (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Webflow and the Webflow logo are trademarks of Webflow, Inc., used here only to refer to Webflow.",
  },
  "webflow-ellipse": {
    category: "brands",
    labels: ["website", "builder", "design"],
    description: "The Webflow W in a ring, in the secondary tone.",
    reference: "simple-icons:webflow (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Webflow and the Webflow logo are trademarks of Webflow, Inc., used here only to refer to Webflow.",
  },
  "webflow-rectangle": {
    category: "brands",
    labels: ["website", "builder", "design"],
    description: "The Webflow W in a rounded square, in the secondary tone.",
    reference: "simple-icons:webflow (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Webflow and the Webflow logo are trademarks of Webflow, Inc., used here only to refer to Webflow.",
  },
  wechat: {
    category: "brands",
    labels: ["messaging", "chat", "social"],
    description:
      "The WeChat mark: a large speech bubble overlapped by a smaller one, each with two eyes.",
    reference: "simple-icons:wechat (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "WeChat and the WeChat logo are trademarks of Tencent Holdings Limited, used here only to refer to WeChat.",
  },
  whatsapp: {
    category: "brands",
    labels: ["messaging", "chat", "call"],
    description:
      "The WhatsApp mark: a round speech bubble with a pointed tail and a phone handset.",
    reference: "simple-icons:whatsapp (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "WhatsApp and the WhatsApp logo are trademarks of WhatsApp LLC, used here only to refer to WhatsApp.",
  },
  "whatsapp-business": {
    category: "brands",
    labels: ["messaging", "business", "chat"],
    description: "The WhatsApp bubble with a letter B inside.",
    reference: "simple-icons:whatsapp (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "WhatsApp Business and the WhatsApp Business logo are trademarks of WhatsApp LLC, used here only to refer to WhatsApp Business.",
  },
  wikipedia: {
    category: "brands",
    labels: ["encyclopedia", "wiki", "reference"],
    description: "The Wikipedia W: a serif W with three wide tops.",
    reference: "simple-icons:wikipedia (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Wikipedia and the Wikipedia logo are trademarks of the Wikimedia Foundation, Inc., used here only to refer to Wikipedia.",
  },
  "windows-old": {
    category: "brands",
    labels: ["microsoft", "os", "panes"],
    description: "The earlier Windows mark: four panes in perspective, the right ones taller.",
    reference: "simple-icons:windows10 (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Windows and the Windows logo are trademarks of Microsoft Corporation, used here only to refer to Windows.",
  },
  wordpress: {
    category: "brands",
    labels: ["blog", "cms", "website"],
    description: "The WordPress mark: a W inside a ring, the W in the secondary tone.",
    reference: "simple-icons:wordpress (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "WordPress and the WordPress logo are trademarks of the WordPress Foundation, used here only to refer to WordPress.",
  },
  "wps-office": {
    category: "brands",
    labels: ["office", "documents", "suite"],
    description: "The WPS Office mark: a bold W whose right arm rises higher, like a check mark.",
    trademark:
      "WPS Office and the WPS Office logo are trademarks of Kingsoft Office Software Corporation Limited, used here only to refer to WPS Office.",
  },
  "wps-office-rectangle": {
    category: "brands",
    labels: ["office", "documents", "suite"],
    description: "The WPS Office W in a rounded square, in the secondary tone.",
    trademark:
      "WPS Office and the WPS Office logo are trademarks of Kingsoft Office Software Corporation Limited, used here only to refer to WPS Office.",
  },
  xing: {
    category: "brands",
    labels: ["network", "career", "social"],
    description: "The XING mark: a small chevron beside a tall stroke that bends at its middle.",
    reference: "simple-icons:xing (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "XING and the XING logo are trademarks of New Work SE, used here only to refer to XING.",
  },
  youtube: {
    category: "brands",
    labels: ["video", "play", "streaming"],
    description: "The YouTube mark: a wide rounded rectangle with a play triangle cut out of it.",
    reference: "simple-icons:youtube (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "YouTube and the YouTube logo are trademarks of Google LLC, used here only to refer to YouTube.",
  },
  zoom: {
    category: "brands",
    labels: ["video", "meeting", "call"],
    description:
      "The Zoom mark: a video camera in a rounded square, the camera in the secondary tone.",
    trademark:
      "Zoom and the Zoom logo are trademarks of Zoom Communications, Inc., used here only to refer to Zoom.",
  },
  adventure: {
    labels: ["mountain", "flag", "expedition"],
    description: "A mountain with a flag planted on its peak.",
  },
  "ai-watermark": {
    labels: ["drop", "watermark", "ai"],
    description: "A water drop with an AI spark inside.",
  },
  "align-key-object": {
    labels: ["align", "key", "object"],
    description: "Two objects aligned on the left edge of a highlighted key object.",
  },
  arrange: {
    labels: ["arrange", "layers", "front"],
    description: "One square brought in front of another.",
  },
  "arrow-up-right-stack": {
    labels: ["arrow", "stack", "export"],
    description: "An up-right arrow leaving a stack corner.",
  },
  "atom-01": {
    labels: ["atom", "science", "orbit"],
    description: "Two crossed orbits around a nucleus.",
  },
  bacteria: {
    labels: ["bacteria", "germ", "microbe"],
    description: "A rod-shaped bacterium with a wavy flagellum.",
  },
  "badge-turkish-lira": {
    labels: ["badge", "lira", "currency"],
    description: "A rosette badge with a Turkish lira sign.",
  },
  "bend-tool": {
    labels: ["bend", "curve", "nodes"],
    description: "A curve running between two square nodes.",
  },
  "biceps-flexed": {
    labels: ["biceps", "muscle", "strength"],
    description: "A flexed arm with the biceps bulging.",
  },
  "body-part-six-pack": {
    labels: ["abs", "torso", "fitness"],
    description: "A torso with six abdominal muscles.",
  },
  "book-open-check": {
    labels: ["book", "read", "done"],
    description: "An open book with a check on its right page.",
  },
  "breast-pump": {
    labels: ["breast", "pump", "baby"],
    description: "A funnel flange on top of a bottle.",
  },
  cannabis: {
    labels: ["cannabis", "leaf", "plant"],
    description: "A cannabis leaf with pointed leaflets on a short stem.",
  },
  "cannabis-off": {
    labels: ["cannabis", "off", "forbidden"],
    description: "The cannabis leaf struck through by a slash.",
  },
  "circle-arrow-data-transfer-diagonal": {
    labels: ["transfer", "diagonal", "sync"],
    description: "A ring around two opposite diagonal arrows.",
  },
  "co-present": {
    labels: ["presenter", "screen", "meeting"],
    description: "A person in front of a presentation screen.",
  },
  "congruent-to-circle": {
    labels: ["congruent", "math", "circle"],
    description: "The congruence sign inside a ring.",
  },
  "congruent-to-square": {
    labels: ["congruent", "math", "square"],
    description: "The congruence sign inside a square.",
  },
  "covid-info": {
    labels: ["virus", "covid", "info"],
    description: "A spiked virus with an info badge.",
  },
  "credit-card-pos": {
    labels: ["terminal", "card", "payment"],
    description: "A card terminal with a card in its slot.",
  },
  dart: {
    labels: ["dart", "throw", "game"],
    description: "A dart flying down to the left with its flights.",
  },
  "delete-throw": {
    labels: ["bin", "throw", "discard"],
    description: "A ball being thrown into an open bin.",
  },
  "delivery-tracking-01": {
    labels: ["delivery", "tracking", "truck"],
    description: "A delivery lorry under a location pin.",
  },
  "delivery-tracking-02": {
    labels: ["parcel", "route", "tracking"],
    description: "A parcel linked by a route to a location pin.",
  },
  "diamond-percent": {
    labels: ["diamond", "discount", "percent"],
    description: "A diamond with a percent sign.",
  },
  "badge-turkish-lira-fill": {
    reference:
      "Filled variant of our own `badge-turkish-lira`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "badge"],
    description: "Filled: a rosette badge with a Turkish lira sign.",
  },
  "biceps-flexed-fill": {
    reference:
      "Filled variant of our own `biceps-flexed`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "biceps"],
    description: "Filled: a flexed arm with the biceps bulging.",
  },
  "circle-arrow-data-transfer-diagonal-fill": {
    reference:
      "Filled variant of our own `circle-arrow-data-transfer-diagonal`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "circle"],
    description: "Filled: a ring around two opposite diagonal arrows.",
  },
  "dining-table": {
    labels: ["dining", "table", "meal"],
    description: "A table seen from the side with a serving cloche on it.",
  },
  "dna-off": {
    labels: ["dna", "genetics", "off"],
    description: "The DNA double helix struck through by a slash.",
  },
  duplex: {
    labels: ["duplex", "house", "floors"],
    description: "A gabled house split into two storeys, with a window and a door.",
  },
  "edit-multiple": {
    labels: ["edit", "multiple", "documents"],
    description: "A pencil writing on the front sheet of two stacked sheets.",
  },
  "elearning-exchange": {
    labels: ["elearning", "exchange", "screen"],
    description: "A screen with two opposite arrows on it.",
  },
  "eraser-add": {
    labels: ["eraser", "add", "plus"],
    description: "An eraser with a plus badge.",
  },
  "estimate-02": {
    labels: ["estimate", "approximate", "document"],
    description: "A sheet with an approximately-equal sign.",
  },
  excavator: {
    labels: ["excavator", "construction", "digger"],
    description: "An excavator on tracks, with its boom and bucket, seen from the side.",
  },
  expander: {
    labels: ["expander", "fitness", "exercise"],
    description: "A chest expander with two handles joined by cables.",
  },
  "face-mimic": {
    labels: ["face", "expression", "wink"],
    description: "A round face winking.",
  },
  "fencing-mask": {
    labels: ["fencing", "mask", "sport"],
    description: "A fencing mask from the front, with a mesh face and a bib.",
  },
  "ferris-wheel": {
    labels: ["ferris", "wheel", "fair"],
    description: "A Ferris wheel with crossed spokes on two legs.",
  },
  "fish-symbol": {
    labels: ["ichthys", "fish", "symbol"],
    description: "The ichthys: two arcs meeting at the nose and crossing at the tail.",
  },
  forklift: {
    labels: ["forklift", "warehouse", "lift"],
    description: "A forklift from the side, with its mast, forks, cab guard and wheels.",
  },
  "geology-crust": {
    labels: ["geology", "crust", "layers"],
    description: "A block of ground layers under a mountain, with the top crust layer highlighted.",
  },
  gnome: {
    labels: ["gnome", "garden", "fantasy"],
    description: "A garden gnome with a tall pointed hat and a beard.",
  },
  "graduate-female": {
    labels: ["graduate", "student", "woman"],
    description: "A person with long hair wearing a mortarboard.",
  },
  "graduate-male": {
    labels: ["graduate", "student", "man"],
    description: "A person wearing a mortarboard with its tassel.",
  },
  "graduation-scroll": {
    labels: ["diploma", "scroll", "graduation"],
    description: "A rolled diploma tied with a ribbon.",
  },
  gun: {
    labels: ["gun", "pistol", "weapon"],
    description: "A solid pistol seen from the side.",
  },
  ico: {
    labels: ["ico", "icon", "file"],
    description: "A file with a small app icon on it.",
  },
  jupiter: {
    labels: ["jupiter", "planet", "space"],
    description: "A banded planet with the Great Red Spot.",
  },
  labor: {
    labels: ["labor", "worker", "hardhat"],
    description: "A person wearing a hard hat.",
  },
  liver: {
    labels: ["liver", "organ", "anatomy"],
    description: "A liver: a broad lobe that tapers to a point.",
  },
  "mask-love": {
    labels: ["mask", "heart", "care"],
    description: "A face mask with a heart on it.",
  },
  "meeting-room": {
    labels: ["meeting", "room", "table"],
    description: "A long table seen from above with two chairs on each side.",
  },
  "duplex-fill": {
    reference: "Filled variant of our own `duplex`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "duplex"],
    description: "Filled: a gabled house split into two storeys, with a window and a door.",
  },
  "face-mimic-fill": {
    reference: "Filled variant of our own `face-mimic`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "face"],
    description: "Filled: a round face winking.",
  },
  "fish-symbol-fill": {
    reference: "Filled variant of our own `fish-symbol`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "fish"],
    description: "Filled: the ichthys: two arcs meeting at the nose and crossing at the tail.",
  },
  "jupiter-fill": {
    reference: "Filled variant of our own `jupiter`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "jupiter"],
    description: "Filled: a banded planet with the Great Red Spot.",
  },
  "liver-fill": {
    reference: "Filled variant of our own `liver`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "liver"],
    description: "Filled: a liver: a broad lobe that tapers to a point.",
  },
  "milk-oat": {
    labels: ["oat", "milk", "carton"],
    description: "Milk carton with an oat grain on its front.",
  },
  "paint-board": {
    labels: ["palette", "paint", "art"],
    description: "Painter's palette with three dabs of paint.",
  },
  perspective: {
    labels: ["perspective", "room", "depth"],
    description: "Room in one-point perspective with its back wall highlighted.",
  },
  "pickup-01": {
    labels: ["pickup", "truck", "vehicle"],
    description: "Pickup truck seen from the side.",
  },
  "pickup-02": {
    labels: ["pickup", "cargo", "truck"],
    description: "Pickup truck carrying a crate in its bed.",
  },
  poop: {
    labels: ["poop", "waste", "pile"],
    description: "Three-tier swirl of poop with a curled tip.",
  },
  pulley: {
    labels: ["pulley", "rope", "lift"],
    description: "Wheel hung from a beam with a rope and a weight.",
  },
  "push-up-bar": {
    labels: ["push-up", "fitness", "grip"],
    description: "Push-up bar with a padded grip on splayed legs.",
  },
  puzzle: {
    labels: ["puzzle", "piece", "jigsaw"],
    description: "Jigsaw puzzle piece with two knobs.",
  },
  "queue-01": {
    labels: ["queue", "line", "people"],
    description: "Three people standing in a line.",
  },
  "queue-02": {
    labels: ["queue", "waiting", "next"],
    description: "Three people in a line over an arrow to the front.",
  },
  radiation: {
    labels: ["radiation", "nuclear", "hazard"],
    description: "Radiation trefoil: three blades round a centre dot.",
  },
  rat: {
    labels: ["rat", "rodent", "animal"],
    description: "Rat seen from the side with a long tail.",
  },
  "recycle-01": {
    labels: ["recycle", "arrows", "eco"],
    description: "Three arrows chasing each other round a triangle.",
  },
  "restaurant-table": {
    labels: ["table", "restaurant", "dining"],
    description: "Table between two chairs with a plate on it.",
  },
  "road-wayside": {
    labels: ["roadside", "road", "sign"],
    description: "Road in perspective with a signpost beside it.",
  },
  "roller-coaster": {
    labels: ["coaster", "loop", "ride"],
    description: "Roller coaster loop on a raised track.",
  },
  "rotate-ccw-key": {
    labels: ["key", "rotate", "renew"],
    description: "Key over an anticlockwise arrow.",
  },
  "safety-pin-01": {
    labels: ["safety-pin", "pin", "clasp"],
    description: "Safety pin lying flat with its coil and clasp.",
  },
  sandals: {
    labels: ["sandal", "flip-flop", "beach"],
    description: "Flip-flop seen from above with its V strap.",
  },
  "search-replace": {
    labels: ["search", "replace", "find"],
    description: "Magnifier with a return arrow in the corner.",
  },
  seesaw: {
    labels: ["seesaw", "playground", "balance"],
    description: "Tilted plank resting on a triangular pivot.",
  },
  "share-knowledge": {
    labels: ["knowledge", "share", "book"],
    description: "Closed book with share nodes above it.",
  },
  "shared-drive": {
    labels: ["drive", "shared", "storage"],
    description: "Hard drive with a share arrow in the corner.",
  },
  shell: {
    labels: ["shell", "scallop", "sea"],
    description: "Scallop shell with a scalloped rim and ribs.",
  },
  "sheriff-01": {
    labels: ["sheriff", "badge", "star"],
    description: "Star badge with a round stamp at its centre.",
  },
  shoulder: {
    labels: ["shoulder", "body", "person"],
    description: "Person with one shoulder highlighted.",
  },
  "paint-board-fill": {
    reference: "Filled variant of our own `paint-board`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "paint"],
    description: "Filled: painter's palette with three dabs of paint.",
  },
  "pickup-01-fill": {
    reference: "Filled variant of our own `pickup-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "pickup"],
    description: "Filled: pickup truck seen from the side.",
  },
  "poop-fill": {
    reference: "Filled variant of our own `poop`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "poop"],
    description: "Filled: three-tier swirl of poop with a curled tip.",
  },
  "puzzle-fill": {
    reference: "Filled variant of our own `puzzle`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "puzzle"],
    description: "Filled: jigsaw puzzle piece with two knobs.",
  },
  "rat-fill": {
    reference: "Filled variant of our own `rat`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rat"],
    description: "Filled: rat seen from the side with a long tail.",
  },
  "shell-fill": {
    reference: "Filled variant of our own `shell`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "shell"],
    description: "Filled: scallop shell with a scalloped rim and ribs.",
  },
  "sheriff-01-fill": {
    reference: "Filled variant of our own `sheriff-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "sheriff"],
    description: "Filled: star badge with a round stamp at its centre.",
  },
  "smartphone-lost-wifi": {
    labels: ["phone", "wifi", "disconnected"],
    description: "A smartphone beside a wifi sign whose dot is crossed out.",
  },
  "smile-dizzy": {
    labels: ["emoji", "dizzy", "face"],
    description: "A smiling face with crossed, dizzy eyes.",
  },
  spaghetti: {
    labels: ["pasta", "food", "fork"],
    description: "A plate of spaghetti with a fork standing in it.",
  },
  sperm: {
    labels: ["fertility", "cell", "biology"],
    description: "A sperm cell with an oval head and a wavy tail.",
  },
  sphere: {
    labels: ["ball", "3d", "shape"],
    description: "A circle with a curved equator, drawn as a sphere.",
  },
  spotlight: {
    labels: ["light", "stage", "beam"],
    description: "A hanging spotlight casting a cone of light to the floor.",
  },
  "square-arrow-data-transfer-diagonal": {
    labels: ["transfer", "sync", "arrows"],
    description: "A square with two opposite diagonal arrows inside.",
  },
  "square-centerline-dashed-horizontal": {
    labels: ["centre", "guide", "align"],
    description: "A square with a dashed horizontal centre line.",
  },
  "star-award-01": {
    labels: ["award", "star", "badge"],
    description: "A star badge with two ribbons hanging below it.",
  },
  "street-food": {
    labels: ["stall", "cart", "food"],
    description: "A food stall with an awning over a counter on two wheels.",
  },
  "structure-folder-circle": {
    labels: ["structure", "hierarchy", "folder"],
    description: "Two linked circles connected down to a folder.",
  },
  student: {
    labels: ["student", "graduate", "school"],
    description: "A person wearing a mortarboard.",
  },
  students: {
    labels: ["students", "class", "school"],
    description: "Two people side by side, each in a mortarboard.",
  },
  "tanker-truck": {
    labels: ["tanker", "truck", "fuel"],
    description: "A truck carrying a round tank behind its cab.",
  },
  "treadmill-01": {
    labels: ["treadmill", "fitness", "running"],
    description: "A treadmill belt with an upright and a console.",
  },
  "utensils-crossed": {
    labels: ["restaurant", "cutlery", "dining"],
    description: "A fork and a knife crossed in an X.",
  },
  vomiting: {
    labels: ["sick", "nausea", "face"],
    description: "A face being sick, the spill below its mouth.",
  },
  wanted: {
    labels: ["poster", "wanted", "portrait"],
    description: "A wanted poster: a portrait under a heading bar.",
  },
  watermelon: {
    labels: ["fruit", "watermelon", "slice"],
    description: "A half-disc watermelon slice with rind line and seeds.",
  },
  "webhook-off": {
    labels: ["webhook", "disabled", "off"],
    description: "The webhook symbol crossed out by a diagonal slash.",
  },
  "weight-tilde": {
    labels: ["weight", "approximate", "mass"],
    description: "A weight with a tilde on it.",
  },
  "wireless-cloud-access": {
    labels: ["cloud", "wifi", "wireless"],
    description: "A cloud above a wifi sign.",
  },
  worm: {
    labels: ["worm", "bait", "wriggle"],
    description: "A worm wriggling in a wave.",
  },
  "sphere-fill": {
    reference: "Filled variant of our own `sphere`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "sphere"],
    description: "Filled: a circle with a curved equator, drawn as a sphere.",
  },
  "square-arrow-data-transfer-diagonal-fill": {
    reference:
      "Filled variant of our own `square-arrow-data-transfer-diagonal`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "square"],
    description: "Filled: a square with two opposite diagonal arrows inside.",
  },
  "weight-tilde-fill": {
    reference:
      "Filled variant of our own `weight-tilde`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "weight"],
    description: "Filled: a weight with a tilde on it.",
  },
  adzan: {
    labels: ["call", "minaret", "prayer"],
    description: "A minaret with sound waves for the call to prayer.",
  },
  "al-aqsa-mosque": {
    labels: ["dome", "jerusalem", "mosque"],
    description: "The Dome of the Rock: a dome on a drum over a wide hall.",
  },
  angel: {
    labels: ["angel", "halo", "wings"],
    description: "An angel with a halo, a robe and raised wings.",
  },
  "bedug-01": {
    labels: ["drum", "bedug", "mosque"],
    description: "A barrel drum lying on its stand.",
  },
  "bedug-02": {
    labels: ["drum", "bedug", "hanging"],
    description: "A barrel drum hung from a beam between two posts.",
  },
  caduceus: {
    labels: ["medicine", "staff", "snakes"],
    description: "A winged staff with two snakes winding around it.",
  },
  cross: {
    labels: ["cross", "christian", "faith"],
    description: "A Latin cross in outline.",
  },
  dua: {
    labels: ["dua", "supplication", "prayer"],
    description: "A person with both hands raised in supplication.",
  },
  "eid-mubarak": {
    labels: ["eid", "crescent", "lantern"],
    description: "A crescent moon with a small lantern hanging beside it.",
  },
  halal: {
    labels: ["halal", "stamp", "crescent"],
    description: "A round stamp with a crescent.",
  },
  "halal-lab": {
    labels: ["halal", "lab", "flask"],
    description: "A conical flask with a crescent inside.",
  },
  hijab: {
    labels: ["hijab", "headscarf", "woman"],
    description: "A headscarf framing a face and falling to the shoulders.",
  },
  "kaaba-01": {
    labels: ["kaaba", "mecca", "cube"],
    description: "The Kaaba as a solid cube with its band.",
  },
  "kaaba-02": {
    labels: ["kaaba", "mecca", "cube"],
    description: "The Kaaba as an outlined cube with its band on both faces.",
  },
  keffiyeh: {
    labels: ["keffiyeh", "headdress", "agal"],
    description: "A head cloth falling to the shoulders, held by an agal cord.",
  },
  ketupat: {
    labels: ["ketupat", "rice", "eid"],
    description: "The woven diamond rice pouch with two leaf ends.",
  },
  "mosque-01": {
    labels: ["mosque", "dome", "crescent"],
    description: "A dome with a crescent finial over a hall with an arched door.",
  },
  "mosque-02": {
    labels: ["mosque", "minaret", "dome"],
    description: "The shared mosque dome with one minaret.",
  },
  "mosque-03": {
    labels: ["mosque", "minarets", "dome"],
    description: "The shared mosque dome between two minarets.",
  },
  "mosque-04": {
    labels: ["mosque", "arcade", "dome"],
    description: "The shared mosque dome over a hall of three arches.",
  },
  "mosque-05": {
    labels: ["mosque", "solid", "minarets"],
    description: "A solid mosque with a dome and two minarets.",
  },
  "mosque-location": {
    labels: ["mosque", "location", "pin"],
    description: "A map pin with a dome in its head.",
  },
  niqab: {
    labels: ["niqab", "veil", "woman"],
    description: "A veil covering the face except for an eye slit.",
  },
  "prayer-rug-01": {
    labels: ["prayer", "rug", "niche"],
    description: "A prayer rug with fringes and a pointed niche.",
  },
  "prayer-rug-02": {
    labels: ["prayer", "rug", "rolled"],
    description: "A half-rolled prayer rug with its pointed niche.",
  },
  "quran-01": {
    labels: ["quran", "book", "crescent"],
    description: "A closed book with a crescent on its cover.",
  },
  "quran-02": {
    labels: ["quran", "rehal", "stand"],
    description: "An open book resting on a crossed rehal stand.",
  },
  "quran-03": {
    labels: ["quran", "open", "book"],
    description: "An open book under a crescent.",
  },
  "ramadhan-01": {
    labels: ["ramadan", "fanous", "lantern"],
    description: "A Ramadan fanous lantern with a flame.",
  },
  "ramadhan-month": {
    labels: ["ramadan", "calendar", "month"],
    description: "A calendar with a crescent in place of the day.",
  },
  "rub-el-hizb": {
    labels: ["star", "octagram", "islamic"],
    description: "The eight-pointed star of two overlapping squares.",
  },
  salah: {
    labels: ["salah", "standing", "prayer"],
    description: "A person standing in prayer with folded arms on a mat.",
  },
  "salah-time": {
    labels: ["prayer", "time", "clock"],
    description: "A clock with a crescent badge.",
  },
  tasbih: {
    labels: ["tasbih", "beads", "rosary"],
    description: "A loop of prayer beads with a tassel.",
  },
  "the-prophets-mosque": {
    labels: ["medina", "dome", "mosque"],
    description: "The Prophet's Mosque with its green dome between two minarets.",
  },
  wudu: {
    labels: ["wudu", "ablution", "water"],
    description: "An open hand under a falling water drop.",
  },
  "cross-fill": {
    reference: "Filled variant of our own `cross`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "cross"],
    description: "Filled: a Latin cross in outline.",
  },
  "halal-fill": {
    reference: "Filled variant of our own `halal`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "halal"],
    description: "Filled: a round stamp with a crescent.",
  },
  "ketupat-fill": {
    reference: "Filled variant of our own `ketupat`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "ketupat"],
    description: "Filled: the woven diamond rice pouch with two leaf ends.",
  },
  "mosque-location-fill": {
    reference:
      "Filled variant of our own `mosque-location`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "mosque"],
    description: "Filled: a map pin with a dome in its head.",
  },
  "prayer-rug-01-fill": {
    reference:
      "Filled variant of our own `prayer-rug-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "prayer"],
    description: "Filled: a prayer rug with fringes and a pointed niche.",
  },
  "quran-01-fill": {
    reference: "Filled variant of our own `quran-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "quran"],
    description: "Filled: a closed book with a crescent on its cover.",
  },
  "ramadhan-01-fill": {
    reference: "Filled variant of our own `ramadhan-01`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "ramadhan"],
    description: "Filled: a Ramadan fanous lantern with a flame.",
  },
  "rub-el-hizb-fill": {
    reference: "Filled variant of our own `rub-el-hizb`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "rub"],
    description: "Filled: the eight-pointed star of two overlapping squares.",
  },
  "alphabet-arabic": {
    labels: ["arabic", "ain", "alphabet"],
    description: "The letter ain for the Arabic alphabet.",
  },
  "alphabet-bangla": {
    labels: ["bangla", "bengali", "script"],
    description: "The Bengali letter o for Bangla.",
  },
  "alphabet-chinese": {
    labels: ["chinese", "wen", "script"],
    description: "The character wen for Chinese script.",
  },
  "alphabet-greek": {
    labels: ["greek", "omega", "alphabet"],
    description: "A capital omega for the Greek alphabet.",
  },
  "alphabet-hindi": {
    labels: ["hindi", "devanagari", "script"],
    description: "The Devanagari letter a for Hindi.",
  },
  "alphabet-japanese": {
    labels: ["japanese", "hiragana", "script"],
    description: "The hiragana a for Japanese script.",
  },
  "alphabet-korean": {
    labels: ["korean", "hangul", "script"],
    description: "The syllable ga for Korean script.",
  },
  berlin: {
    labels: ["berlin", "brandenburg", "gate"],
    description: "The Brandenburg Gate with its quadriga over columns.",
  },
  "berlin-tower": {
    labels: ["tv", "tower", "berlin"],
    description: "The Berlin TV tower: a ball on a needle and shaft.",
  },
  borobudur: {
    labels: ["borobudur", "stupa", "temple"],
    description: "Borobudur: a bell stupa on stepped terraces.",
  },
  "burj-al-arab": {
    labels: ["burj", "dubai", "sail"],
    description: "The sail-shaped Burj Al Arab tower on its island.",
  },
  "cayan-tower": {
    labels: ["cayan", "twisted", "tower"],
    description: "A tall tower whose floors twist around it.",
  },
  "central-shaheed-minar": {
    labels: ["shaheed", "minar", "memorial"],
    description: "A tall frame with a bowed head between two lower frames.",
  },
  "china-temple": {
    labels: ["pagoda", "temple", "china"],
    description: "A pagoda with upturned eaves, a spire and a door.",
  },
  colosseum: {
    labels: ["colosseum", "rome", "arena"],
    description: "The Colosseum's tiers of arches, broken off on one side.",
  },
  "eiffel-tower": {
    labels: ["eiffel", "paris", "tower"],
    description: "The Eiffel tower with its platforms, splayed legs and arch.",
  },
  "india-gate": {
    labels: ["india", "gate", "arch"],
    description: "India Gate, a memorial arch with a cornice and small dome.",
  },
  "mayan-pyramid": {
    labels: ["mayan", "pyramid", "temple"],
    description: "A stepped Mayan pyramid with a temple and a central stair.",
  },
  monas: {
    labels: ["monas", "jakarta", "monument"],
    description: "The Monas obelisk crowned with a flame on its cup platform.",
  },
  "pisa-tower": {
    labels: ["pisa", "leaning", "tower"],
    description: "The leaning tower of Pisa, its storeys stepped to one side.",
  },
  "taj-mahal": {
    labels: ["taj", "mahal", "dome"],
    description: "The Taj Mahal: an onion dome on an arched hall between minarets.",
  },
  "torri-gate": {
    labels: ["torii", "gate", "shrine"],
    description: "A Japanese torii gate with two beams and two posts.",
  },
  trulli: {
    labels: ["trullo", "cone", "house"],
    description: "A trullo: a conical stone roof on a whitewashed wall.",
  },
  "twin-tower": {
    labels: ["twin", "towers", "skybridge"],
    description: "Two spired towers linked by a skybridge.",
  },
  "washington-monument": {
    labels: ["obelisk", "washington", "monument"],
    description: "The Washington Monument obelisk on a stepped base.",
  },
  "washington-monument-fill": {
    reference:
      "Filled variant of our own `washington-monument`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "washington"],
    description: "Filled: the Washington Monument obelisk on a stepped base.",
  },
  "burj-al-arab-fill": {
    reference:
      "Filled variant of our own `burj-al-arab`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "burj"],
    description: "Filled: the sail-shaped Burj Al Arab tower on its island.",
  },
  "berlin-tower-fill": {
    reference:
      "Filled variant of our own `berlin-tower`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "berlin"],
    description: "Filled: the Berlin TV tower: a ball on a needle and shaft.",
  },
  "borobudur-fill": {
    reference: "Filled variant of our own `borobudur`, generated from its outline on 2026-11-17.",
    labels: ["filled", "solid", "borobudur"],
    description: "Filled: borobudur: a bell stupa on stepped terraces.",
  },
  "bitcoin-piggy-bank": {
    labels: ["piggy", "bitcoin", "savings"],
    description: "A piggy bank with a bitcoin sign on its side.",
  },
  "bitcoin-target": {
    labels: ["bitcoin", "target", "goal"],
    description: "A crosshair ring with four ticks and the bitcoin B at its centre.",
  },
  digg: {
    category: "brands",
    labels: ["digg", "news", "social"],
    description: "The Digg logo: its blocky lowercase digg wordmark.",
    reference: "simple-icons:digg (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Digg and the Digg logo are trademarks of Digg, Inc., used here only to refer to Digg.",
  },
  dropbox: {
    category: "brands",
    labels: ["dropbox", "cloud", "storage"],
    description: "The Dropbox mark: five rhombi forming an open box.",
    reference: "simple-icons:dropbox (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Dropbox and the Dropbox logo are trademarks of Dropbox, Inc., used here only to refer to Dropbox.",
  },
  "google-lens": {
    category: "brands",
    labels: ["lens", "visual search", "camera"],
    description: "The Google Lens mark: viewfinder brackets, a central disc and a corner dot.",
    reference: "simple-icons:googlelens (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Google Lens and the Google Lens logo are trademarks of Google LLC, used here only to refer to Google Lens.",
  },
  iconjar: {
    category: "brands",
    labels: ["jar", "icons", "app"],
    description: "The IconJar mark: a lidded jar with a slit splitting its body.",
    reference: "simple-icons:iconjar (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "IconJar and the IconJar logo are trademarks of their owners, used here only to refer to IconJar.",
  },
  "office-365": {
    category: "brands",
    labels: ["office", "microsoft", "suite"],
    description: "The Office 365 door-shaped mark in pixels.",
    trademark:
      "Office 365 and the Office logo are trademarks of Microsoft Corporation, used here only to refer to Office 365.",
  },
  plaxo: {
    category: "brands",
    labels: ["plaxo", "contacts", "brand"],
    description: "The Plaxo mark: a P inside a ring, its stem piercing the ring at the bottom.",
    trademark:
      "Plaxo and the Plaxo logo are trademarks of their owner, used here only to refer to Plaxo.",
  },
  pokeball: {
    category: "brands",
    labels: ["pokeball", "pokemon", "game"],
    description:
      "A Pok\u00e9 Ball: solid upper half, open lower half and the round button on the seam.",
    trademark:
      "Pok\u00e9mon and the Pok\u00e9 Ball are trademarks of Nintendo, Creatures Inc. and GAME FREAK inc., used here only to refer to Pok\u00e9mon.",
  },
  "shield-blockchain": {
    labels: ["shield", "bitcoin", "chain"],
    description: "A shield with a bitcoin B and two linked chain rings at its corner.",
  },
  stumbleupon: {
    category: "brands",
    labels: ["stumbleupon", "discovery", "social"],
    description: "The StumbleUpon mark: the joined su, a hooked arch followed by a u.",
    reference: "fa-brands:stumbleupon (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "StumbleUpon and the StumbleUpon logo are trademarks of StumbleUpon, Inc., used here only to refer to StumbleUpon.",
  },
  swarm: {
    category: "brands",
    labels: ["bee", "check-in", "foursquare"],
    description: "The Swarm by Foursquare bee: two wings, a striped curved body and the sting.",
    reference: "simple-icons:swarm (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Swarm and the Swarm logo are trademarks of Foursquare Labs, Inc., used here only to refer to Swarm.",
  },
  uber: {
    category: "brands",
    labels: ["uber", "ride", "taxi"],
    description: "The Uber app icon: a solid square with the Uber wordmark knocked out.",
    trademark:
      "Uber and the Uber logo are trademarks of Uber Technologies, Inc., used here only to refer to Uber.",
  },
  wise: {
    category: "brands",
    labels: ["wise", "money", "transfer"],
    description:
      "The Wise fast-flag mark: a top bar turning into a long slanted stroke, with a down-left arrowhead.",
    reference: "simple-icons:wise (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Wise and the Wise logo are trademarks of Wise Payments Limited, used here only to refer to Wise.",
  },
  zsh: {
    category: "brands",
    labels: ["zsh", "shell", "terminal"],
    description:
      "The Zsh logo: a terminal window with a % prompt and a z breaking its lower right corner.",
    reference: "simple-icons:zsh (Iconify, 2026-11-18): rasterised, then redrawn by hand.",
    trademark:
      "Zsh and the Zsh logo are trademarks of their owners, used here only to refer to Zsh.",
  },
};
