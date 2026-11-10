import { createElement } from "react";
import type { RouteDef } from "../../shell/routes";
import { registerOverviewTab } from "./register";

// The member space adds its tab to the tool page; the Home route is declared in the shell's table.
registerOverviewTab();

const routes: RouteDef[] = [
  {
    // A tool as the person who uses it sees it (D-118): what it does, adding and removing it, its setup,
    // and how to use it. Nothing technical.
    path: "/library/:tool",
    title: "Tool",
    access: "everyone",
    page: async () => {
      const { LibraryToolPage } = await import("./library-page");
      return {
        default: (p) =>
          createElement(LibraryToolPage, { api: p.api, go: p.go, tool: p.params.tool! }),
      };
    },
  },
  {
    // A pilot (D-119): a branch's version opened to some people, with its own data.
    path: "/library/:tool/pilots/:branch",
    title: "Pilot",
    access: "everyone",
    page: async () => {
      const { LibraryToolPage } = await import("./library-page");
      return {
        default: (p) =>
          createElement(LibraryToolPage, {
            api: p.api,
            go: p.go,
            tool: p.params.tool!,
            pilot: p.params.branch!,
          }),
      };
    },
  },
];
export default routes;
