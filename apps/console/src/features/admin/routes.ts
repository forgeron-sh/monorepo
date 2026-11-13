import { createElement, type ComponentType } from "react";
import type { PageProps } from "../../shell/page-props";
import type { LazyPage, RouteDef } from "../../shell/routes";

// The people side of the Administration section (D-128, D-137): who is in the workspace, and the
// teams: what each may do on Forgeron. The tools and the marketplaces add their own entries to the
// same section.

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
    access: "members:read",
    nav: { group: "admin", label: "Members", shortcut: "p", order: 30 },
    page: adapt(
      () => import("../../members").then((m) => m.MembersPage),
      ({ api, ws, now }) => ({ api, person: ws.person, now, inviteOnOpen: inviteRequested() }),
    ),
  },
  {
    path: "/admin/teams",
    title: "Teams",
    // Everyone signed in reads the teams; `teams:write` changes them.
    access: "signed-in",
    nav: { group: "admin", label: "Teams", shortcut: "e", order: 35 },
    page: () => import("./pages/teams"),
  },
  {
    path: "/admin/teams/:id",
    title: "Team",
    access: "signed-in",
    page: () => import("./pages/team"),
  },
];
export default routes;
