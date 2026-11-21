import { BoldIcon, ItalicIcon } from "@forgeron/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Toggle,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@forgeron/ui";

// A tool is any element: `render` (Base UI) or `asChild` (shadcn) hands the tool's props to it.
export default function Composed() {
  return (
    <Toolbar label="Text formatting">
      <ToolbarGroup label="Style">
        <ToolbarButton label="Bold" render={<Toggle aria-label="Bold" />}>
          B
        </ToolbarButton>
        <ToolbarButton label="Italic" icon={ItalicIcon} />
      </ToolbarGroup>
      <ToolbarSeparator />
      <DropdownMenu>
        <ToolbarButton asChild label="More">
          <DropdownMenuTrigger>More</DropdownMenuTrigger>
        </ToolbarButton>
        <DropdownMenuContent>
          <DropdownMenuItem>Underline</DropdownMenuItem>
          <DropdownMenuItem>Strikethrough</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ToolbarButton icon={BoldIcon} label="Bold, with children">
        <strong>Bold</strong>
      </ToolbarButton>
    </Toolbar>
  );
}
