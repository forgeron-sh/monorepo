import { createElement, type ComponentType } from "react";
import type { PageProps } from "../../shell/page-props";
import type { LazyPage, RouteDef } from "../../shell/routes";

// The people side of the Administration section (D-128): who is in the workspace, and what each
// workspace role is given. The tools and the marketplaces add their own entries to the same section.

const adapt =
  <P extends object>(load: () => Promise<ComponentType<P>>, props: (p: PageProps) => P): LazyPage =>
  async () => {
    const Page = await load();
    return { default: (p) => createElement(Page as ComponentType<object>, props(p)) };
  };

const inviteRequested = () => /[?&]invite\b/.test(window.location.search);

const routes: RouteDef[] = [
  {
    path: "/admin/members",
    title: "Members",
    access: "admin",
    nav: { group: "admin", label: "Members", shortcut: "p", order: 30 },
    page: adapt(
      () => import("../../members").then((m) => m.MembersPage),
      ({ api, ws, now }) => ({ api, selfId: ws.person.id, now, inviteOnOpen: inviteRequested() }),
    ),
  },
  {
    path: "/admin/teams",
    title: "Teams",
    access: "admin",
    nav: { group: "admin", label: "Teams", order: 35 },
    page: () => import("./pages/teams"),
  },
  {
    path: "/admin/roles",
    title: "Roles and access",
    access: "admin",
    nav: { group: "admin", label: "Roles and access", shortcut: "r", order: 40 },
    page: () => import("./pages/roles"),
  },
];
export default routes;
