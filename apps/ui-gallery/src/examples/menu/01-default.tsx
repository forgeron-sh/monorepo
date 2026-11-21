import {
  Button,
  Menu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@forgeron/ui";

// Without `entries`, Menu is the root of the DropdownMenu parts.
export default function Composed() {
  return (
    <Menu>
      <DropdownMenuTrigger render={<Button variant="outline">Workspace</Button>} />
      <DropdownMenuContent aria-label="Workspace">
        <DropdownMenuLabel>Acme</DropdownMenuLabel>
        <DropdownMenuItem>Switch workspace</DropdownMenuItem>
        <DropdownMenuItem>Invite people</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Leave workspace</DropdownMenuItem>
      </DropdownMenuContent>
    </Menu>
  );
}
