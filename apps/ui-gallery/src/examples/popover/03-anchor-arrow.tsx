import {
  Button,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@forgeron/ui";
import { useState } from "react";

// `anchor` places the panel against another element than the trigger; `PopoverArrow` points at it.
export default function AnchorArrow() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm">Details</Button>
        </PopoverTrigger>
        <PopoverContent anchor={anchor} side="bottom" align="center" sideOffset={10}>
          <PopoverArrow />
          <PopoverTitle>Anchored elsewhere</PopoverTitle>
          <PopoverDescription>The arrow points at the box, not at the button.</PopoverDescription>
        </PopoverContent>
      </Popover>
      <div ref={setAnchor} style={{ padding: "8px 16px", border: "1px dashed currentColor" }}>
        The anchor
      </div>
    </div>
  );
}
