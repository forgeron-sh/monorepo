import type { Atom } from "../types";

/** Gallery pages of the "navigation" blocks, in order. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "app-sidebar",
    name: "App sidebar",
    summary:
      "The left column of an app: switcher, links, folding sections, an unread count on Inbox.",
    imports: ["AppSidebar"],
    props: [
      { name: "app", type: "{ name, icon }", description: "The app on top: its tile and name." },
      {
        name: "items",
        type: "AppSidebarLink[]",
        description:
          "The primary links: { href, label, icon?, initial?, count?, items? }. count: unread only, never a total.",
      },
      {
        name: "sections",
        type: "{ label, items, collapsible?, defaultOpen? }[]",
        description: "Groups under a mono heading that folds them. A link with items folds too.",
      },
      { name: "current", type: "string", description: "The href shown: aria-current and the bar." },
      {
        name: "onNavigate",
        type: "(href, event) => void",
        description: "On a link's click; preventDefault for client routing.",
      },
      {
        name: "appMenu / onAppMenuSelect",
        type: "ActionMenuEntry[] / (id) => void",
        description: "The switcher opens these as a menu.",
      },
      { name: "actions", type: "ReactNode", description: "Icon buttons after the switcher." },
      { name: "footer", type: "ReactNode", description: "Help, the viewer's avatar." },
      {
        name: "label",
        type: "string",
        default: "`${app.name} navigation`",
        description: "Names the nav landmark.",
      },
    ],
  },
  {
    slug: "inbox-list",
    name: "Inbox list",
    summary: "Notification rows: unread in bold with the ember LED, arrows to move.",
    imports: ["InboxList"],
    props: [
      {
        name: "items",
        type: "InboxItem[]",
        description:
          "{ id, title, reference?, preview, time, dateTime?, unread?, person?, icon? }.",
      },
      { name: "selectedId", type: "string | null", description: "The row shown in the preview." },
      {
        name: "onSelect",
        type: "(id: string) => void",
        description: "On click, the arrows and j / k.",
      },
      { name: "label", type: "string", default: `"Notifications"`, description: "Names the list." },
      { name: "empty", type: "ReactNode", description: "Shown when there are no rows." },
    ],
  },
];
