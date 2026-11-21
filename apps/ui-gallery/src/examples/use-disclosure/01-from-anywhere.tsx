// One state for something that opens, passed whole to the component: the button, the O key and
// the palette's own Escape all drive the same palette.
import { Button, CommandPalette, useDisclosure, useShortcuts } from "@forgeron/ui";

export default function FromAnywhere() {
  const palette = useDisclosure();
  useShortcuts({ o: palette.onOpen });
  return (
    <>
      <Button size="sm" kbd="O" onClick={palette.toggle}>
        {palette.open ? "Close" : "Open"} palette
      </Button>
      <CommandPalette
        {...palette.props}
        onSelect={() => {}}
        groups={[
          {
            label: "Go to",
            items: [
              { id: "inbox", label: "Inbox" },
              { id: "issues", label: "My issues" },
            ],
          },
        ]}
      />
    </>
  );
}
