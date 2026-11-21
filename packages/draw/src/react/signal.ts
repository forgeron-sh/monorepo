// A value that changes many times a second while a tool runs (the pen's points, what the eraser
// will remove, the item an arrow will bind to). Previews read it on their own, so a pointer move
// does not render the whole canvas.

import { useSyncExternalStore } from "react";

export interface Signal<T> {
  get(): T;
  set(value: T): void;
  subscribe(listener: () => void): () => void;
}

export function createSignal<T>(initial: T): Signal<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next) {
      if (Object.is(next, value)) return;
      value = next;
      for (const l of [...listeners]) l();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useSignal<T>(signal: Signal<T>): T {
  return useSyncExternalStore(signal.subscribe, signal.get, signal.get);
}

/**
 * What an editor's tools and handlers read when they run, outside of rendering: the style new
 * items take, the item whose text is being typed, the counter of merge keys.
 */
export interface Session<Style, Editing> {
  style(): Style;
  setStyle(style: Style): void;
  editing(): Editing | null;
  setEditing(editing: Editing | null): void;
  /** A new key that merges an add and the typing after it into one undo step. */
  nextKey(): string;
}

export function createSession<Style, Editing>(initial: Style): Session<Style, Editing> {
  let style = initial;
  let editing: Editing | null = null;
  let seq = 0;
  return {
    style: () => style,
    setStyle: (next) => {
      style = next;
    },
    editing: () => editing,
    setEditing: (next) => {
      editing = next;
    },
    nextKey: () => `edit:${++seq}`,
  };
}
