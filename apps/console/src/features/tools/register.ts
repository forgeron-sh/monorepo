import { registerToolTab } from "./tabs";

// The tabs this feature provides. Other features register theirs the same way (Architecture,
// Database, Overview): each tab's code loads when it is first opened.

registerToolTab({
  id: "branches",
  scope: "tool",
  order: 20,
  title: "Branches",
  adminOnly: true,
  load: () => import("./tabs/branches-tab"),
});
registerToolTab({
  id: "versions",
  scope: "tool",
  order: 30,
  title: "Versions",
  adminOnly: true,
  load: () => import("./tabs/versions-tab"),
});
registerToolTab({
  id: "availability",
  scope: "branch",
  order: 50,
  title: "Availability",
  adminOnly: true,
  load: () => import("./tabs/availability-tab"),
});
registerToolTab({
  id: "access",
  scope: "tool",
  order: 60,
  title: "Access",
  adminOnly: true,
  load: () => import("./tabs/access-tab"),
});
registerToolTab({
  id: "secrets",
  scope: "branch",
  order: 70,
  title: "Secrets",
  // It lists who holds which secret: an admin's screen (D-118). A person's own are on their library.
  adminOnly: true,
  load: () => import("./tabs/secrets-tab"),
});
registerToolTab({
  id: "activity",
  scope: "tool",
  order: 80,
  title: "Activity",
  adminOnly: true,
  load: () => import("./tabs/activity-tab"),
});
