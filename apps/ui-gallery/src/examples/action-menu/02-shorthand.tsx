import {
  ArrowUpRight01Icon,
  Copy01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  Notification01Icon,
} from "@forgeron/icons";
import { ActionMenu, IconButton } from "@forgeron/ui";

export default function Default() {
  return (
    <ActionMenu
      label="Actions on OPS-40"
      trigger={<IconButton icon={MoreHorizontalIcon} label="Issue actions" variant="boxed" />}
      onSelect={() => {}}
      items={[
        { id: "open", label: "Open issue", icon: ArrowUpRight01Icon, kbd: "↵" },
        { id: "copy", label: "Copy ID", icon: Copy01Icon },
        { id: "subscribe", label: "Subscribe", icon: Notification01Icon },
        { separator: true },
        { id: "delete", label: "Delete issue", icon: Delete02Icon, danger: true },
      ]}
    />
  );
}
