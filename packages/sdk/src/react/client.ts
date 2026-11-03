// The browser side of the runtime protocol: what the hooks talk to. The page host (served by the
// tool's Worker, FOR-56) builds a `ViewRuntime` from the token it injects; tests build their own.
import type { User } from "../context";

/** The URL search parameters of the page, as the browser sees them. */
export interface ViewParamsStore {
  get(): Record<string, string>;
  set(next: Record<string, string>): void;
  subscribe(listener: () => void): () => void;
}

export interface ViewRuntime {
  user: User;
  /** Whether the person holds an access level; only used to disable controls. */
  can(level: string): boolean;
  /** Whether the person may call an action, the console's matrix included; to disable controls. */
  canCall(action: string): boolean;
  /** Calls an action of the tool and resolves with its output. */
  call(action: string, input: unknown): Promise<unknown>;
  params: ViewParamsStore;
}

export interface ReadState<T = unknown> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

export function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

/** Entries are shared by every component reading the same action with the same input. */
export class ReadEntry {
  private snapshot: ReadState = { data: undefined, error: undefined, loading: true };
  private readonly listeners = new Set<() => void>();
  private stale = true;
  private requests = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private refreshers = new Map<number, number>();
  private nextRefresher = 0;

  constructor(
    readonly name: string,
    private readonly input: unknown,
    private readonly call: (name: string, input: unknown) => Promise<unknown>,
  ) {}

  getSnapshot = (): ReadState => this.snapshot;

  /** `refresh` re-reads every that many milliseconds while someone is subscribed. */
  subscribe(listener: () => void, refresh?: number): () => void {
    this.listeners.add(listener);
    let id: number | undefined;
    if (refresh !== undefined && refresh > 0) {
      id = this.nextRefresher++;
      this.refreshers.set(id, refresh);
      this.arm();
    }
    if (this.stale) void this.refetch();
    return () => {
      this.listeners.delete(listener);
      if (id !== undefined) this.refreshers.delete(id);
      this.arm();
    };
  }

  get active(): boolean {
    return this.listeners.size > 0;
  }

  /** Marks the data out of date: re-read now if displayed, on next display otherwise. */
  invalidate(): void {
    if (this.active) void this.refetch();
    else this.stale = true;
  }

  refetch = async (): Promise<void> => {
    const request = ++this.requests;
    this.stale = false;
    this.publish({ ...this.snapshot, loading: true });
    try {
      const data = await this.call(this.name, this.input);
      if (request === this.requests) this.publish({ data, error: undefined, loading: false });
    } catch (error) {
      if (request === this.requests) {
        this.publish({ data: this.snapshot.data, error: toError(error), loading: false });
      }
    }
  };

  private arm(): void {
    const every = Math.min(...this.refreshers.values());
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
    if (Number.isFinite(every)) this.timer = setInterval(() => void this.refetch(), every);
  }

  private publish(next: ReadState): void {
    this.snapshot = next;
    for (const listener of [...this.listeners]) listener();
  }
}

/** The part of an action name before its last dot: `deals.move` belongs to `deals`. */
function groupOf(name: string): string | undefined {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? undefined : name.slice(0, dot);
}

/** Cache of reads, and the invalidation a write triggers. */
export class ViewClient {
  private readonly entries = new Map<string, ReadEntry>();

  constructor(private readonly runtime: ViewRuntime) {}

  read(name: string, input: unknown): ReadEntry {
    const key = `${name}\u0000${JSON.stringify(input ?? null)}`;
    let entry = this.entries.get(key);
    if (!entry) {
      entry = new ReadEntry(name, input, (n, i) => this.runtime.call(n, i));
      this.entries.set(key, entry);
    }
    return entry;
  }

  async write(name: string, input: unknown): Promise<unknown> {
    const result = await this.runtime.call(name, input);
    this.invalidateRelatedTo(name);
    return result;
  }

  /** Reads of the same group (`deals.*` after `deals.move`); everything for an ungrouped name. */
  invalidateRelatedTo(name: string): void {
    const group = groupOf(name);
    for (const entry of this.entries.values()) {
      if (group === undefined || groupOf(entry.name) === group) entry.invalidate();
    }
  }
}
