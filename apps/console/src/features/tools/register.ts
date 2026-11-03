import { registerToolTab } from "./tabs";

// The tabs this feature provides. Other features register theirs the same way (Architecture,
// Database, Overview): each tab's code loads when it is first opened.

registerToolTab({
  id: "branches",
  order: 20,
  title: "Branches",
  adminOnly: true,
  load: () => import("./tabs/branches-tab"),
});
registerToolTab({
  id: "versions",
  order: 30,
  title: "Versions",
  adminOnly: true,
  load: () => import("./tabs/versions-tab"),
});
registerToolTab({
  id: "access",
  order: 60,
  title: "Access",
  adminOnly: true,
  load: () => import("./tabs/access-tab"),
});
registerToolTab({
  id: "secrets",
  order: 70,
  title: "Secrets",
  adminOnly: false,
  load: () => import("./tabs/secrets-tab"),
});
registerToolTab({
  id: "activity",
  order: 80,
  title: "Activity",
  adminOnly: true,
  load: () => import("./tabs/activity-tab"),
});
