import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@forgeron/ui";
import { BoldIcon, ItalicIcon, Link02Icon } from "@forgeron/icons";
import { useState } from "react";

export default function Formatting() {
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  return (
    <Toolbar label="Text formatting">
      <ToolbarGroup label="Style">
        <ToolbarButton icon={BoldIcon} label="Bold" pressed={bold} onClick={() => setBold(!bold)} />
        <ToolbarButton
          icon={ItalicIcon}
          label="Italic"
          pressed={italic}
          onClick={() => setItalic(!italic)}
        />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarButton icon={Link02Icon} label="Link" />
      <ToolbarButton label="Clear" />
    </Toolbar>
  );
}
