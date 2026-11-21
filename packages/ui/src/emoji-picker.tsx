// Emoji. The glyphs are user content (a reaction is written by a person, like the text of a
// message), the one place of the library where they are allowed; the controls around them are the
// usual pixel icons. Search, categories, recents, arrow keys. With `onSelect`, `EmojiPicker` is
// the props-driven picker; without, the root of its parts (`EmojiPickerSearch`, `EmojiPickerTabs`,
// `EmojiPickerGrid`), which it is built from (D-157).

import { Search01Icon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { cx } from "./cx";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export interface EmojiEntry {
  char: string;
  name: string;
  keywords?: string;
}
export interface EmojiCategory {
  id: string;
  label: string;
  /** Shown on the category button. */
  mark: string;
  emoji: ReadonlyArray<EmojiEntry>;
}

// Emoji glyphs are allowed here and nowhere else in the library: a reaction is something a person
// writes, like the text of a message, not an icon of the interface (which stay pixel icons). A small
// set stands in for the whole list; pass `categories` to `EmojiPicker` to bring your own.
export const CONVERSATION_EMOJI: ReadonlyArray<EmojiCategory> = [
  {
    id: "faces",
    label: "Faces",
    mark: "🙂",
    emoji: [
      { char: "🙂", name: "smile", keywords: "happy slight" },
      { char: "😀", name: "grin", keywords: "happy" },
      { char: "😂", name: "joy", keywords: "laugh lol tears" },
      { char: "😉", name: "wink" },
      { char: "😍", name: "heart eyes", keywords: "love" },
      { char: "😎", name: "cool", keywords: "sunglasses" },
      { char: "🤔", name: "thinking", keywords: "hmm" },
      { char: "😅", name: "sweat smile", keywords: "relief" },
      { char: "😢", name: "cry", keywords: "sad" },
      { char: "😮", name: "surprised", keywords: "wow open mouth" },
      { char: "😴", name: "sleeping", keywords: "tired" },
      { char: "😡", name: "angry", keywords: "mad" },
      { char: "🥳", name: "party", keywords: "celebrate" },
      { char: "🙃", name: "upside down" },
    ],
  },
  {
    id: "gestures",
    label: "Gestures",
    mark: "👍",
    emoji: [
      { char: "👍", name: "thumbs up", keywords: "yes ok approve +1" },
      { char: "👎", name: "thumbs down", keywords: "no -1" },
      { char: "👏", name: "clap", keywords: "bravo" },
      { char: "🙌", name: "raised hands", keywords: "hooray" },
      { char: "🙏", name: "pray", keywords: "thanks please" },
      { char: "👋", name: "wave", keywords: "hello bye" },
      { char: "💪", name: "strong", keywords: "muscle" },
      { char: "👀", name: "eyes", keywords: "look seen" },
      { char: "🤝", name: "handshake", keywords: "deal" },
      { char: "✌️", name: "victory", keywords: "peace" },
      { char: "👌", name: "ok hand" },
      { char: "🤞", name: "fingers crossed", keywords: "luck" },
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    mark: "❤️",
    emoji: [
      { char: "❤️", name: "heart", keywords: "love red" },
      { char: "🔥", name: "fire", keywords: "hot lit" },
      { char: "✅", name: "check", keywords: "done yes" },
      { char: "❌", name: "cross", keywords: "no wrong" },
      { char: "⚠️", name: "warning", keywords: "careful" },
      { char: "❓", name: "question" },
      { char: "❗", name: "exclamation", keywords: "important" },
      { char: "💯", name: "hundred", keywords: "perfect" },
      { char: "⭐", name: "star" },
      { char: "✨", name: "sparkles", keywords: "new" },
      { char: "🎉", name: "tada", keywords: "party congrats" },
      { char: "🚀", name: "rocket", keywords: "ship launch" },
    ],
  },
  {
    id: "objects",
    label: "Objects",
    mark: "💡",
    emoji: [
      { char: "💡", name: "idea", keywords: "light bulb" },
      { char: "📌", name: "pin", keywords: "pushpin" },
      { char: "📎", name: "paperclip", keywords: "attachment" },
      { char: "📝", name: "memo", keywords: "note write" },
      { char: "📅", name: "calendar", keywords: "date" },
      { char: "🔒", name: "lock", keywords: "secure" },
      { char: "🔑", name: "key" },
      { char: "🐛", name: "bug", keywords: "defect" },
      { char: "🔧", name: "wrench", keywords: "fix tool" },
      { char: "📦", name: "package", keywords: "box release" },
      { char: "💬", name: "speech", keywords: "comment chat" },
      { char: "⏰", name: "alarm", keywords: "clock time" },
    ],
  },
  {
    id: "nature",
    label: "Nature and food",
    mark: "☕",
    emoji: [
      { char: "☕", name: "coffee", keywords: "tea break" },
      { char: "🍕", name: "pizza", keywords: "lunch" },
      { char: "🍪", name: "cookie" },
      { char: "🍺", name: "beer", keywords: "drink" },
      { char: "🌱", name: "seedling", keywords: "grow plant" },
      { char: "🌞", name: "sun", keywords: "sunny" },
      { char: "🌧️", name: "rain" },
      { char: "🐢", name: "turtle", keywords: "slow" },
      { char: "🦄", name: "unicorn" },
      { char: "🐱", name: "cat" },
    ],
  },
];

/** Entries whose name or keywords hold the query, names that start with it first. */
export function searchConversationEmoji(
  query: string,
  categories: ReadonlyArray<EmojiCategory> = CONVERSATION_EMOJI,
): EmojiEntry[] {
  const q = fold(query.trim());
  if (q === "") return [];
  const hits: Array<[number, EmojiEntry]> = [];
  for (const category of categories) {
    for (const entry of category.emoji) {
      const name = fold(entry.name);
      if (name.startsWith(q)) hits.push([0, entry]);
      else if (name.includes(q)) hits.push([1, entry]);
      else if (fold(entry.keywords ?? "").includes(q)) hits.push([2, entry]);
    }
  }
  return hits.sort((a, b) => a[0] - b[0]).map((h) => h[1]);
}

/** The recents with `emoji` first and no repeat, kept to `max`. */
export function pushRecentEmoji(recents: ReadonlyArray<string>, emoji: string, max = 16): string[] {
  return [emoji, ...recents.filter((e) => e !== emoji)].slice(0, max);
}

/** The name of a character in a category set, or the character itself. */
export function conversationEmojiName(
  emoji: string,
  categories: ReadonlyArray<EmojiCategory> = CONVERSATION_EMOJI,
): string {
  for (const category of categories) {
    const found = category.emoji.find((e) => e.char === emoji);
    if (found) return found.name;
  }
  return emoji;
}

export interface EmojiPickerProps {
  /** Called with the character chosen. */
  onSelect: (emoji: string) => void;
  /** Your own set, in place of the built-in one. */
  categories?: ReadonlyArray<EmojiCategory>;
  /** The latest chosen, newest first; the picker keeps them itself unless you do. */
  recents?: ReadonlyArray<string>;
  defaultRecents?: ReadonlyArray<string>;
  onRecentsChange?: (recents: string[]) => void;
  /** How many recents are kept. Default 16. */
  maxRecents?: number;
  /** Names the picker. Default "Emoji". */
  label?: string;
  /** Focuses the search box on mount (in a popup). */
  autoFocus?: boolean;
  /** Emoji per row. Default 8. */
  columns?: number;
  className?: string;
}

/** `onSelect` stays undefined: with it, `EmojiPicker` is the props-driven one. */
export type EmojiPickerRootProps = Omit<ComponentProps<"div">, "className" | "onSelect"> & {
  onSelect?: undefined;
  /** Called with the character chosen. */
  onEmojiSelect?: (emoji: string) => void;
  categories?: ReadonlyArray<EmojiCategory>;
  recents?: ReadonlyArray<string>;
  defaultRecents?: ReadonlyArray<string>;
  onRecentsChange?: (recents: string[]) => void;
  maxRecents?: number;
  /** Names the picker. Default "Emoji". */
  label?: string;
  columns?: number;
  className?: string;
};

const RECENT = "recent";

interface EmojiState {
  label: string;
  columns: number;
  query: string;
  setQuery: (query: string) => void;
  category: string;
  setCategory: (id: string) => void;
  active: number;
  setActive: (index: number) => void;
  searching: boolean;
  entries: ReadonlyArray<EmojiEntry>;
  tab: number;
  tabs: Array<{ id: string; label: string; mark: string }>;
  choose: (entry: EmojiEntry) => void;
}

const EmojiContext = createContext<EmojiState | null>(null);
/** The grid element, for the arrows that move the focus into it from the search box. */
const GridContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

/** Moves the focus to the emoji at `to` (kept inside the grid) and makes it the one in the tab order. */
function useFocusAt(e: EmojiState) {
  const grid = useContext(GridContext);
  return (to: number) => {
    const next = Math.max(0, Math.min(e.entries.length - 1, to));
    e.setActive(next);
    grid?.current?.querySelectorAll<HTMLElement>("[data-emoji]")[next]?.focus();
  };
}

function useEmoji(): EmojiState {
  const state = useContext(EmojiContext);
  if (!state) throw new Error("EmojiPicker parts go inside <EmojiPicker>.");
  return state;
}

/**
 * A search box, a row of categories, the recents and a grid you move through with the arrows.
 * With `onSelect`: the props-driven picker. Without: the root of the parts.
 */
export function EmojiPicker(props: EmojiPickerProps | EmojiPickerRootProps) {
  return props.onSelect !== undefined ? (
    <EmojiPickerBox {...(props as EmojiPickerProps)} />
  ) : (
    <EmojiPickerRoot {...(props as EmojiPickerRootProps)} />
  );
}

function EmojiPickerBox({ onSelect, autoFocus, ...rest }: EmojiPickerProps) {
  return (
    <EmojiPickerRoot onEmojiSelect={onSelect} {...rest}>
      <EmojiPickerSearch autoFocus={autoFocus} />
      <EmojiPickerTabs />
      <EmojiPickerGrid />
    </EmojiPickerRoot>
  );
}

function EmojiPickerRoot({
  onSelect: _onSelect,
  onEmojiSelect,
  categories = CONVERSATION_EMOJI,
  recents,
  defaultRecents = [],
  onRecentsChange,
  maxRecents = 16,
  label = "Emoji",
  columns = 8,
  className,
  children,
  ...rest
}: EmojiPickerRootProps) {
  const [recent, setRecent] = useControllableState<ReadonlyArray<string>>({
    value: recents,
    defaultValue: defaultRecents,
    onChange: (next) => onRecentsChange?.([...next]),
  });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(recent.length > 0 ? RECENT : categories[0]!.id);
  const [active, setActive] = useState(0);
  const grid = useRef<HTMLDivElement>(null);

  const recentEntries = useMemo<EmojiEntry[]>(
    () => recent.map((char) => ({ char, name: conversationEmojiName(char, categories) })),
    [recent, categories],
  );
  const searching = query.trim() !== "";
  const entries: ReadonlyArray<EmojiEntry> = searching
    ? searchConversationEmoji(query, categories)
    : category === RECENT
      ? recentEntries
      : (categories.find((c) => c.id === category)?.emoji ?? []);
  const tab = Math.min(active, Math.max(entries.length - 1, 0));
  const tabs: Array<{ id: string; label: string; mark: string }> = [
    ...(recent.length > 0 ? [{ id: RECENT, label: "Recent", mark: "🕘" }] : []),
    ...categories,
  ];

  const state: EmojiState = {
    label,
    columns,
    query,
    setQuery: (q) => {
      setQuery(q);
      setActive(0);
    },
    category,
    setCategory: (id) => {
      setCategory(id);
      setActive(0);
    },
    active,
    setActive,
    searching,
    entries,
    tab,
    tabs,
    choose: (entry) => {
      setRecent(pushRecentEmoji(recent, entry.char, maxRecents));
      onEmojiSelect?.(entry.char);
    },
  };

  return (
    <EmojiContext.Provider value={state}>
      <GridContext.Provider value={grid}>
        <div
          data-slot="emoji-picker"
          {...rest}
          className={cx("fg-conv-emoji", className)}
          role="group"
          aria-label={label}
        >
          {children}
        </div>
      </GridContext.Provider>
    </EmojiContext.Provider>
  );
}

export interface EmojiPickerSearchProps extends Omit<
  ComponentProps<"div">,
  "className" | "children" | "placeholder"
> {
  /** Focuses the search box on mount (in a popup). */
  autoFocus?: boolean | undefined;
  placeholder?: string;
  className?: string;
}

/** The search box; the arrow down moves into the grid. */
export function EmojiPickerSearch({
  autoFocus,
  placeholder = "Search",
  className,
  ...rest
}: EmojiPickerSearchProps) {
  const e = useEmoji();
  const focusAt = useFocusAt(e);
  return (
    <div
      data-slot="emoji-picker-search"
      {...rest}
      className={cx("fg-conv-emoji-search", className)}
    >
      <Icon icon={Search01Icon} size={12} variant="mono" />
      <input
        type="search"
        className="fg-conv-emoji-input"
        aria-label={`Search ${e.label.toLowerCase()}`}
        placeholder={placeholder}
        value={e.query}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        onChange={(event) => e.setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && e.entries.length > 0) {
            event.preventDefault();
            focusAt(0);
          }
        }}
      />
    </div>
  );
}

/** The row of categories (and Recent once something was chosen); hidden while searching. */
export function EmojiPickerTabs({ className, ...rest }: Omit<ComponentProps<"div">, "children">) {
  const e = useEmoji();
  if (e.searching) return null;
  return (
    <div
      role="group"
      aria-label="Categories"
      data-slot="emoji-picker-tabs"
      {...rest}
      className={cx("fg-conv-emoji-tabs", className)}
    >
      {e.tabs.map((tabItem) => (
        <button
          key={tabItem.id}
          type="button"
          className="fg-conv-emoji-tab"
          aria-pressed={e.category === tabItem.id}
          aria-label={tabItem.label}
          title={tabItem.label}
          onClick={() => e.setCategory(tabItem.id)}
        >
          {tabItem.mark}
        </button>
      ))}
    </div>
  );
}

/** The emoji of the category or of the search, moved through with the arrows. */
export function EmojiPickerGrid({
  className,
  style,
  onKeyDown,
  ...rest
}: Omit<ComponentProps<"div">, "children">) {
  const e = useEmoji();
  const grid = useContext(GridContext);
  const focusAt = useFocusAt(e);
  const onKey = (event: KeyboardEvent) => {
    const step: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: e.columns,
      ArrowUp: -e.columns,
    };
    if (event.key in step) focusAt(e.tab + step[event.key]!);
    else if (event.key === "Home") focusAt(0);
    else if (event.key === "End") focusAt(e.entries.length - 1);
    else return;
    event.preventDefault();
  };
  return (
    <div
      role="group"
      aria-label={
        e.searching ? "Results" : (e.tabs.find((t) => t.id === e.category)?.label ?? e.label)
      }
      data-slot="emoji-picker-grid"
      {...rest}
      ref={grid}
      className={cx("fg-conv-emoji-grid", className)}
      style={{ gridTemplateColumns: `repeat(${e.columns}, 1fr)`, ...style }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) onKey(event);
      }}
    >
      {e.entries.map((entry, index) => (
        <button
          key={`${entry.char}-${index}`}
          type="button"
          data-emoji=""
          className="fg-conv-emoji-cell"
          tabIndex={index === e.tab ? 0 : -1}
          aria-label={entry.name}
          title={entry.name}
          onClick={() => e.choose(entry)}
          onFocus={() => e.setActive(index)}
        >
          {entry.char}
        </button>
      ))}
      {e.entries.length === 0 ? (
        <p className="fg-conv-emoji-empty">
          {e.searching ? "No emoji found." : "Nothing here yet."}
        </p>
      ) : null}
    </div>
  );
}
