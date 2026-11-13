import { registerToolTab } from "../tools";

/** The tool card is the first tab of the tool page, for everyone. */
export function registerOverviewTab(): void {
  registerToolTab({
    id: "overview",
    scope: "branch",
    title: "Overview",
    requires: "signed-in",
    order: 0,
    load: () => import("./tool-card"),
  });
}
