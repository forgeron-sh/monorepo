import { registerToolTab } from "./tabs";

// The tabs this feature provides. Other features register theirs the same way (Architecture,
// Database, Overview): each tab's code loads when it is first opened. `requires` is the platform
// permission that opens the tab (D-136).

registerToolTab({
  id: "branches",
  scope: "tool",
  order: 20,
  title: "Channels",
  requires: "tools:read",
  load: () => import("./tabs/branches-tab"),
});
registerToolTab({
  id: "versions",
  scope: "tool",
  order: 30,
  title: "Releases",
  requires: "tools:read",
  load: () => import("./tabs/versions-tab"),
});
registerToolTab({
  id: "access",
  scope: "tool",
  order: 60,
  title: "Access",
  requires: "access:read",
  load: () => import("./tabs/access-tab"),
});
registerToolTab({
  id: "secrets",
  scope: "branch",
  order: 70,
  title: "Secrets",
  // It lists who holds which secret: for whoever sets them (D-118). A person's own are on their library.
  requires: "tools:secrets",
  load: () => import("./tabs/secrets-tab"),
});
registerToolTab({
  id: "activity",
  scope: "tool",
  order: 80,
  title: "Activity",
  requires: "tools:read",
  load: () => import("./tabs/activity-tab"),
});
