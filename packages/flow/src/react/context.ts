// The React context that hands the editor's context to what is mounted inside <FlowCanvas>
// (<FlowToolbar> reads it), and how a context is made.

import { createContext } from "react";
import type { EditorRegistry, FlowEditorContext, FlowView, Refusal } from "./plugin";
import type { FlowApi } from "./use-flow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FlowEditorReactContext = createContext<FlowEditorContext<any> | null>(null);

/**
 * The context of one editor: stable for a flow and a plugin list. `view()` returns the view the
 * host last committed (`setView`), for a handler's use, not a render's.
 */
export function makeContext<D>(
  flow: FlowApi<D>,
  registry: EditorRegistry<D>,
  /** What the plugins keep per editor; shared by the contexts of one editor. */
  locals = new Map<string, unknown>(),
): { ctx: FlowEditorContext<D>; setView: (view: FlowView<D>) => void } {
  let current: FlowView<D> | null = null;
  let refusal: Refusal | null = null;
  const listeners = new Set<() => void>();
  return {
    setView: (view) => {
      current = view;
    },
    ctx: {
      flow,
      registry,
      core: registry.core,
      refusal: {
        get: () => refusal,
        set: (next) => {
          if (
            next === refusal ||
            (next && refusal && next.reason === refusal.reason && next.from === refusal.from)
          )
            return;
          refusal = next;
          for (const l of listeners) l();
        },
        subscribe: (l) => {
          listeners.add(l);
          return () => void listeners.delete(l);
        },
      },
      view: () => {
        if (!current) throw new Error("The view is only known inside <FlowCanvas>.");
        return current;
      },
      local: <T>(pluginId: string, init: () => T) => {
        if (!locals.has(pluginId)) locals.set(pluginId, init());
        return locals.get(pluginId) as T;
      },
    },
  };
}
