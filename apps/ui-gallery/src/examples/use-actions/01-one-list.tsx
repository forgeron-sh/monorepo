// One list of actions for the "…" menu, the right click, the palette (⌘K) and the keys: change it
// once, everything follows. Press A, D or ⇧P with the page focused.
import {
  Copy01Icon,
  Delete02Icon,
  Loading03Icon,
  MoreHorizontalIcon,
  UserIcon,
} from "@forgeron/icons";
import {
  ActionMenu,
  Button,
  CommandPalette,
  ContextMenu,
  IconButton,
  STATUS_NAMES,
  StatusGlyph,
  useActions,
  useDisclosure,
  type StatusKind,
} from "@forgeron/ui";
import { useState } from "react";

const STATUSES: StatusKind[] = ["todo", "progress", "review", "done"];

export default function OneList() {
  const [status, setStatus] = useState<StatusKind>("progress");
  const [log, setLog] = useState("Nothing yet");
  const palette = useDisclosure();
  const actions = useActions([
    {
      id: "assign",
      label: "Assign to me",
      icon: UserIcon,
      shortcut: "a",
      run: () => setLog("Assigned to you"),
    },
    {
      id: "copy",
      label: "Copy ID",
      icon: Copy01Icon,
      shortcut: "mod+shift+c",
      run: () => setLog("Copied OPS-40"),
    },
    {
      id: "status",
      label: "Status",
      icon: Loading03Icon,
      actions: STATUSES.map((s) => ({
        id: `status:${s}`,
        label: STATUS_NAMES[s],
        glyph: <StatusGlyph status={s} />,
        checked: s === status,
        run: () => setStatus(s),
      })),
    },
    { id: "palette", label: "Open palette", shortcut: "shift+p", run: palette.onOpen },
    {
      id: "delete",
      label: "Delete issue",
      icon: Delete02Icon,
      danger: true,
      shortcut: "d",
      run: () => setLog("Deleted"),
    },
  ]);
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <ActionMenu
          label="Actions on OPS-40"
          items={actions.menu}
          onSelect={actions.run}
          trigger={<IconButton icon={MoreHorizontalIcon} label="Issue actions" variant="boxed" />}
        />
        <Button size="sm" onClick={palette.onOpen} kbd="⇧P">
          Palette
        </Button>
        <ContextMenu items={actions.menu} onSelect={actions.run} label="Actions on OPS-40">
          <span
            className="t-mono"
            style={{
              padding: "6px 10px",
              border: "1px dashed var(--line-strong)",
              color: "var(--ink-muted)",
              fontSize: 12,
            }}
          >
            Right-click me
          </span>
        </ContextMenu>
      </div>
      <code className="t-mono" style={{ color: "var(--ink-muted)", fontSize: 12 }}>
        OPS-40 · {STATUS_NAMES[status]} · {log}
      </code>
      <CommandPalette groups={actions.commands} onSelect={actions.run} {...palette.props} />
    </div>
  );
}
