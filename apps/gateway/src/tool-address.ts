/** The address a deployment answers at: `/t/<tool>`, plus `@<branch>` for a preview. */
export function toolAddress(
  origin: string,
  worker: string,
  environment: { branch?: string },
): string {
  const tool = worker.split("--")[1] ?? "";
  return `${origin}/t/${tool}${environment.branch ? `@${environment.branch}` : ""}`;
}
