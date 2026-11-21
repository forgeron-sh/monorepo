// The store in React: created once per editor, shared with the chrome (zoom controls, minimap,
// inspectors) through a context, read through selectors so a pan does not render every item.

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CanvasState } from "../core/engine";
import { createCanvasStore, type CanvasStore, type CanvasStoreOptions } from "../core/store";
import type { Bounds } from "../core/types";
import { cullWindow, type CullWindow } from "../core/viewport";

const CanvasContext = createContext<CanvasStore<unknown> | null>(null);

/** Creates the store of an editor on first render and keeps it; later options are ignored. */
export function useCanvasStore<D = unknown>(options?: CanvasStoreOptions<D>): CanvasStore<D> {
  const [store] = useState(() => createCanvasStore<D>(options));
  return store;
}

/** Shares a store with everything inside: `<Canvas>` does it for its children already. */
export function CanvasProvider<D>({
  store,
  children,
}: {
  store: CanvasStore<D>;
  children?: ReactNode;
}) {
  return (
    <CanvasContext.Provider value={store as CanvasStore<unknown>}>
      {children}
    </CanvasContext.Provider>
  );
}

/** The store of the nearest `<Canvas>` or `<CanvasProvider>`. */
export function useCanvasContext<D = unknown>(): CanvasStore<D> {
  const store = useContext(CanvasContext);
  if (!store) throw new Error("useCanvas: no <Canvas> or <CanvasProvider> above this component.");
  return store as CanvasStore<D>;
}

/**
 * A slice of the state, re-rendering only when it changes (`Object.is`). Pass a selector that
 * returns a value already in the state, or a primitive.
 */
export function useCanvasState<D, T>(
  store: CanvasStore<D>,
  select: (state: CanvasState<D>) => T,
): T {
  const get = useCallback(() => select(store.getState()), [store, select]);
  return useSyncExternalStore(store.subscribe, get, get);
}

/**
 * The world rectangle to render (`cullWindow`): the view plus `overscan` to twice `overscan` screen
 * pixels around it. It is the same object while a pan or a zoom stays inside it, so a component
 * that culls by it re-renders when the window moves, not at every step. Null before the surface has
 * a size: render everything.
 */
export function useCullWindow<D>(store: CanvasStore<D>, overscan = 256): Bounds | null {
  const last = useRef<CullWindow | null>(null);
  const get = useCallback(() => {
    const s = store.getState();
    last.current = cullWindow(last.current, s.viewport, s.size, overscan);
    return last.current?.rect ?? null;
  }, [store, overscan]);
  return useSyncExternalStore(store.subscribe, get, get);
}

export interface UseCanvas<D> {
  store: CanvasStore<D>;
  items: CanvasState<D>["items"];
  selection: CanvasState<D>["selection"];
  viewport: CanvasState<D>["viewport"];
  tool: string;
  connection: CanvasState<D>["connection"];
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * The canvas around this component: its store (every command: `store.undo()`, `store.fitView()`,
 * `store.select()`…) and the state the chrome shows. Re-renders on every change; a component that
 * needs one value reads it with `useCanvasState`.
 */
export function useCanvas<D = unknown>(): UseCanvas<D> {
  const store = useCanvasContext<D>();
  const state = useCanvasState(store, (s) => s);
  return {
    store,
    items: state.items,
    selection: state.selection,
    viewport: state.viewport,
    tool: state.tool,
    connection: state.connection,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
  };
}
