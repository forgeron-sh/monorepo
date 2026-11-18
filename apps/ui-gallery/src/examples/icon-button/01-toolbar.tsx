import { Archive01Icon, Delete02Icon, Mail01Icon, MoreHorizontalIcon } from "@forgeron/icons";
import { IconButton } from "@forgeron/ui";

export default function Toolbar() {
  return (
    <>
      <IconButton icon={Mail01Icon} label="Reply by email" />
      <IconButton icon={Archive01Icon} label="Archive" />
      <IconButton icon={Delete02Icon} label="Delete" />
      <IconButton icon={MoreHorizontalIcon} label="More actions" variant="boxed" />
    </>
  );
}
