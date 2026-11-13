import type { ComponentType } from "react";
import type { Api } from "../../api";
import { canSee, type Access } from "../../shell/access";
import type { WorkspaceInfo } from "../../workspace";

// The tabs of the tool page. The page (FOR-130) draws whatever is registered; a feature adds its tab
// from its own `routes.ts` with `registerToolTab`, so the tool page never imports the features.

export interface ToolTabProps {
  /** The tool's name. */
  tool: string;
  /**
   * The branch the page shows (`/admin/tools/<tool>/tree/<branch>`, D-120, D-128), or `undefined` for production.
   * Only a tab whose `scope` is `"branch"` reads it.
   */
  branch?: string;
  ws: WorkspaceInfo;
  api: Api;
  now: () => Date;
}

export interface ToolTab {
  /** Unique; also the tab's address fragment. */
  id: string;
  title: string;
  /** Not shown, and not loaded, for a person who does not hold it: `signed-in` or a platform permission (D-137). */
  requires: Access;
  /**
   * `"branch"`: what it shows follows the branch chosen in the header (D-120). `"tool"`: the same for
   * every branch; on a branch, the page says so above it.
   */
  scope: "branch" | "tool";
  /** Where the tab sits: low first, then the order of registration. */
  order?: number;
  /** Loaded when the tab is first opened: `() => import("./components/branches")` with a default export. */
  load: () => Promise<{ default: ComponentType<ToolTabProps> }>;
}

const tabs = new Map<string, ToolTab>();

/** Adds a tab, or replaces the one with the same id (a reloaded module registers again). */
export function registerToolTab(tab: ToolTab): void {
  tabs.set(tab.id, tab);
}

/** The tabs a person may see, in order. */
export function toolTabs(person: WorkspaceInfo["person"]): ToolTab[] {
  return [...tabs.values()]
    .filter((tab) => canSee(tab.requires, person))
    .map((tab, index) => ({ tab, index }))
    .sort((a, b) => (a.tab.order ?? 100) - (b.tab.order ?? 100) || a.index - b.index)
    .map(({ tab }) => tab);
}
