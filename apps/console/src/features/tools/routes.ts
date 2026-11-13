import { createElement } from "react";
import type { RouteDef } from "../../shell/routes";
import "./register";

// The tools' routes, collected by the shell's route table: the admin's view of every tool of the
// workspace, in the Administration section (D-128), for whoever holds `tools:read` (D-136). Importing `./register` here puts this
// feature's tabs in the tab registry as soon as the table is built.
const routes: RouteDef[] = [
  {
    path: "/admin/tools",
    title: "Tools",
    access: "tools:read",
    nav: { group: "admin", label: "Tools", shortcut: "t", order: 10 },
    page: () => import("./pages/tools-page"),
  },
  {
    path: "/admin/tools/:name",
    title: "Tool",
    access: "tools:read",
    page: async () => {
      const { default: ToolPage } = await import("./pages/tool-page");
      return { default: (p) => createElement(ToolPage, { ...p, name: p.params.name! }) };
    },
  },
  {
    // The same page for one branch's preview (D-120): its tabs show that branch.
    path: "/admin/tools/:name/tree/:branch",
    title: "Tool",
    access: "tools:read",
    page: async () => {
      const { default: ToolPage } = await import("./pages/tool-page");
      return {
        default: (p) =>
          createElement(ToolPage, { ...p, name: p.params.name!, branch: p.params.branch! }),
      };
    },
  },
];
export default routes;
