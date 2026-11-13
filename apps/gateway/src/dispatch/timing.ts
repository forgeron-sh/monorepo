// How long each step of a call to a tool takes, in the `Server-Timing` header (D-142). A call of 1 s
// with 40 ms of CPU is a call that waits; this says on what, step by step, so that what is worth
// changing is read, not guessed. The clock moves only when the Worker waits for something, which is
// exactly what is measured here.

export interface Timings {
  /** Runs a step and adds the time it took under `step`; a step run again adds up, and is counted. */
  time<T>(step: string, run: () => Promise<T>): Promise<T>;
  /** `find;dur=12.3, tool;dur=96, total;dur=480`: for the `Server-Timing` header. */
  header(): string;
}

/** For code that may or may not be measured: runs the step, and measures it when there is a clock. */
export const timed = <T>(timings: Timings | undefined, step: string, run: () => Promise<T>) =>
  timings ? timings.time(step, run) : run();

export function createTimings(
  now: () => number = () => performance.now(),
  /** More entries for the header, read when it is made (what the database cost, D-143). */
  extra: () => string[] = () => [],
): Timings {
  const started = now();
  const steps = new Map<string, { ms: number; calls: number }>();
  return {
    async time(step, run) {
      const at = now();
      try {
        return await run();
      } finally {
        const kept = steps.get(step) ?? { ms: 0, calls: 0 };
        steps.set(step, { ms: kept.ms + (now() - at), calls: kept.calls + 1 });
      }
    },
    header() {
      const parts = [...steps].map(
        ([step, { ms, calls }]) =>
          `${step};dur=${ms.toFixed(1)}${calls > 1 ? `;desc="${calls} times"` : ""}`,
      );
      parts.push(...extra());
      parts.push(`total;dur=${(now() - started).toFixed(1)}`);
      return parts.join(", ");
    },
  };
}
