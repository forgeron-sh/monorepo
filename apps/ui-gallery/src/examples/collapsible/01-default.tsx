import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "@forgeron/ui";
import { useState } from "react";

export default function Composed() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} style={{ width: 320 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="fg-pop-heading">3 repositories starred</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {open ? "Hide" : "Show"}
          </Button>
        </CollapsibleTrigger>
      </div>
      <div style={{ border: "1px solid var(--line)", padding: "8px 12px", marginTop: 8 }}>
        @forgeron/ui
      </div>
      <CollapsibleContent>
        <div style={{ border: "1px solid var(--line)", padding: "8px 12px", marginTop: 8 }}>
          @forgeron/canvas
        </div>
        <div style={{ border: "1px solid var(--line)", padding: "8px 12px", marginTop: 8 }}>
          @forgeron/flow
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
