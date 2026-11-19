// The usual place for it: a popover opened from the page's banner.
import { Button, CoverArt, CoverPicker, Popover, type CoverValue } from "@forgeron/ui";
import { useState } from "react";

export default function InAPopover() {
  const [cover, setCover] = useState<CoverValue | null>({
    type: "pattern",
    pattern: "dusk",
    tone: "ink",
  });
  return (
    <div style={{ width: "100%" }}>
      <div style={{ position: "relative" }}>
        {cover ? (
          <CoverArt value={cover} height={120} />
        ) : (
          <div style={{ height: 120, border: "1px dashed var(--line-strong)" }} />
        )}
        <div style={{ position: "absolute", right: 8, bottom: 8 }}>
          <Popover
            label="Change cover"
            align="end"
            width={380}
            trigger={<Button size="sm">Change cover</Button>}
          >
            <CoverPicker value={cover} onChange={setCover} />
          </Popover>
        </div>
      </div>
    </div>
  );
}
