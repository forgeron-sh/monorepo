import type { ComponentType } from "react";
import type { Api } from "../../api";
import type { WorkspaceInfo } from "../../workspace";

// The tabs of the tool page. The page (FOR-130) draws whatever is registered; a feature adds its tab
// from its own `routes.ts` with `registerToolTab`, so the tool page never imports the features.

export interface ToolTabProps {
  /** The tool's name. */
  tool: string;
  ws: WorkspaceInfo;
  api: Api;
  now: () => Date;
}

export interface ToolTab {
  /** Unique; also the tab's address fragment. */
  id: string;
  title: string;
  /** Not shown, and not loaded, for a person who is not an admin. */
  adminOnly: boolean;
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
export function toolTabs(admin: boolean): ToolTab[] {
  return [...tabs.values()]
    .filter((tab) => admin || !tab.adminOnly)
    .map((tab, index) => ({ tab, index }))
    .sort((a, b) => (a.tab.order ?? 100) - (b.tab.order ?? 100) || a.index - b.index)
    .map(({ tab }) => tab);
}
