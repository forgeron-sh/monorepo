// Dates, editor half: `!` opens shortcuts (`!today`, `!tomorrow`, `!friday`, `!+3`, a typed
// `2026-12-01`) and a "Pick a date" row that opens a small calendar panel. Picking inserts a chip of
// the kind `date`: id `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`, label from the app's `format`.
//
// This file loads no React (the schema is built on a server): the panel itself, made of the
// Calendar and TimePicker of `@forgeron/ui`, is the interface plugin `datesPanel` of the `react/`
// layer, which draws what this plugin opens, like `bubble` draws the toolbar of the marks.

import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import {
  type DateParts,
  type DatesCoreOptions,
  dateId,
  dateShortcut,
  datesPlugin,
  defaultDateLabel,
  parseDateId,
  toDateString,
} from "../dates";
import { defineEditorPlugin, defineSuggestion } from "../../tiptap/plugin";
import { allowChips, chipClasses, insertReference } from "./references-kit";

export interface DatesOptions extends DatesCoreOptions {
  /** The text a chip shows for a day (and time): `Nov 20, 2026`, `20 novembre`. Default: the ISO form. */
  format?: (parts: DateParts) => string;
  /** The clock for `!today` and the calendar: a server time, or a test's. Default `new Date()`. */
  today?: () => Date;
  /** The menu's accessible name. Default `Insert a date`. */
  label?: string;
  /** The names of the menu rows, to translate them. Default: English. */
  words?: Partial<Record<"today" | "tomorrow" | "yesterday" | "nextWeek" | "pick", string>>;
}

interface DateItem {
  key: string;
  label: string;
  hint?: string;
  parts?: DateParts;
  pick?: true;
}

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/* ------------------------------------------------------------------ The panel's state */

/** What the panel needs to draw itself and to insert, given by the plugin that opened it. */
export interface DatesPanelState {
  /** Where the chip goes, kept up to date while the document changes. */
  pos: number;
  rect: { left: number; right: number; top: number; bottom: number };
  /** A new panel, so its fields start over. */
  id: number;
  /** Today, `YYYY-MM-DD`. */
  today: string;
  format: (parts: DateParts) => string;
  /** The panel's accessible name. */
  title: string;
}

export interface DatesPanelStore {
  get(): DatesPanelState | null;
  subscribe(listener: () => void): () => void;
  open(state: Omit<DatesPanelState, "id">): void;
  close(): void;
  /** Follows the document: the position of the chip moves with the edits. */
  map(tr: Transaction): void;
}

const panels = new WeakMap<Editor, DatesPanelStore>();
let panelCount = 0;

/** The state of the date panel of an editor, shared by the plugin that opens it and the one that draws it. */
export function datesPanelFor(editor: Editor): DatesPanelStore {
  const known = panels.get(editor);
  if (known) return known;
  let state: DatesPanelState | null = null;
  const listeners = new Set<() => void>();
  const set = (next: DatesPanelState | null) => {
    state = next;
    for (const l of listeners) l();
  };
  const store: DatesPanelStore = {
    get: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    open: (next) => set({ ...next, id: ++panelCount }),
    close: () => set(null),
    map(tr) {
      if (state && tr.docChanged) set({ ...state, pos: tr.mapping.map(state.pos) });
    },
  };
  panels.set(editor, store);
  return store;
}

function caretRect(editor: Editor, pos: number): DatesPanelState["rect"] {
  try {
    const { left, right, top, bottom } = editor.view.coordsAtPos(pos);
    return { left, right, top, bottom };
  } catch {
    return { left: 0, right: 0, top: 0, bottom: 0 };
  }
}

/* ------------------------------------------------------------------ The plugin */

/**
 * The editor half of the dates plugin. The same `isPast` goes to the core half the static view
 * uses: `datesPlugin({ isPast })`, which is what `.core` of this plugin is. List `datesPanel`
 * (from `@forgeron/richtext/react`) too, to get the calendar behind "Pick a date".
 */
export function datesEditor(options: DatesOptions = {}) {
  const now = () => options.today?.() ?? new Date();
  const todayIso = () => toDateString(now());
  const format = options.format ?? defaultDateLabel;
  const words = {
    today: "Today",
    tomorrow: "Tomorrow",
    yesterday: "Yesterday",
    nextWeek: "Next week",
    pick: "Pick a date…",
    ...options.words,
  };
  const core = datesPlugin(options.isPast ? { isPast: options.isPast } : {});
  const isPast = options.isPast;
  const named: ReadonlyArray<{ word: string; label: string }> = [
    { word: "today", label: words.today },
    { word: "tomorrow", label: words.tomorrow },
    { word: "yesterday", label: words.yesterday },
    { word: "nextweek", label: words.nextWeek },
    ...WEEKDAYS.map((w) => ({ word: w, label: cap(w) })),
  ];
  const headline = new Set(["today", "tomorrow", "nextweek"]);

  const items = (query: string): DateItem[] => {
    const today = todayIso();
    const q = query
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
    const out: DateItem[] = [];
    const seen = new Set<string>();
    const add = (item: DateItem) => {
      const id = item.parts ? dateId(item.parts) : item.key;
      if (seen.has(id)) return;
      seen.add(id);
      out.push(item);
    };
    for (const { word, label } of named) {
      if (q ? !word.startsWith(q) : !headline.has(word)) continue;
      const parts = dateShortcut(word, today);
      if (parts) add({ key: word, label, hint: format(parts), parts });
    }
    // `+3`, `-2`, `2026-12-01`, `2026-12-01T14:30`: what was typed, when it is a date.
    const typed = q ? dateShortcut(query, today) : undefined;
    if (typed) add({ key: `typed:${dateId(typed)}`, label: format(typed), parts: typed });
    if (!q || "pickadate".startsWith(q) || "pick".startsWith(q)) {
      add({ key: "pick", label: words.pick, pick: true });
    }
    return out;
  };

  return defineEditorPlugin({
    core,
    extensions: isPast
      ? [
          chipClasses("dates", "date", (ref) => {
            const parts = parseDateId(ref.id);
            return parts && isPast(parts) ? "fg-rt-past" : undefined;
          }),
        ]
      : [],
    suggestions: () => [
      defineSuggestion<DateItem>({
        id: "reference-date",
        char: "!",
        label: options.label ?? "Insert a date",
        empty: "Not a date",
        items,
        present: (item) => ({
          key: item.key,
          label: item.label,
          ...(item.hint ? { hint: item.hint } : {}),
        }),
        allow: allowChips,
        command: ({ editor, range, item }) => {
          if (item.pick) {
            editor.chain().focus().deleteRange(range).run();
            datesPanelFor(editor).open({
              pos: range.from,
              rect: caretRect(editor, range.from),
              today: todayIso(),
              format,
              title: words.pick.replace(/…$/, ""),
            });
            return;
          }
          if (!item.parts) return;
          insertReference(editor, range, {
            kind: "date",
            id: dateId(item.parts),
            label: format(item.parts),
          });
        },
      }),
    ],
  });
}
