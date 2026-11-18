// The data of the icon picker: a small common set drawn at once, the curated sections (names only),
// the whole catalog loaded on demand, and the search over it.
//
// Loading. The ~50 common icons are imported statically (a few KB), so a trigger, a thumbnail or
// a page icon among them renders on the server and at first paint. Everything else comes from
// `./icon-picker-all` through one dynamic `import()`, started when a picker opens (or its trigger
// is pointed at) or when `IconByName` meets a name outside the common set; it is fetched once and
// shared by every picker of the page.

import type { IconDefinition, PixelIcon } from "@forgeron/icons";
import {
  AlertCircleIcon,
  AnvilIcon,
  BoltIcon,
  BookOpen01Icon,
  Bookmark01Icon,
  Briefcase01Icon,
  Bug01Icon,
  BulbIcon,
  Calendar03Icon,
  ChartLineData01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Coffee01Icon,
  CrownIcon,
  File01Icon,
  FireIcon,
  Flag01Icon,
  Folder01Icon,
  GiftIcon,
  GlobeIcon,
  HammerIcon,
  HeartIcon,
  HelpCircleIcon,
  Home01Icon,
  Image01Icon,
  Key01Icon,
  Link01Icon,
  LockIcon,
  Mail01Icon,
  Message01Icon,
  Money01Icon,
  Note01Icon,
  PinIcon,
  Rocket01Icon,
  Settings01Icon,
  SmileIcon,
  SparklesIcon,
  StarIcon,
  Tag01Icon,
  Target01Icon,
  Task01Icon,
  ThumbsUpIcon,
  Tick01Icon,
  TrophyIcon,
  UserGroupIcon,
  UserIcon,
  Wrench01Icon,
} from "@forgeron/icons";

/* ---------------------------------------------------------------- common set */

/** Drawn with the page: the first section of the picker, and the names that never wait. */
const COMMON_ICONS: ReadonlyArray<IconDefinition> = [
  Note01Icon,
  File01Icon,
  Folder01Icon,
  Home01Icon,
  StarIcon,
  HeartIcon,
  FireIcon,
  Rocket01Icon,
  BulbIcon,
  Flag01Icon,
  PinIcon,
  BoltIcon,
  SparklesIcon,
  SmileIcon,
  ThumbsUpIcon,
  Tick01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  HelpCircleIcon,
  Calendar03Icon,
  Clock01Icon,
  UserIcon,
  UserGroupIcon,
  Mail01Icon,
  Message01Icon,
  BookOpen01Icon,
  Briefcase01Icon,
  ChartLineData01Icon,
  Task01Icon,
  Target01Icon,
  TrophyIcon,
  GiftIcon,
  Coffee01Icon,
  HammerIcon,
  AnvilIcon,
  Wrench01Icon,
  Settings01Icon,
  GlobeIcon,
  LockIcon,
  Key01Icon,
  Bug01Icon,
  Money01Icon,
  Image01Icon,
  Link01Icon,
  Tag01Icon,
  Bookmark01Icon,
  CrownIcon,
];

// Built on first use, not at module level: a page that never shows a picker keeps none of it.
let commonMap: Map<string, PixelIcon> | null = null;
const common = () =>
  (commonMap ??= new Map(COMMON_ICONS.map((icon) => [icon.name, icon] as const)));

/* ---------------------------------------------------------------- sections */

export interface IconSection {
  id: string;
  label: string;
  /** Icon names, in order. A name that is not drawn is left out. */
  icons: ReadonlyArray<string>;
  /** Words that find every icon of the section, besides its label. */
  keywords?: ReadonlyArray<string>;
}

/**
 * The browsing order of the picker after Recent: the common set, then hand-picked groups. The
 * catalog's own categories live in its manifest, which the UI does not load (it weighs 2.7 MB);
 * every other drawn icon follows under "All icons".
 */
export const ICON_SECTIONS: ReadonlyArray<IconSection> = [
  {
    id: "common",
    label: "Common",
    icons: [
      "note-01",
      "file-01",
      "folder-01",
      "home-01",
      "star",
      "heart",
      "fire",
      "rocket-01",
      "bulb",
      "flag-01",
      "pin",
      "bolt",
      "sparkles",
      "smile",
      "thumbs-up",
      "tick-01",
      "checkmark-circle-01",
      "alert-circle",
      "help-circle",
      "calendar-03",
      "clock-01",
      "user",
      "user-group",
      "mail-01",
      "message-01",
      "book-open-01",
      "briefcase-01",
      "chart-line-data-01",
      "task-01",
      "target-01",
      "trophy",
      "gift",
      "coffee-01",
      "hammer",
      "anvil",
      "wrench-01",
      "settings-01",
      "globe",
      "lock",
      "key-01",
      "bug-01",
      "money-01",
      "image-01",
      "link-01",
      "tag-01",
      "bookmark-01",
      "crown",
    ],
  },
  {
    id: "work",
    label: "Work",
    keywords: ["business", "office", "job", "project"],
    icons: [
      "briefcase-01",
      "task-01",
      "task-done-01",
      "kanban",
      "presentation-01",
      "chart-bar-line",
      "chart-line-data-01",
      "pie-chart",
      "analytics-01",
      "invoice-01",
      "receipt-euro",
      "money-01",
      "wallet-01",
      "credit-card",
      "bank",
      "calculator",
      "contracts",
      "signature",
      "target-01",
      "rocket-01",
      "archive-01",
      "inbox",
      "clipboard",
      "calendar-03",
      "alarm-clock",
      "hourglass",
      "timer-01",
      "dashboard-square-01",
      "workflow-square-01",
      "package",
    ],
  },
  {
    id: "files",
    label: "Files",
    keywords: ["document", "doc", "page", "media"],
    icons: [
      "file-01",
      "file-02",
      "file-edit",
      "file-add",
      "file-search",
      "file-zip",
      "pdf-02",
      "note-01",
      "note-edit",
      "document-attachment",
      "folder-01",
      "folder-02",
      "folder-open",
      "folder-add",
      "folder-shared-01",
      "image-01",
      "video-01",
      "music-note-01",
      "attachment-01",
      "table",
      "database",
      "cloud-upload",
      "cloud-download",
      "download-01",
      "upload-01",
      "copy-01",
      "printer",
      "book-01",
      "book-open-01",
      "notebook",
      "certificate-01",
    ],
  },
  {
    id: "people",
    label: "People",
    keywords: ["person", "team", "face", "hand"],
    icons: [
      "user",
      "user-group",
      "user-add-01",
      "user-circle",
      "user-account",
      "user-list",
      "user-check-01",
      "user-star-01",
      "customer-support",
      "manager",
      "teaching",
      "baby-01",
      "woman",
      "man",
      "hand-pointing-right-01",
      "thumbs-up",
      "thumbs-down",
      "clapping-01",
      "smile",
      "sad-01",
      "happy",
      "laugh",
      "angry",
    ],
  },
  {
    id: "communication",
    label: "Communication",
    keywords: ["chat", "talk", "send", "email"],
    icons: [
      "mail-01",
      "mail-open-01",
      "message-01",
      "chatting-01",
      "chat",
      "comment-01",
      "call",
      "megaphone-01",
      "notification-01",
      "sent",
      "at",
      "voice",
      "mic-01",
      "rss",
      "share-01",
      "link-01",
      "qr-code",
      "translate",
    ],
  },
  {
    id: "places",
    label: "Places",
    keywords: ["travel", "map", "location", "building"],
    icons: [
      "home-01",
      "building-01",
      "store-01",
      "hospital-01",
      "school",
      "factory",
      "warehouse",
      "map-pin",
      "location-01",
      "maps",
      "globe",
      "airplane-01",
      "car-01",
      "bus-01",
      "train-01",
      "bicycle",
      "cargo-ship",
      "truck",
      "road",
      "mountain",
      "beach",
      "tent",
      "compass",
    ],
  },
  {
    id: "objects",
    label: "Objects",
    keywords: ["thing", "tool", "device"],
    icons: [
      "hammer",
      "anvil",
      "wrench-01",
      "key-01",
      "lock",
      "gift",
      "crown",
      "trophy",
      "award-01",
      "medal-01",
      "diamond-01",
      "glasses",
      "umbrella",
      "shopping-cart-01",
      "shopping-bag-01",
      "tag-01",
      "bookmark-01",
      "brush",
      "pencil",
      "scissor",
      "ruler",
      "magnet",
      "camera-01",
      "headphones",
      "laptop",
      "smart-phone-01",
      "computer",
      "watch-01",
      "tv-01",
      "game-controller-01",
      "dice",
    ],
  },
  {
    id: "nature",
    label: "Nature & food",
    keywords: ["weather", "animal", "plant", "food", "drink"],
    icons: [
      "sun-01",
      "moon-02",
      "cloud",
      "star",
      "rain",
      "snow",
      "fire",
      "bolt",
      "leaf-01",
      "tree-01",
      "plant-01",
      "flower",
      "cactus",
      "mushroom",
      "orange",
      "coffee-01",
      "tea",
      "pizza-01",
      "cookie",
      "ice-cream-cone",
      "cat",
      "bird",
      "fish",
      "turtle",
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    keywords: ["sign", "shape", "mark", "status"],
    icons: [
      "star",
      "heart",
      "flag-01",
      "pin",
      "bolt",
      "sparkles",
      "tick-01",
      "checkmark-circle-01",
      "cancel-circle",
      "alert-circle",
      "help-circle",
      "information-circle",
      "add-circle",
      "minus-sign-circle",
      "bulb",
      "eye",
      "infinity-01",
      "hashtag",
      "percent-circle",
      "copyright",
      "shield-01",
      "lock-key",
      "circle",
      "square",
      "triangle",
      "hexagon",
    ],
  },
];

/** A word someone types → a word of the names it should find. */
const SYNONYMS: Readonly<Record<string, ReadonlyArray<string>>> = {
  trash: ["delete"],
  bin: ["delete"],
  remove: ["delete", "cancel"],
  house: ["home"],
  person: ["user"],
  people: ["user"],
  team: ["user-group", "team"],
  gear: ["settings"],
  cog: ["settings"],
  preferences: ["settings"],
  idea: ["bulb"],
  light: ["bulb", "sun"],
  check: ["tick", "checkmark"],
  done: ["tick", "checkmark", "task-done"],
  warning: ["alert"],
  error: ["alert", "cancel"],
  question: ["help"],
  info: ["information"],
  favorite: ["star", "heart"],
  favourite: ["star", "heart"],
  love: ["heart"],
  like: ["thumbs-up", "heart"],
  hot: ["fire"],
  launch: ["rocket"],
  place: ["location", "map-pin"],
  date: ["calendar"],
  time: ["clock", "timer", "hourglass"],
  email: ["mail"],
  chat: ["message", "chatting", "comment"],
  doc: ["file", "note", "document"],
  document: ["file", "note"],
  page: ["note", "file"],
  photo: ["image", "camera"],
  picture: ["image"],
  web: ["globe"],
  world: ["globe"],
  internet: ["globe"],
  password: ["lock", "key"],
  security: ["shield", "lock"],
  tools: ["wrench", "hammer"],
  forge: ["anvil", "hammer", "fire"],
  prize: ["trophy", "award", "medal"],
  present: ["gift"],
  king: ["crown"],
  find: ["search"],
  label: ["tag"],
  save: ["bookmark", "download"],
  money: ["money", "wallet", "coin"],
  cash: ["money"],
  pay: ["credit-card", "wallet", "money"],
  bill: ["invoice", "receipt"],
  goal: ["target"],
  chart: ["chart", "analytics"],
  graph: ["chart", "analytics"],
  plane: ["airplane"],
  flight: ["airplane"],
  happy: ["smile", "happy", "laugh"],
  emoji: ["smile", "happy", "sad", "laugh", "angry"],
};

/* ---------------------------------------------------------------- names */

/** `rocket-01` → `rocket 01`: the name a screen reader and the footer say. */
export const iconLabel = (name: string) => name.replace(/-/g, " ");

/** `Rocket01Icon` → `rocket-01`: the name an export spells. */
const exportToName = (key: string) =>
  key
    .replace(/Icon$/, "")
    .replace(/([a-z])([A-Z0-9])/g, "$1-$2")
    .replace(/([0-9])([A-Za-z])/g, "$1-$2")
    .toLowerCase();

/* ---------------------------------------------------------------- catalog */

export interface IconEntry {
  name: string;
  icon: PixelIcon;
  /** Words besides the name: other names of the same drawing, the labels of its sections. */
  keywords: ReadonlyArray<string>;
}

export interface IconCatalog {
  /** Every drawn icon once, one name per drawing, by name. Stubs are left out. */
  entries: ReadonlyArray<IconEntry>;
  byName: ReadonlyMap<string, PixelIcon>;
}

let wordsMap: Map<string, string[]> | null = null;
/** The words of the sections each curated name is in: its label and its keywords. */
const sectionWords = () => {
  if (wordsMap) return wordsMap;
  wordsMap = new Map();
  for (const section of ICON_SECTIONS) {
    for (const name of section.icons) {
      const words = wordsMap.get(name) ?? [];
      words.push(section.label.toLowerCase(), ...(section.keywords ?? []));
      wordsMap.set(name, words);
    }
  }
  return wordsMap;
};

/**
 * The catalog from the module of every icon: the drawn ones, one entry per drawing (a name that
 * reuses another's drawing, `trash` → `delete-01`, becomes a keyword of the first), sorted by name.
 */
function buildCatalog(module: Record<string, unknown>): IconCatalog {
  const byName = new Map<string, PixelIcon>();
  const groups = new Map<string, { icons: PixelIcon[]; aliases: string[] }>();
  for (const [key, value] of Object.entries(module)) {
    if (!value || typeof value !== "object" || !("rows" in value)) continue;
    const icon = value as PixelIcon;
    byName.set(icon.name, icon);
    const drawing = `${icon.grid}:${icon.rows.join("/")}`;
    const group = groups.get(drawing) ?? { icons: [], aliases: [] };
    if (!group.icons.some((i) => i.name === icon.name)) group.icons.push(icon);
    const spelled = exportToName(key);
    if (spelled !== icon.name) group.aliases.push(spelled);
    groups.set(drawing, group);
  }
  const words = sectionWords();
  const entries: IconEntry[] = [];
  for (const { icons, aliases } of groups.values()) {
    const sorted = [...icons].sort(
      (a, b) =>
        Number(words.has(b.name)) - Number(words.has(a.name)) ||
        a.name.length - b.name.length ||
        a.name.localeCompare(b.name),
    );
    const [first, ...others] = sorted;
    if (!first) continue;
    const keywords = new Set<string>([
      ...others.flatMap((o) => o.name.split("-")),
      ...aliases.flatMap((a) => a.split("-")),
      ...(words.get(first.name) ?? []),
    ]);
    for (const w of first.name.split("-")) keywords.delete(w);
    entries.push({ name: first.name, icon: first, keywords: [...keywords] });
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return { entries, byName };
}

let loaded: IconCatalog | null = null;
let loading: Promise<IconCatalog> | null = null;
const listeners = new Set<() => void>();

/** Loads every icon once (one chunk, shared by every picker); later calls get the same promise. */
export function loadIconCatalog(): Promise<IconCatalog> {
  loading ??= import("./icon-picker-all").then((module) => {
    loaded = buildCatalog(module as unknown as Record<string, unknown>);
    for (const listener of listeners) listener();
    return loaded;
  });
  return loading;
}

/** For `useSyncExternalStore`: the catalog once loaded, `null` before. */
export const catalogStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => loaded,
  getServer: () => null,
};

/** The drawing of a name: from the common set at once, from the catalog once loaded. */
export function findIcon(name: string, catalog: IconCatalog | null): PixelIcon | undefined {
  return common().get(name) ?? catalog?.byName.get(name);
}

/** The common set and the curated names, before the catalog is there: what search can offer. */
export function provisionalEntries(): IconEntry[] {
  const words = sectionWords();
  return [...common().values()].map((icon) => ({
    name: icon.name,
    icon,
    keywords: words.get(icon.name) ?? [],
  }));
}

/* ---------------------------------------------------------------- search */

function termScore(entry: IconEntry, term: string): number {
  const words = entry.name.split("-");
  if (entry.name === term) return 100;
  if (entry.name.startsWith(term)) return 70;
  if (words.includes(term)) return 60;
  if (words.some((w) => w.startsWith(term))) return 50;
  if (entry.name.includes(term)) return 40;
  if (entry.keywords.includes(term)) return 30;
  if (entry.keywords.some((k) => k.startsWith(term))) return 20;
  const targets = SYNONYMS[term];
  if (targets?.some((t) => entry.name.includes(t))) return 15;
  return 0;
}

/**
 * The entries a search keeps, best first. Every word must match the name, a keyword (another name
 * of the drawing, a section) or a synonym; `-` and spaces both separate words.
 */
export function searchIcons(entries: ReadonlyArray<IconEntry>, query: string): IconEntry[] {
  const terms = query
    .toLowerCase()
    .trim()
    .split(/[\s,_-]+/)
    .filter(Boolean);
  if (terms.length === 0) return [...entries];
  const whole = terms.join("-");
  const scored: { entry: IconEntry; score: number }[] = [];
  for (const entry of entries) {
    let total = entry.name === whole ? 200 : entry.name.startsWith(whole) ? 80 : 0;
    for (const term of terms) {
      const score = termScore(entry, term);
      if (score === 0) {
        total = 0;
        break;
      }
      total += score;
    }
    if (total > 0) scored.push({ entry, score: total });
  }
  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.entry.name.length - b.entry.name.length ||
        a.entry.name.localeCompare(b.entry.name),
    )
    .map((s) => s.entry);
}
