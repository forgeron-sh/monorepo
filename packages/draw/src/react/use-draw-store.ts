// The store of a board in React: created once, on the draw engine.

import { useState } from "react";
import { createDrawStore, type DrawEngineOptions, type DrawStore } from "../core/engine";

/** Creates the store of a board on first render and keeps it; later options are ignored. */
export function useDrawStore(options?: DrawEngineOptions): DrawStore {
  const [store] = useState(() => createDrawStore(options));
  return store;
}
