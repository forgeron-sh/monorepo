export { DatabaseTab } from "./database-tab";

/**
 * The tool page's tab registry (`features/tools/tabs.ts`, FOR-134) is not in this tree yet: until it
 * lands, this is the one line it needs: `registerToolTab(databaseTab)`.
 */
export const databaseTab = {
  id: "database",
  title: "Database",
  /** The gateway lets admins and developers in; the tab is for them. */
  adminOnly: true,
  load: () => import("./database-tab").then((m) => m.DatabaseTab),
} as const;

export function registerDatabaseTab(register: (tab: typeof databaseTab) => void): void {
  register(databaseTab);
}
