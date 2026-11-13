import { createElement, type ComponentType } from "react";
import type { PageProps } from "../../shell/page-props";
import type { LazyPage, RouteDef } from "../../shell/routes";

// The settings area: Account for everyone, Workspace and Operations for whoever holds the permission
// of each page (D-137). Members and teams are not settings: they are in the Administration section of
// the sidebar (D-128).

const adapt =
  <P extends object>(load: () => Promise<ComponentType<P>>, props: (p: PageProps) => P): LazyPage =>
  async () => {
    const Page = await load();
    return { default: (p) => createElement(Page as ComponentType<object>, props(p)) };
  };

const routes: RouteDef[] = [
  {
    path: "/settings",
    title: "Settings",
    access: "signed-in",
    page: () => import("./pages/redirect"),
  },
  {
    path: "/settings/profile",
    title: "Profile",
    access: "signed-in",
    settings: { group: "account", label: "Profile" },
    page: () => import("./pages/profile"),
  },
  {
    path: "/settings/preferences",
    title: "Preferences",
    access: "signed-in",
    settings: { group: "account", label: "Preferences" },
    page: () => import("./pages/preferences"),
  },
  {
    path: "/settings/security",
    title: "Security",
    access: "signed-in",
    settings: { group: "account", label: "Security" },
    page: () => import("./pages/security"),
  },
  {
    path: "/settings/connected-accounts",
    title: "Connected accounts",
    access: "signed-in",
    settings: { group: "account", label: "Connected accounts" },
    page: () => import("./pages/connected-accounts"),
  },
  {
    path: "/settings/secrets",
    title: "Personal secrets",
    access: "signed-in",
    settings: { group: "account", label: "Personal secrets" },
    page: () => import("./pages/personal-secrets"),
  },
  {
    path: "/settings/workspace",
    title: "General",
    access: "settings:read",
    settings: { group: "workspace", label: "General" },
    page: () => import("./pages/general"),
  },
  {
    path: "/settings/sign-in",
    title: "Sign-in",
    access: "settings:read",
    settings: { group: "workspace", label: "Sign-in" },
    page: adapt(
      () => import("../../settings").then((m) => m.SignInPage),
      ({ api, ws }) => ({ api, ws }),
    ),
  },
  {
    path: "/settings/domains",
    title: "Domains",
    access: "members:read",
    settings: { group: "workspace", label: "Domains" },
    page: adapt(
      () => import("../../members").then((m) => m.DomainsPage),
      ({ api, ws }) => ({ api, person: ws.person }),
    ),
  },
  {
    path: "/settings/github",
    title: "GitHub",
    access: "settings:read",
    settings: { group: "workspace", label: "GitHub" },
    page: () => import("./pages/github"),
  },
  {
    path: "/settings/audit",
    title: "Audit log",
    access: "audit:read",
    settings: { group: "operations", label: "Audit log" },
    page: adapt(
      () => import("../../audit-page").then((m) => m.AuditPage),
      ({ api, ws, now }) => ({ api, person: ws.person, now }),
    ),
  },
  {
    path: "/settings/usage",
    title: "Usage and seats",
    access: "usage:read",
    settings: { group: "operations", label: "Usage and seats" },
    page: () => import("./pages/usage"),
  },
  {
    path: "/settings/sealing",
    title: "Sealing key",
    access: "settings:read",
    settings: { group: "operations", label: "Sealing key" },
    page: adapt(
      () => import("./pages/sealing").then((m) => m.default),
      ({ api }) => ({ api }),
    ),
  },
  {
    path: "/settings/install",
    title: "Install information",
    access: "settings:read",
    settings: { group: "operations", label: "Install information" },
    page: adapt(
      () => import("../../settings").then((m) => m.InstallPage),
      ({ api, ws }) => ({ api, ws }),
    ),
  },
];
export default routes;
