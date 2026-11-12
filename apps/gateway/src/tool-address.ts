/**
 * The address a deployment answers at: `/t/<tool>` for production, `@<branch>` for a branch's
 * temporary channel, `~<name>` for another permanent channel (D-125).
 */
export function toolAddress(
  origin: string,
  worker: string,
  environment: { branch?: string; channel?: string },
): string {
  const tool = worker.split("--")[1] ?? "";
  const suffix = environment.channel
    ? `~${environment.channel}`
    : environment.branch
      ? `@${environment.branch}`
      : "";
  return `${origin}/t/${tool}${suffix}`;
}

/**
 * The path of a channel other than production, from its reference: `/t/<tool>@<branch>` or, for
 * `~<name>`, `/t/<tool>~<name>`.
 */
export function channelPath(tool: string, ref: string): string {
  return ref.startsWith("~")
    ? `/t/${encodeURIComponent(tool)}~${encodeURIComponent(ref.slice(1))}`
    : `/t/${encodeURIComponent(tool)}@${encodeURIComponent(ref)}`;
}
