import { Archive01Icon, Delete02Icon, Edit02Icon } from "@forgeron/icons";
import { IconButton, Tooltip } from "@forgeron/ui";

export default function Default() {
  return (
    <>
      <Tooltip content="Edit" kbd="E">
        <IconButton icon={Edit02Icon} label="Edit" />
      </Tooltip>
      <Tooltip content="Archive" kbd="⌘⌫">
        <IconButton icon={Archive01Icon} label="Archive" />
      </Tooltip>
      <Tooltip content="Delete" side="bottom">
        <IconButton icon={Delete02Icon} label="Delete" />
      </Tooltip>
    </>
  );
}
