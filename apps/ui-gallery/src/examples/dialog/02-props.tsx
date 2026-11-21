import { Button, Dialog } from "@forgeron/ui";
import { useState } from "react";

// With a title and onClose, Dialog takes props instead of parts. Render it only while it is open.
export default function Props() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete
      </Button>
      {open ? (
        <Dialog
          title="Delete the report?"
          description="It goes to the trash for 30 days."
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </>
          }
        />
      ) : null}
    </>
  );
}
