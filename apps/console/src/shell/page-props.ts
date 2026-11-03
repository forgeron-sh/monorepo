import type { Api } from "../api";
import type { WorkspaceInfo } from "../workspace";

/** What the shell hands to every page: the whole surface a page may rely on. */
export interface PageProps {
  ws: WorkspaceInfo;
  api: Api;
  /** The clock, for expiries and ages; tests and the harness fix it. */
  now: () => Date;
  /** Moves to another path without a page load, and puts focus on the content. */
  go: (href: string) => void;
  /** The values of the `:name` segments of the route's path. */
  params: Readonly<Record<string, string>>;
  /** Asks the shell to count the pending approvals again, after a decision. */
  refreshPending: () => void;
}
