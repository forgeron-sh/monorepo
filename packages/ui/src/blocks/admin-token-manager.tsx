// Personal or service tokens: the list (name, scopes, created, last used, expiry), a dialog to
// create one (name, scopes, expiry), the token shown once with a plain warning to copy it now,
// and revoking with a confirmation. The component never holds a secret: the app creates the
// token and hands it back in `created`; it is shown until the dialog closes, then it is gone.

import { PlusSignIcon } from "@forgeron/icons";
import { useState } from "react";
import { Badge } from "../badge";
import { Banner } from "../banner";
import { Button } from "../button";
import { Segmented } from "../controls";
import { CopyBlock } from "../copy-block";
import { cx } from "../cx";
import { Dialog } from "../dialog";
import { Checkbox, Field, Input } from "../form";
import { Icon } from "../icon";
import {
  adminPlural,
  EXPIRY_CHOICES,
  expiryDay,
  groupScopes,
  relativeDay,
  formatAdminDate,
  tokenExpiry,
  tokenExpiryText,
  tokenProblems,
  toggleIn,
  visibleScopes,
  type ApiToken,
  type ExpiryChoice,
  type NewTokenInput,
  type TokenScope,
} from "./admin-model";
import { AdminConfirm } from "./admin-parts";

export interface CreatedToken {
  name: string;
  /** The token itself. Shown once, never stored by the block. */
  secret: string;
}

export interface TokenManagerProps {
  tokens: ReadonlyArray<ApiToken>;
  /** Every scope a token can have. */
  scopes: ReadonlyArray<TokenScope>;
  /** Today, `YYYY-MM-DD`: expiries and last use are told from it. */
  today: string;
  /** The form was filled in: create the token, then pass it back as `created`. */
  onCreate: (input: NewTokenInput) => void;
  /** The person confirmed: revoke the token. */
  onRevoke: (id: string) => void;
  /** The token that was just created. While present, it is shown once with a warning. */
  created?: CreatedToken | null;
  /** The reveal was closed: drop `created` from the app's state. */
  onCreatedClose?: () => void;
  /** The create request is on its way. */
  busy?: boolean;
  expiryChoices?: ReadonlyArray<ExpiryChoice>;
  /** What the list says when there is none. */
  empty?: string;
  className?: string;
}

const TODAY_HINT = "A token cannot be shown again after this.";

/** The tokens of an account or a workspace, with create, shown-once reveal and revoke. */
export function TokenManager({
  tokens,
  scopes,
  today,
  onCreate,
  onRevoke,
  created,
  onCreatedClose,
  busy = false,
  expiryChoices = EXPIRY_CHOICES,
  empty = "No tokens yet.",
  className,
}: TokenManagerProps) {
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiToken | null>(null);
  const scopeName = (id: string) => scopes.find((s) => s.id === id)?.label ?? id;

  return (
    <section className={cx("fg-adm fg-adm-tokens", className)}>
      <div className="fg-adm-bar">
        <span className="fg-adm-count">{adminPlural(tokens.length, "token")}</span>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Icon icon={PlusSignIcon} size={12} variant="mono" />
          Create token
        </Button>
      </div>
      {tokens.length === 0 ? (
        <p className="fg-adm-empty">{empty}</p>
      ) : (
        <div className="fg-adm-tablewrap">
          <table className="fg-adm-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Scopes</th>
                <th scope="col">Created</th>
                <th scope="col">Last used</th>
                <th scope="col">Expires</th>
                <th scope="col">
                  <span className="fg-sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => {
                const expiry = tokenExpiry(t, today);
                const { shown, more } = visibleScopes(t.scopes, 3);
                return (
                  <tr key={t.id}>
                    <th scope="row" className="fg-adm-token-name">
                      <span>{t.name}</span>
                      {t.prefix ? <span className="fg-adm-mono-dim">{t.prefix}…</span> : null}
                    </th>
                    <td>
                      <span className="fg-adm-chips">
                        {shown.map((s) => (
                          <Badge key={s} mono>
                            {scopeName(s)}
                          </Badge>
                        ))}
                        {more ? (
                          <span title={t.scopes.slice(3).map(scopeName).join(", ")}>
                            <Badge>+{more}</Badge>
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td>{formatAdminDate(t.createdAt, Number(today.slice(0, 4)))}</td>
                    <td>{t.lastUsedAt ? relativeDay(t.lastUsedAt, today) : "Never"}</td>
                    <td>
                      {expiry.state === "expired" ? (
                        <Badge tone="danger">{tokenExpiryText(t, today)}</Badge>
                      ) : expiry.state === "soon" ? (
                        <Badge tone="warning">{tokenExpiryText(t, today)}</Badge>
                      ) : (
                        tokenExpiryText(t, today)
                      )}
                    </td>
                    <td className="fg-adm-actions">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Revoke ${t.name}`}
                        onClick={() => setRevoking(t)}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating && !created ? (
        <CreateTokenDialog
          scopes={scopes}
          today={today}
          existing={tokens}
          busy={busy}
          choices={expiryChoices}
          onClose={() => setCreating(false)}
          onCreate={onCreate}
        />
      ) : null}
      {created ? (
        <Dialog
          title="Copy your token now"
          description={`“${created.name}” is created.`}
          className="fg-adm-reveal"
          onClose={() => {
            setCreating(false);
            onCreatedClose?.();
          }}
          footer={
            <Button
              variant="primary"
              onClick={() => {
                setCreating(false);
                onCreatedClose?.();
              }}
            >
              I have copied it
            </Button>
          }
        >
          <Banner tone="warning" title="Shown once">
            {TODAY_HINT} Store it in a password manager or a secret store before closing.
          </Banner>
          <CopyBlock label={`Token ${created.name}`} value={created.secret} />
        </Dialog>
      ) : null}
      {revoking ? (
        <AdminConfirm
          title={`Revoke “${revoking.name}”?`}
          description="Anything using this token stops working at once. This cannot be undone."
          confirmLabel="Revoke token"
          onCancel={() => setRevoking(null)}
          onConfirm={() => {
            onRevoke(revoking.id);
            setRevoking(null);
          }}
        />
      ) : null}
    </section>
  );
}

function CreateTokenDialog({
  scopes,
  today,
  existing,
  busy,
  choices,
  onClose,
  onCreate,
}: {
  scopes: ReadonlyArray<TokenScope>;
  today: string;
  existing: ReadonlyArray<ApiToken>;
  busy: boolean;
  choices: ReadonlyArray<ExpiryChoice>;
  onClose: () => void;
  onCreate: (input: NewTokenInput) => void;
}) {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [expiry, setExpiry] = useState(
    choices.find((c) => c.value === "30")?.value ?? choices[0]!.value,
  );
  const [tried, setTried] = useState(false);
  const input = (): NewTokenInput => ({
    name: name.trim(),
    scopes: picked,
    expiresAt: expiryDay(today, choices.find((c) => c.value === expiry)?.days ?? null),
  });
  const problems = tokenProblems(input(), existing);
  const submit = () => {
    setTried(true);
    if (problems.name || problems.scopes || busy) return;
    onCreate(input());
  };
  return (
    <Dialog
      title="Create a token"
      description="Give it only the scopes it needs. You will see the token once."
      onClose={onClose}
      className="fg-adm-create"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy} onClick={submit}>
            {busy ? "Creating…" : "Create token"}
          </Button>
        </>
      }
    >
      <Field
        label="Name"
        hint="What it is for: “CI deploy”."
        error={tried ? problems.name : undefined}
      >
        {(control) => (
          <Input
            {...control}
            value={name}
            maxLength={80}
            autoComplete="off"
            onChange={(e) => setName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        )}
      </Field>
      <fieldset className="fg-adm-scopes">
        <legend>Scopes</legend>
        {groupScopes(scopes).map(({ group, scopes: list }) => (
          <div key={group ?? "_"} className="fg-adm-scopegroup">
            {group ? <span className="fg-adm-scopegroup-name">{group}</span> : null}
            {list.map((s) => (
              <div key={s.id} className="fg-adm-scope">
                <Checkbox
                  label={s.label}
                  checked={picked.includes(s.id)}
                  onChange={(e) => setPicked(toggleIn(picked, s.id, e.currentTarget.checked))}
                />
                {s.description ? <span className="fg-adm-scope-desc">{s.description}</span> : null}
              </div>
            ))}
          </div>
        ))}
        {tried && problems.scopes ? (
          <p className="fg-adm-error" role="alert">
            {problems.scopes}
          </p>
        ) : null}
      </fieldset>
      <div className="fg-adm-expiry">
        <span className="fg-adm-expiry-label">Expires</span>
        <Segmented
          label="Expiry"
          options={choices.map((c) => ({ value: c.value, label: c.label }))}
          value={expiry}
          onChange={setExpiry}
        />
      </div>
    </Dialog>
  );
}
