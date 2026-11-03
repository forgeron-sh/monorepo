import type { ComponentType } from "react";
import type { Api } from "../../api";

// The tool page's tabs are a registry (docs/console-ux.md, "Code organisation"): a feature adds its
// tab with `registerToolTab`, the page draws whatever is registered. The tab's code is loaded when
// the tab is first opened.

export interface ToolTabProps {
  tool: string;
  api: Api;
  admin: boolean;
  /** The clock, for ages; tests and the harness fix it. */
  now: () => Date;
}

export interface ToolTab {
  id: string;
  title: string;
  /** Not shown to a person who is not an admin. */
  adminOnly: boolean;
  load: () => Promise<{ default: ComponentType<ToolTabProps> }>;
}

/** The order of the table in docs/console-ux.md; a tab that is not in it comes last, as registered. */
const ORDER = [
  "overview",
  "branches",
  "versions",
  "architecture",
  "database",
  "access",
  "secrets",
  "activity",
];

const tabs = new Map<string, ToolTab>();

/** Adds a tab, or replaces the one with the same id (so that registering twice is harmless). */
export function registerToolTab(tab: ToolTab): void {
  tabs.set(tab.id, tab);
}

/** The registered tabs in display order, those a person may not see left out. */
export function toolTabs(admin: boolean): ToolTab[] {
  const rank = (id: string) => {
    const at = ORDER.indexOf(id);
    return at === -1 ? ORDER.length : at;
  };
  return [...tabs.values()]
    .filter((tab) => admin || !tab.adminOnly)
    .sort((a, b) => rank(a.id) - rank(b.id));
}
