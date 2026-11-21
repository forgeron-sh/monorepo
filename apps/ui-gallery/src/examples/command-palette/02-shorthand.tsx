import { Folder01Icon, InboxIcon, Layers01Icon, UserCircleIcon } from "@forgeron/icons";
import { Button, CommandPalette } from "@forgeron/ui";
import { useEffect, useState } from "react";

export default function Default() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((was) => !was);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <Button kbd="⌘K" onClick={() => setOpen(true)}>
        Search
      </Button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        onSelect={() => {}}
        groups={[
          {
            label: "Go to",
            items: [
              { id: "inbox", label: "Inbox", icon: InboxIcon },
              { id: "my", label: "My issues", icon: UserCircleIcon },
              { id: "projects", label: "Projects", icon: Folder01Icon },
              { id: "views", label: "Views", icon: Layers01Icon },
            ],
          },
        ]}
      />
    </>
  );
}
