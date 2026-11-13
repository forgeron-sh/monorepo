import { createElement } from "react";
import { registerToolTab } from "../tools";
import type { RouteDef } from "../../shell/routes";

// The Database tab of the tool page: for whoever holds `tools:data` (D-136).
registerToolTab({
  id: "database",
  scope: "branch",
  title: "Database",
  requires: "tools:data",
  order: 60,
  load: async () => {
    const { DatabaseTab } = await import("./database-tab");
    return {
      default: ({ tool, api, branch }) =>
        createElement(DatabaseTab, { tool, api, ...(branch ? { branch } : {}) }),
    };
  },
});

const routes: RouteDef[] = [];
export default routes;
