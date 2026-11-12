import { createElement } from "react";
import type { RouteDef } from "../../shell/routes";

// The marketplaces (D-116): what an admin can install, and the technical card of each tool.
const routes: RouteDef[] = [
  {
    path: "/admin/marketplace",
    title: "Marketplace",
    access: "admin",
    nav: { group: "admin", label: "Marketplace", shortcut: "k", order: 20 },
    page: () => import("./pages/marketplace-page"),
  },
  {
    path: "/admin/marketplace/:id/:tool",
    title: "Tool in the marketplace",
    access: "admin",
    page: async () => {
      const { default: ToolSheet } = await import("./pages/tool-sheet");
      return {
        default: (p) => createElement(ToolSheet, { ...p, id: p.params.id!, tool: p.params.tool! }),
      };
    },
  },
];
export default routes;
