// The store of a board in React: created once, on the draw engine, with the plugins it is given.

import { useState } from "react";
import { createDrawStore, type DrawEngineOptions, type DrawStore } from "../core/engine";
import type { DrawPlugin } from "../core/plugin";
import type { EditorPlugin } from "./plugin";

export interface UseDrawStoreOptions extends Omit<DrawEngineOptions, "plugins"> {
  /** The plugins of the editor, as editor halves or core halves; the `full` preset by default. */
  plugins?: ReadonlyArray<EditorPlugin | DrawPlugin>;
}

const coreOf = (p: EditorPlugin | DrawPlugin): DrawPlugin => ("core" in p ? p.core : p);

/** Creates the store of a board on first render and keeps it; later options are ignored. */
export function useDrawStore(options?: UseDrawStoreOptions): DrawStore {
  const [store] = useState(() => {
    const { plugins, ...rest } = options ?? {};
    return createDrawStore({ ...rest, ...(plugins ? { plugins: plugins.map(coreOf) } : {}) });
  });
  return store;
}
