import { Button, Modal } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>New issue</Button>
      <Modal open={open} onOpenChange={setOpen} title="New issue" context="OPS" size="sm">
        <p style={{ margin: "12px 0" }}>The form goes here.</p>
        <Button onClick={() => setOpen(false)}>Create</Button>
      </Modal>
    </>
  );
}
