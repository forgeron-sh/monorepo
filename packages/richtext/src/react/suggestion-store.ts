// A tiny store between Tiptap's suggestion plugin (which calls `onStart`, `onUpdate`, `onKeyDown`,
// `onExit`) and a React list: the plugin writes, the list reads with `useSyncExternalStore`.
// Slash commands and mentions share it.

import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";

export interface SuggestionState<T> {
  items: T[];
  /** The highlighted row. */
  index: number;
  query: string;
  /** Where the trigger character is, in viewport pixels; `null` when it cannot be measured. */
  rect: DOMRect | null;
  pick: (item: T) => void;
}

export interface SuggestionStore<T> {
  get(): SuggestionState<T> | null;
  subscribe(listener: () => void): () => void;
  setIndex(index: number): void;
  /** Passed to the Tiptap extension as its `render`. */
  render: () => {
    onStart: (props: SuggestionProps<T, T>) => void;
    onUpdate: (props: SuggestionProps<T, T>) => void;
    onKeyDown: (props: SuggestionKeyDownProps) => boolean;
    onExit: () => void;
  };
}

export function createSuggestionStore<T>(): SuggestionStore<T> {
  let state: SuggestionState<T> | null = null;
  const listeners = new Set<() => void>();
  const set = (next: SuggestionState<T> | null) => {
    state = next;
    for (const l of listeners) l();
  };
  const from = (props: SuggestionProps<T, T>, index: number): SuggestionState<T> => ({
    items: props.items,
    index: Math.min(index, Math.max(0, props.items.length - 1)),
    query: props.query,
    rect: props.clientRect?.() ?? null,
    pick: (item) => props.command(item),
  });
  return {
    get: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setIndex(index) {
      if (state) set({ ...state, index });
    },
    render: () => ({
      onStart: (props) => set(from(props, 0)),
      onUpdate: (props) => set(from(props, props.query === state?.query ? (state?.index ?? 0) : 0)),
      onKeyDown: ({ event }) => {
        if (!state || state.items.length === 0) return false;
        const count = state.items.length;
        if (event.key === "ArrowDown") {
          set({ ...state, index: (state.index + 1) % count });
          return true;
        }
        if (event.key === "ArrowUp") {
          set({ ...state, index: (state.index - 1 + count) % count });
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          const item = state.items[state.index];
          if (item) state.pick(item);
          return true;
        }
        return false;
      },
      onExit: () => set(null),
    }),
  };
}
