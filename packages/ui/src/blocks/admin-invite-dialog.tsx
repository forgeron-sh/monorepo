// Invite people by email: addresses typed or pasted by the dozen (each one checked as it lands),
// the teams they join, an optional message, then the answer for each address: invited, already a
// member, invalid. The dialog sends nothing: it hands `onInvite` the request and shows the
// `result` the app gives back.

import { Badge } from "../badge";
import { Button } from "../button";
import { Combobox, TagInput, type ComboboxOption } from "../combobox";
import { Dialog } from "../dialog";
import { Field, Textarea } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import {
  adminPlural,
  classifyInvites,
  inviteSummary,
  isInviteEmail,
  normalizeEmail,
  type InviteOutcome,
  type InviteResult,
} from "./admin-model";

export interface InviteRequest {
  /** The addresses to invite: valid, in lower case, without duplicates, members left out. */
  emails: string[];
  /** The values of the teams chosen. */
  teams: string[];
  message: string;
}

/** What the person typed, before it is sent. */
export interface InviteDraft {
  emails: string[];
  teams: string[];
  message: string;
}

export interface InviteDialogProps {
  title?: string;
  description?: string;
  /** Teams they can join on arrival. Without any, the picker is not shown. */
  teams?: ReadonlyArray<ComboboxOption>;
  /** Addresses that belong to the workspace already: told apart before sending. */
  members?: ReadonlyArray<string>;
  value?: InviteDraft;
  defaultValue?: InviteDraft;
  onChange?: (draft: InviteDraft) => void;
  onInvite: (request: InviteRequest) => void;
  /** What happened to each address. While present, the dialog shows it in place of the form. */
  result?: ReadonlyArray<InviteResult>;
  /** The request is on its way: the button waits. */
  busy?: boolean;
  /** Back to the form from the result: the app clears `result`. */
  onAgain?: () => void;
  onClose: () => void;
  /** The optional message. `false` hides it. */
  message?: boolean;
  /** At most this many addresses at once. Default 100. */
  maxEmails?: number;
  /** At most this many characters in the message. Default 500. */
  maxMessage?: number;
}

const OUTCOME: Record<InviteOutcome, { word: string; tone: "success" | "neutral" | "danger" }> = {
  invited: { word: "Invited", tone: "success" },
  member: { word: "Already a member", tone: "neutral" },
  invalid: { word: "Invalid", tone: "danger" },
};

const EMPTY: InviteDraft = { emails: [], teams: [], message: "" };

/** A dialog to invite people: emails in a tag field, teams, a message, then the result. */
export function InviteDialog({
  title = "Invite people",
  description = "Paste a list of addresses, or type them one by one.",
  teams,
  members = [],
  value,
  defaultValue = EMPTY,
  onChange,
  onInvite,
  result,
  busy = false,
  onAgain,
  onClose,
  message = true,
  maxEmails = 100,
  maxMessage = 500,
}: InviteDialogProps) {
  const [draft, setDraft] = useControllableState<InviteDraft>({ value, defaultValue, onChange });

  if (result && result.length > 0) {
    return (
      <Dialog
        title="Invitations"
        description={inviteSummary(result)}
        onClose={onClose}
        className="fg-adm-invite"
        footer={
          <>
            {onAgain ? <Button onClick={onAgain}>Invite more</Button> : null}
            <Button variant="primary" data-autofocus onClick={onClose}>
              Done
            </Button>
          </>
        }
      >
        <ul className="fg-adm-invite-results" aria-label="Result of each invitation">
          {result.map((r) => (
            <li key={`${r.outcome}-${r.email}`} className="fg-adm-invite-result">
              <span className="fg-adm-invite-email">{r.email}</span>
              {r.detail ? <span className="fg-adm-invite-detail">{r.detail}</span> : null}
              <Badge tone={OUTCOME[r.outcome].tone}>{OUTCOME[r.outcome].word}</Badge>
            </li>
          ))}
        </ul>
      </Dialog>
    );
  }

  const classes = classifyInvites(draft.emails, members);
  const toInvite = classes.filter((c) => c.outcome === "invited").map((c) => c.email);
  const invalid = classes.filter((c) => c.outcome === "invalid").length;
  const known = classes.filter((c) => c.outcome === "member").length;
  const over = classes.length > maxEmails;
  const notes = [
    toInvite.length ? `${adminPlural(toInvite.length, "invitation")} to send` : "",
    known ? `${known} already ${known === 1 ? "a member" : "members"}, left out` : "",
    invalid ? `${invalid} not valid, left out` : "",
  ].filter(Boolean);
  const submit = () => {
    if (busy || toInvite.length === 0 || over) return;
    onInvite({ emails: toInvite, teams: draft.teams, message: draft.message.trim() });
  };

  return (
    <Dialog
      title={title}
      description={description}
      onClose={onClose}
      className="fg-adm-invite"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy || toInvite.length === 0 || over}
            onClick={submit}
          >
            {busy ? "Sending…" : toInvite.length > 1 ? `Invite ${toInvite.length}` : "Invite"}
          </Button>
        </>
      }
    >
      <Field
        label="Email addresses"
        hint={notes.join(" · ") || "Separate with a comma, a space or a new line."}
        error={over ? `At most ${maxEmails} addresses at once.` : undefined}
      >
        {(control) => (
          <TagInput
            {...control}
            label="Email addresses"
            placeholder="name@company.com"
            value={draft.emails}
            validate={isInviteEmail}
            onChange={(emails) => setDraft({ ...draft, emails: emails.map(normalizeEmail) })}
          />
        )}
      </Field>
      {teams && teams.length > 0 ? (
        <Field label="Teams" hint="They join these teams when they accept.">
          {(control) => (
            <Combobox
              {...control}
              multiple
              label="Teams"
              options={teams}
              placeholder="Choose teams"
              value={draft.teams}
              onChange={(next) => setDraft({ ...draft, teams: next })}
            />
          )}
        </Field>
      ) : null}
      {message ? (
        <Field label="Message (optional)" hint={`${draft.message.length} of ${maxMessage}`}>
          {(control) => (
            <Textarea
              {...control}
              rows={3}
              maxLength={maxMessage}
              value={draft.message}
              onChange={(e) => setDraft({ ...draft, message: e.currentTarget.value })}
            />
          )}
        </Field>
      ) : null}
    </Dialog>
  );
}
