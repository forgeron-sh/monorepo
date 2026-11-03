import { useCallback, useMemo, useState, useRef, useEffect, useSyncExternalStore } from "react";
import type { z } from "zod";
import type { User } from "../context";
import { toError } from "./client";
import { useViewContext } from "./view";

export interface UseActionOptions {
  /** Re-reads every that many milliseconds while the component is mounted. */
  refresh?: number;
}

export interface UseActionResult<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  refetch(): Promise<void>;
}

/** Calls a read action and keeps its result; shared by components reading the same input. */
export function useAction<Output = unknown>(
  name: string,
  input: Record<string, unknown> = {},
  options: UseActionOptions = {},
): UseActionResult<Output> {
  const { client } = useViewContext("useAction");
  const key = JSON.stringify(input);
  // The input is compared by value: a new object with the same content is the same read.
  // oxlint-disable-next-line react/exhaustive-deps -- `key` stands for `input`
  const entry = useMemo(() => client.read(name, input), [client, name, key]);
  const refresh = options.refresh;
  const subscribe = useCallback(
    (listener: () => void) => entry.subscribe(listener, refresh),
    [entry, refresh],
  );
  const state = useSyncExternalStore(subscribe, entry.getSnapshot, entry.getSnapshot);
  return {
    data: state.data as Output | undefined,
    error: state.error,
    loading: state.loading,
    refetch: entry.refetch,
  };
}

export interface UseMutationResult<Input, Output> {
  /** Resolves with the output; rejects with the error, also exposed as `error`. */
  run(input: Input): Promise<Output>;
  loading: boolean;
  error: Error | undefined;
}

/** Calls a write action, then re-reads the reads of the same group (`deals.*`). */
export function useMutation<Input = Record<string, unknown>, Output = unknown>(
  name: string,
): UseMutationResult<Input, Output> {
  const { client } = useViewContext("useMutation");
  const [state, setState] = useState<{ loading: boolean; error: Error | undefined }>({
    loading: false,
    error: undefined,
  });
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const run = useCallback(
    async (input: Input): Promise<Output> => {
      setState({ loading: true, error: undefined });
      try {
        const result = (await client.write(name, input)) as Output;
        if (mounted.current) setState({ loading: false, error: undefined });
        return result;
      } catch (error) {
        const failure = toError(error);
        if (mounted.current) setState({ loading: false, error: failure });
        throw failure;
      }
    },
    [client, name],
  );
  return { run, loading: state.loading, error: state.error };
}

function serialize(values: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue;
    out[key] = typeof value === "string" ? value : String(value);
  }
  return out;
}

/** The URL parameters, validated by the view's `params`, and a setter that validates too. */
export function useParams<Values = Record<string, string>>(): [
  Values,
  (next: Partial<Values> | ((current: Values) => Values)) => void,
] {
  const { runtime, schema } = useViewContext("useParams");
  const raw = useSyncExternalStore(
    runtime.params.subscribe,
    () => JSON.stringify(runtime.params.get()),
    () => JSON.stringify(runtime.params.get()),
  );
  const values = useMemo(() => {
    const record = JSON.parse(raw) as Record<string, string>;
    return (schema ? schema.parse(record) : record) as Values;
  }, [raw, schema]);
  const setValues = useCallback(
    (next: Partial<Values> | ((current: Values) => Values)) => {
      const current = (
        schema ? schema.parse(runtime.params.get()) : runtime.params.get()
      ) as Values;
      const merged = typeof next === "function" ? next(current) : { ...current, ...next };
      const checked = (schema ? (schema as z.ZodType).parse(merged) : merged) as Record<
        string,
        unknown
      >;
      runtime.params.set(serialize(checked));
    },
    [runtime, schema],
  );
  return [values, setValues];
}

/** The signed-in person and their roles. */
export function useUser(): User {
  return useViewContext("useUser").runtime.user;
}

/** To disable a control: the server checks the access level anyway. */
export function useCan(level: string): boolean {
  return useViewContext("useCan").runtime.can(level);
}
