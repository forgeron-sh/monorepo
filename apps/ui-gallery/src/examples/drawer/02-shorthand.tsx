import { Button, DetailList, Drawer } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Open row 1041
      </Button>
    );
  }
  return (
    <div style={{ width: 300, height: 200, display: "flex" }}>
      <Drawer title="Row 1041" description="invoices" onClose={() => setOpen(false)}>
        <DetailList items={[{ label: "status", value: "paid" }]} />
      </Drawer>
    </div>
  );
}
