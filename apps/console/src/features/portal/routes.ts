import { createElement } from "react";
import type { RouteDef } from "../../shell/routes";
import { registerOverviewTab } from "./register";

// The member space adds its tab to the tool page; the Home route is declared in the shell's table.
registerOverviewTab();

const routes: RouteDef[] = [
  {
    // The tools the person added (D-128).
    path: "/library",
    title: "My tools",
    access: "everyone",
    nav: { group: "main", label: "My tools", shortcut: "m", order: 10 },
    page: async () => {
      const { MyToolsPage } = await import("./tool-lists");
      return { default: (p) => createElement(MyToolsPage, { ws: p.ws, api: p.api, go: p.go }) };
    },
  },
  {
    // The tools the workspace makes available to the person, to add (D-128).
    path: "/discover",
    title: "Discover",
    access: "everyone",
    nav: { group: "main", label: "Discover", shortcut: "d", order: 20 },
    page: async () => {
      const { DiscoverPage } = await import("./tool-lists");
      return { default: (p) => createElement(DiscoverPage, { ws: p.ws, api: p.api, go: p.go }) };
    },
  },
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
          createElement(LibraryToolPage, {
            api: p.api,
            go: p.go,
            tool: p.params.tool!,
            admin: p.ws.person.admin,
          }),
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
            admin: p.ws.person.admin,
          }),
      };
    },
  },
];
export default routes;
