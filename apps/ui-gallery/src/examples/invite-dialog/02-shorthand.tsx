import {
  Button,
  classifyInvites,
  InviteDialog,
  type InviteDraft,
  type InviteResult,
} from "@forgeron/ui";
import { useState } from "react";

const members = ["ada@example.test", "sam@example.test"];
const teams = [
  { value: "finance", label: "Finance", hint: "4" },
  { value: "support", label: "Support", hint: "9" },
  { value: "ops", label: "Operations", hint: "6" },
];

export default function Default() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<InviteResult[] | undefined>();
  const [draft, setDraft] = useState<InviteDraft>({
    emails: ["lea@example.test", "ada@example.test", "not-an-address"],
    teams: ["support"],
    message: "",
  });
  return (
    <>
      <Button onClick={() => setOpen(true)}>Invite people</Button>
      {open ? (
        <InviteDialog
          teams={teams}
          members={members}
          value={draft}
          onChange={setDraft}
          result={result}
          // A real app sends the request; here every address gets the answer it would.
          onInvite={() => setResult(classifyInvites(draft.emails, members))}
          onAgain={() => {
            setResult(undefined);
            setDraft({ emails: [], teams: [], message: "" });
          }}
          onClose={() => {
            setOpen(false);
            setResult(undefined);
          }}
        />
      ) : null}
    </>
  );
}
