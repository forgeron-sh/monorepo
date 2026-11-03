import { useCallback, useEffect, useState } from "react";

export interface Loaded<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  /** Asks again; the data already shown stays until the answer comes. */
  reload: () => void;
}

/** Runs `load` on mount and whenever `deps` change; drops an answer that arrives after the screen moved on. */
export function useLoad<T>(load: () => Promise<T>, deps: ReadonlyArray<unknown>): Loaded<T> {
  const [state, setState] = useState<{ data?: T; error?: unknown; loading: boolean }>({
    loading: true,
  });
  const [tick, setTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);
  useEffect(() => {
    let live = true;
    run().then(
      (data) => live && setState({ data, loading: false }),
      (error: unknown) => live && setState((s) => ({ data: s.data, error, loading: false })),
    );
    return () => {
      live = false;
    };
  }, [run, tick]);
  const reload = useCallback(() => {
    setState((s) => ({ ...s, error: undefined, loading: s.data === undefined }));
    setTick((n) => n + 1);
  }, []);
  return { data: state.data, error: state.error, loading: state.loading, reload };
}
