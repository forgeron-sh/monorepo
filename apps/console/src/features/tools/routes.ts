import type { ComponentType } from "react";

// The tools' routes, for the route table of the shell (`apps/console/src/shell/routes.ts`, FOR-134):
// a path, a title, who may see it and a lazy page. Until the table takes them, `app.tsx` draws them.

export interface ToolsRoute {
  /** `:tool` is the tool's name. */
  path: string;
  title: string;
  /** `false`: members see it as well. */
  admin: boolean;
  page: () => Promise<{ default: ComponentType<any> }>;
}

export const toolsRoutes: ToolsRoute[] = [
  { path: "/tools", title: "Tools", admin: false, page: () => import("./pages/tools-page") },
  { path: "/tools/:tool", title: "Tool", admin: false, page: () => import("./pages/tool-page") },
];
