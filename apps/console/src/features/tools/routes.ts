import { createElement } from "react";
import type { RouteDef } from "../../shell/routes";
import "./register";

// The tools' routes, collected by the shell's route table. Importing `./register` here puts this
// feature's tabs in the tab registry as soon as the table is built.
const routes: RouteDef[] = [
  {
    path: "/tools",
    title: "Tools",
    access: "developer",
    nav: { group: "main", label: "Tools", shortcut: "t" },
    page: () => import("./pages/tools-page"),
  },
  {
    path: "/tools/:name",
    title: "Tool",
    access: "developer",
    page: async () => {
      const { default: ToolPage } = await import("./pages/tool-page");
      return { default: (p) => createElement(ToolPage, { ...p, name: p.params.name! }) };
    },
  },
  {
    // The same page for one branch's preview (D-120): its tabs show that branch.
    path: "/tools/:name/tree/:branch",
    title: "Tool",
    access: "developer",
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
