import { MoreHorizontalIcon } from "@forgeron/icons";
import {
  ActionMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  IconButton,
} from "@forgeron/ui";

// Without `items`, ActionMenu is the root of the DropdownMenu parts: your own rows and submenus.
export default function Composed() {
  return (
    <ActionMenu>
      <DropdownMenuTrigger
        render={<IconButton icon={MoreHorizontalIcon} label="Issue actions" variant="boxed" />}
      />
      <DropdownMenuContent>
        <DropdownMenuItem>
          Copy ID <DropdownMenuShortcut>⌘.</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Backlog</DropdownMenuItem>
            <DropdownMenuItem>Sprint 12</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete issue</DropdownMenuItem>
      </DropdownMenuContent>
    </ActionMenu>
  );
}
