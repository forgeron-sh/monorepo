import type { RouteDef } from "../../shell/routes";

// The page a link from the admin MCP's `secret_request` opens (docs/sdk.md §17): the person types a
// tool's secret there themselves. No item in the sidebar: it is reached by the link only.
const routes: RouteDef[] = [
  {
    path: "/secret-request",
    title: "Enter a secret",
    access: "everyone",
    page: () => import("./pages/secret-request"),
  },
];
export default routes;
