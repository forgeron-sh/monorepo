import {
  Button,
  classifyInvites,
  InviteDialog,
  InviteDialogEmails,
  InviteDialogFooter,
  InviteDialogHeader,
  InviteDialogMessage,
  InviteDialogResults,
  InviteDialogTeams,
  type InviteDraft,
  type InviteResult,
} from "@forgeron/ui";
import { useState } from "react";

const members = ["ada@example.test"];
const teams = [
  { value: "finance", label: "Finance" },
  { value: "support", label: "Support" },
];

export default function Composed() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<InviteResult[] | undefined>();
  const [draft, setDraft] = useState<InviteDraft>({
    emails: ["lea@example.test", "ada@example.test"],
    teams: [],
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
          onInvite={() => setResult(classifyInvites(draft.emails, members))}
          onAgain={() => setResult(undefined)}
          onClose={() => {
            setOpen(false);
            setResult(undefined);
          }}
        >
          <InviteDialogHeader />
          <InviteDialogEmails />
          <InviteDialogTeams />
          <InviteDialogMessage />
          <InviteDialogResults />
          <InviteDialogFooter />
        </InviteDialog>
      ) : null}
    </>
  );
}
