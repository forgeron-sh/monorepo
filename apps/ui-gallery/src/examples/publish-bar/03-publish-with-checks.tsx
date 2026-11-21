import { PublishBar, PublishDialog, type VersionChange } from "@forgeron/ui";
import { useState } from "react";

const changes: VersionChange[] = [
  { kind: "add", text: "Step “Mail the CFO”" },
  { kind: "change", text: "Above €5,000?: compare to" },
  { kind: "remove", text: "Step “Log the deal”" },
];

export default function PublishWithChecks() {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(4);
  const [pending, setPending] = useState(changes.length);
  const [active, setActive] = useState(true);
  return (
    <div>
      <PublishBar
        version={version}
        changes={pending}
        active={active}
        onActiveChange={setActive}
        onPublish={() => setOpen(true)}
      />
      {open ? (
        <PublishDialog
          version={version + 1}
          changes={changes}
          active={active}
          checks={[
            {
              level: "warning",
              text: "Thank the client: credential mail-backup has no value in the vault.",
            },
          ]}
          note="Steps run the code of the deployed flows build, 0.2.0+3c9e1f4. A published version cannot change; restore it later as a draft."
          onClose={() => setOpen(false)}
          onPublish={() => {
            setVersion(version + 1);
            setPending(0);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
