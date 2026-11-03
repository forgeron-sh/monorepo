import { registerToolTab } from "./tabs";

// The tabs this feature provides. Other features register theirs the same way (Architecture,
// Database, Overview): each tab's code loads when it is first opened.

registerToolTab({
  id: "branches",
  title: "Branches",
  adminOnly: true,
  load: () => import("./tabs/branches-tab"),
});
registerToolTab({
  id: "versions",
  title: "Versions",
  adminOnly: true,
  load: () => import("./tabs/versions-tab"),
});
registerToolTab({
  id: "access",
  title: "Access",
  adminOnly: true,
  load: () => import("./tabs/access-tab"),
});
registerToolTab({
  id: "secrets",
  title: "Secrets",
  adminOnly: false,
  load: () => import("./tabs/secrets-tab"),
});
registerToolTab({
  id: "activity",
  title: "Activity",
  adminOnly: true,
  load: () => import("./tabs/activity-tab"),
});
