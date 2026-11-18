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
    slug: "command-palette",
    name: "Command palette",
    summary: "⌘K: search pages, records and actions, arrows and Enter to run.",
    imports: ["CommandPalette", "filterCommands"],
    props: [
      { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Controlled." },
      {
        name: "groups",
        type: "{ label, items: { id, label, icon?, glyph?, hint?, kbd?, keywords? }[] }[]",
        description: "The results, by group; filtered on label, hint and keywords.",
      },
      { name: "onSelect", type: "(id: string) => void", description: "The row run; then closes." },
      {
        name: "placeholder",
        type: "string",
        default: `"Search or run a command…"`,
        description: "In the field.",
      },
      {
        name: "shortcut",
        type: "string | string[]",
        default: `["⌘", "K"]`,
        description: "The key that opens it, at the end of the field.",
      },
      {
        name: "emptyText",
        type: "(query) => ReactNode",
        description: "When nothing matches; No results for “…” by default.",
      },
    ],
  },
  {
    slug: "action-menu",
    name: "Action menu",
    summary: "The actions on a record behind “…” or a right click, with submenus.",
    imports: ["ActionMenu", "ContextMenu"],
    props: [
      {
        name: "items",
        type: "ActionMenuEntry[]",
        description:
          "{ id, label, icon?, glyph?, kbd?, danger?, checked?, items? }, { separator: true }, { heading }.",
      },
      {
        name: "onSelect",
        type: "(id: string) => void",
        description: "The row chosen, in the menu or a submenu.",
      },
      {
        name: "trigger",
        type: "ReactElement",
        description: "ActionMenu: the control that opens it, e.g. an IconButton.",
      },
      {
        name: "children",
        type: "ReactNode",
        description: "ContextMenu: the area that opens it on right click.",
      },
      { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Optional." },
      { name: "label", type: "string", description: "Names the menu, e.g. Actions on OPS-40." },
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
