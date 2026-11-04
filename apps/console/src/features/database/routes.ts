import { createElement } from "react";
import { registerToolTab } from "../tools";
import type { RouteDef } from "../../shell/routes";

// The Database tab of the tool page. The gateway lets admins and developers in; the registry only
// knows `adminOnly`, so the tab is shown to admins.
registerToolTab({
  id: "database",
  title: "Database",
  adminOnly: true,
  order: 60,
  load: async () => {
    const { DatabaseTab } = await import("./database-tab");
    return { default: ({ tool, api }) => createElement(DatabaseTab, { tool, api }) };
  },
});

const routes: RouteDef[] = [];
export default routes;
