// Invite people by email: addresses typed or pasted by the dozen (each one checked as it lands),
// the teams they join, an optional message, then the answer for each address: invited, already a
// member, invalid. The dialog sends nothing: it hands `onInvite` the request and shows the
// `result` the app gives back.
//
// A root with parts. Without children it is the usual dialog; with children they are the content
// of a shadcn dialog (`Dialog` > `DialogContent`), each part reading the state of the root:
//
//   <InviteDialog teams={teams} members={members} onInvite={send} onClose={close} result={result}>
//     <InviteDialogHeader />
//     <InviteDialogEmails />
//     <InviteDialogTeams />
//     <InviteDialogMessage />
//     <InviteDialogResults />
//     <InviteDialogFooter />
//   </InviteDialog>

import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext } from "react";
import { Badge } from "../badge";
import { Button } from "../button";
import { Combobox, TagInput, type ComboboxOption } from "../combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { cx } from "../cx";
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
  /** The parts of the dialog; without them, the usual form and result. */
  children?: ReactNode;
  className?: string;
}

const OUTCOME: Record<InviteOutcome, { word: string; tone: "success" | "neutral" | "danger" }> = {
  invited: { word: "Invited", tone: "success" },
  member: { word: "Already a member", tone: "neutral" },
  invalid: { word: "Invalid", tone: "danger" },
};

const EMPTY: InviteDraft = { emails: [], teams: [], message: "" };

interface InviteContext {
  title: string;
  description: string;
  teams: ReadonlyArray<ComboboxOption> | undefined;
  draft: InviteDraft;
  setDraft: (draft: InviteDraft) => void;
  hasMessage: boolean;
  maxEmails: number;
  maxMessage: number;
  toInvite: string[];
  notes: string[];
  over: boolean;
  busy: boolean;
  result: ReadonlyArray<InviteResult> | undefined;
  submit: () => void;
  onAgain: (() => void) | undefined;
  onClose: () => void;
}

const Ctx = createContext<InviteContext | null>(null);

/** The state of the enclosing `InviteDialog`: the draft, what would be sent, the result. */
export function useInviteDialog(part = "useInviteDialog"): InviteContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside an <InviteDialog>.`);
  return ctx;
}

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
  children,
  className,
}: InviteDialogProps) {
  const [draft, setDraft] = useControllableState<InviteDraft>({ value, defaultValue, onChange });
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
  const ctx: InviteContext = {
    title,
    description,
    teams,
    draft,
    setDraft,
    hasMessage: message,
    maxEmails,
    maxMessage,
    toInvite,
    notes,
    over,
    busy,
    result,
    submit,
    onAgain,
    onClose,
  };
  const done = result !== undefined && result.length > 0;
  return (
    <Ctx.Provider value={ctx}>
      {children !== undefined ? (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
          <DialogContent className={cx("fg-adm-invite", className)}>{children}</DialogContent>
        </Dialog>
      ) : (
        <Dialog
          title={done ? "Invitations" : title}
          description={done ? inviteSummary(result) : description}
          onClose={onClose}
          className={cx("fg-adm-invite", className)}
          footer={<InviteDialogActions />}
        >
          <InviteDialogBody />
        </Dialog>
      )}
    </Ctx.Provider>
  );
}

/** The title and description; once there is a result, "Invitations" and its summary. */
export function InviteDialogHeader({ className, children, ...rest }: ComponentProps<"div">) {
  const { title, description, result } = useInviteDialog("InviteDialogHeader");
  const done = result !== undefined && result.length > 0;
  return (
    <DialogHeader data-slot="invite-dialog-header" {...rest} className={className}>
      {children ?? (
        <>
          <DialogTitle>{done ? "Invitations" : title}</DialogTitle>
          <DialogDescription>{done ? inviteSummary(result) : description}</DialogDescription>
        </>
      )}
    </DialogHeader>
  );
}

/** What the dialog shows: the result when there is one, else the three fields. */
export function InviteDialogBody() {
  const { result } = useInviteDialog("InviteDialogBody");
  return result && result.length > 0 ? (
    <InviteDialogResults />
  ) : (
    <>
      <InviteDialogEmails />
      <InviteDialogTeams />
      <InviteDialogMessage />
    </>
  );
}

/** The addresses, as a tag field that checks each one as it lands. */
export function InviteDialogEmails() {
  const { draft, setDraft, notes, over, maxEmails, result } = useInviteDialog("InviteDialogEmails");
  if (result && result.length > 0) return null;
  return (
    <Field
      label="Email addresses"
      hint={notes.join(" · ") || "Separate with a comma, a space or a new line."}
      error={over ? `At most ${maxEmails} addresses at once.` : undefined}
    >
      {(control) => (
        <TagInput
          {...control}
          data-slot="invite-dialog-emails"
          label="Email addresses"
          placeholder="name@company.com"
          value={draft.emails}
          validate={isInviteEmail}
          onChange={(emails) => setDraft({ ...draft, emails: emails.map(normalizeEmail) })}
        />
      )}
    </Field>
  );
}

/** The teams they join; nothing is drawn without `teams`. */
export function InviteDialogTeams() {
  const { teams, draft, setDraft, result } = useInviteDialog("InviteDialogTeams");
  if ((result && result.length > 0) || !teams || teams.length === 0) return null;
  return (
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
  );
}

/** The optional message; nothing is drawn with `message={false}`. */
export function InviteDialogMessage() {
  const { draft, setDraft, hasMessage, maxMessage, result } =
    useInviteDialog("InviteDialogMessage");
  if ((result && result.length > 0) || !hasMessage) return null;
  return (
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
  );
}

/** What happened to each address; nothing is drawn while there is no result. */
export function InviteDialogResults({ className, ...rest }: ComponentProps<"ul">) {
  const { result } = useInviteDialog("InviteDialogResults");
  if (!result || result.length === 0) return null;
  return (
    <ul
      data-slot="invite-dialog-results"
      aria-label="Result of each invitation"
      {...rest}
      className={cx("fg-adm-invite-results", className)}
    >
      {result.map((r) => (
        <li key={`${r.outcome}-${r.email}`} className="fg-adm-invite-result">
          <span className="fg-adm-invite-email">{r.email}</span>
          {r.detail ? <span className="fg-adm-invite-detail">{r.detail}</span> : null}
          <Badge tone={OUTCOME[r.outcome].tone}>{OUTCOME[r.outcome].word}</Badge>
        </li>
      ))}
    </ul>
  );
}

/** The buttons: Cancel and Invite, or Invite more and Done once there is a result. */
export function InviteDialogActions() {
  const { result, onAgain, onClose, busy, toInvite, over, submit } =
    useInviteDialog("InviteDialogActions");
  if (result && result.length > 0) {
    return (
      <>
        {onAgain ? <Button onClick={onAgain}>Invite more</Button> : null}
        <Button variant="primary" data-autofocus onClick={onClose}>
          Done
        </Button>
      </>
    );
  }
  return (
    <>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="primary" disabled={busy || toInvite.length === 0 || over} onClick={submit}>
        {busy ? "Sending…" : toInvite.length > 1 ? `Invite ${toInvite.length}` : "Invite"}
      </Button>
    </>
  );
}

/** The bottom row; its children replace the default buttons. */
export function InviteDialogFooter({ children, ...rest }: ComponentProps<"div">) {
  return (
    <DialogFooter data-slot="invite-dialog-footer" {...rest}>
      {children ?? <InviteDialogActions />}
    </DialogFooter>
  );
}
