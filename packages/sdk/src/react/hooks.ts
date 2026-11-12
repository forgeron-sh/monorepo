import { useCallback, useMemo, useState, useRef, useEffect, useSyncExternalStore } from "react";
import type { z } from "zod";
import type { User } from "../context";
import { toError } from "./client";
import type { ChannelState } from "./realtime";
import { useViewContext } from "./view";

export interface UseActionOptions {
  /** Re-reads every that many milliseconds while the component is mounted. */
  refresh?: number;
  /**
   * Re-reads when anything is published on these channels (D-135): `live: "notes"`. The read goes through
   * the action again, so each person still gets what their own access allows, whatever was published.
   */
  live?: string | readonly string[];
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
  const { runtime } = useViewContext("useAction");
  const liveKey = options.live === undefined ? "" : JSON.stringify(options.live);
  useEffect(() => {
    const channels = liveKey
      ? ([] as string[]).concat(JSON.parse(liveKey) as string | string[])
      : [];
    const connection = runtime.realtime;
    if (channels.length === 0 || !connection) return;
    // A burst of messages is one read.
    let pending: ReturnType<typeof setTimeout> | undefined;
    const reread = () => {
      clearTimeout(pending);
      pending = setTimeout(() => entry.invalidate(), 60);
    };
    const stops = channels.map((channel) => connection.channel(channel).onMessage(reread));
    return () => {
      clearTimeout(pending);
      for (const stop of stops) stop();
    };
  }, [runtime, entry, liveKey]);
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

/** To disable the control of an action: whether the person may call it, as the console's matrix says. The server checks anyway. */
export function useCanCall(action: string): boolean {
  return useViewContext("useCanCall").runtime.canCall(action);
}

/** To disable a control: the server checks the access level anyway. */
export function useCan(level: string): boolean {
  return useViewContext("useCan").runtime.can(level);
}

export interface UseChannelResult extends ChannelState {
  /** Sends the others on the channel a message (the tool must let pages send on it). */
  send(event: string, payload?: unknown, options?: { self?: boolean }): void;
  /** Tells the others something about you on the channel. */
  track(state: unknown): void;
  /** The last message, if any. */
  last: ChannelState["messages"][number] | undefined;
}

const NOTHING: ChannelState = { status: "closed", messages: [], presence: [] };
const IDLE = { subscribe: () => () => {}, getSnapshot: () => NOTHING };

/**
 * Listens to a channel of the tool (D-135): the messages its actions publish and the pages send, and who is
 * on it. `undefined` listens to nothing (a channel that depends on something not loaded yet). The person
 * is let in only if the tool says so; otherwise `status` is `denied` and `reason` says why.
 */
export function useChannel(name: string | undefined): UseChannelResult {
  const { runtime } = useViewContext("useChannel");
  const handle = useMemo(
    () => (name && runtime.realtime ? runtime.realtime.channel(name) : undefined),
    [runtime, name],
  );
  const source = handle ?? IDLE;
  const state = useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
  return {
    ...state,
    last: state.messages.at(-1),
    send: (event, payload, options) => handle?.send(event, payload, options),
    track: (value) => handle?.track(value),
  };
}
