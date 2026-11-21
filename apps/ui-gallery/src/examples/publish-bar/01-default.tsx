import {
  ChangeList,
  ChangeListItem,
  PublishBar,
  PublishBarPublish,
  PublishBarState,
  PublishBarSwitch,
  PublishDialog,
  PublishDialogChanges,
  PublishDialogChecks,
  PublishDialogContent,
  PublishDialogFooter,
  PublishDialogMessage,
} from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(true);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PublishBar
        version={3}
        changes={2}
        active={active}
        onActiveChange={setActive}
        onPublish={() => setOpen(true)}
      >
        <PublishBarState />
        <PublishBarSwitch />
        <PublishBarPublish />
      </PublishBar>
      <ChangeList>
        <ChangeListItem kind="add">Step “Mail the CFO”</ChangeListItem>
        <ChangeListItem kind="change">Above €5,000?: compare to</ChangeListItem>
      </ChangeList>
      {open ? (
        <PublishDialog
          version={4}
          changes={[{ kind: "add", text: "Step “Mail the CFO”" }]}
          checks={[{ level: "warning", text: "Thank the client: credential has no value." }]}
          active={active}
          onClose={() => setOpen(false)}
          onPublish={() => setOpen(false)}
        >
          <PublishDialogContent>
            <PublishDialogMessage label="Why" />
            <PublishDialogChanges />
            <PublishDialogChecks />
            <PublishDialogFooter />
          </PublishDialogContent>
        </PublishDialog>
      ) : null}
    </div>
  );
}
