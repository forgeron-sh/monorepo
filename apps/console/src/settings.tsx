import {
  Badge,
  Button,
  CopyBlock,
  Dialog,
  Field,
  Input,
  Notice,
  Page,
  Select,
  Textarea,
} from "@forgeron/ui";
import { useState, type ReactNode } from "react";
import { addresses } from "@forgeron/platform-contract/client";
import {
  explain,
  ok,
  typedClient,
  typedSender,
  type Api,
  type FetchJson,
  type SendJson,
} from "./api";
import { AdminOnly, Loading, LoadError } from "./states";
import { useLoad } from "./use-load";
import type { WorkspaceInfo } from "./workspace";

// Settings: how people sign in and what the install is. One single sign-on provider at a time (OIDC
// or SAML, D-041, D-050): saving one replaces the other. A client secret goes in and never comes
// back; certificates are public. Email sign-in and its mail mode are the install's (D-049, D-051):
// shown here, changed by installing again.

export type Provider =
  | {
      kind: "oidc" | "entra" | "google";
      clientId: string;
      issuer?: string;
      tenant?: string;
      hostedDomain?: string;
      emailClaim?: string;
      groupsClaim?: string;
      groupRoles: Record<string, string>;
    }
  | {
      kind: "saml";
      idpEntityId: string;
      ssoUrl: string;
      certificates: string[];
      emailAttribute?: string;
      groupsAttribute?: string;
      nameAttribute?: string;
      groupRoles: Record<string, string>;
    };

const opt = (value: unknown) => (typeof value === "string" && value ? value : undefined);

/** The saved provider, or `null` (never `undefined`: that is "not loaded yet"). Only what the forms show is kept; no secret ever comes back. */
export async function loadProvider(fetchJson: FetchJson): Promise<Provider | null> {
  const body = ok(await typedClient(fetchJson)(addresses.getIdentityProvider)) as {
    provider?: Record<string, any> | null;
  };
  const p = body.provider;
  if (!p) return null;
  const groupRoles =
    typeof p.groupRoles === "object" && p.groupRoles !== null
      ? (Object.fromEntries(Object.entries(p.groupRoles).map(([k, v]) => [k, String(v)])) as Record<
          string,
          string
        >)
      : {};
  if (p.kind === "saml") {
    return {
      kind: "saml",
      idpEntityId: String(p.idpEntityId),
      ssoUrl: String(p.ssoUrl),
      certificates: Array.isArray(p.certificates) ? p.certificates.map(String) : [],
      ...(opt(p.emailAttribute) ? { emailAttribute: opt(p.emailAttribute)! } : {}),
      ...(opt(p.groupsAttribute) ? { groupsAttribute: opt(p.groupsAttribute)! } : {}),
      ...(opt(p.nameAttribute) ? { nameAttribute: opt(p.nameAttribute)! } : {}),
      groupRoles,
    };
  }
  const kind = p.kind === "entra" || p.kind === "google" ? p.kind : "oidc";
  return {
    kind,
    clientId: String(p.clientId),
    ...(opt(p.issuer) ? { issuer: opt(p.issuer)! } : {}),
    ...(opt(p.tenant) ? { tenant: opt(p.tenant)! } : {}),
    ...(opt(p.hostedDomain) ? { hostedDomain: opt(p.hostedDomain)! } : {}),
    ...(opt(p.emailClaim) ? { emailClaim: opt(p.emailClaim)! } : {}),
    ...(opt(p.groupsClaim) ? { groupsClaim: opt(p.groupsClaim)! } : {}),
    groupRoles,
  };
}

/** Certificates pasted one after the other: split on the end marker, each kept whole. */
export function splitCertificates(text: string): string[] {
  const end = "-----END CERTIFICATE-----";
  return text
    .split(end)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `${part}\n${end}`);
}

export interface SettingsPageProps {
  api: Api;
  ws: WorkspaceInfo;
}

/** How people sign in: email code, single sign-on. For an admin. */
export function SignInPage({ api, ws }: SettingsPageProps) {
  return (
    <Page title="Sign-in" description="How people sign in to this workspace.">
      {ws.person.admin ? <SignIn api={api} ws={ws} /> : <AdminOnly what="Sign-in" />}
    </Page>
  );
}

/** The install: its address and how to change it. For an admin. */
export function InstallPage({ ws }: { ws: WorkspaceInfo }) {
  return (
    <Page title="Install information" description="Where this workspace runs and how to change it.">
      {ws.person.admin ? <Install ws={ws} /> : <AdminOnly what="Install information" />}
    </Page>
  );
}

function Method({
  title,
  state,
  children,
}: {
  title: string;
  state: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="fc-panel" aria-label={title}>
      <div className="fc-method-head">
        <h2 className="fc-method-title">{title}</h2>
        {state}
      </div>
      <div className="fc-stack">{children}</div>
    </section>
  );
}

const on = (label = "On") => (
  <Badge tone="success" dot>
    {label}
  </Badge>
);
const off = (label = "Off") => <Badge dot>{label}</Badge>;

function SignIn({ api, ws }: { api: Api; ws: WorkspaceInfo }) {
  const provider = useLoad(() => loadProvider(api.fetchJson), [api]);
  const email = ws.signIn?.email;
  const saved = provider.data ?? undefined;
  const oidcSaved = saved && saved.kind !== "saml";
  const samlSaved = saved?.kind === "saml";
  return (
    <div className="fc-methods">
      <Method title="Email code" state={email?.enabled ? on() : off()}>
        {email?.enabled && email.mail === "email" ? (
          <p className="fc-muted" style={{ margin: 0 }}>
            People sign in with a one-time code sent to their email address. No password is stored.
          </p>
        ) : null}
        {email?.enabled && email.mail === "console" ? (
          <Notice tone="warning" title="Mail mode is console.">
            Sign-in codes are written to the Worker&apos;s logs, not mailed. Anyone who can read the
            logs can sign in as an allowed address. Use this for test installs only.
          </Notice>
        ) : null}
        {!email?.enabled ? (
          <>
            <p className="fc-muted" style={{ margin: 0 }}>
              Email sign-in is off. Turn it on by installing the platform again with{" "}
              <code>--sign-in email</code>; add <code>--mail console</code> for a test install
              without a mail domain.
            </p>
            <CopyBlock
              label="Turn on email sign-in"
              value="forgeron platform install --sign-in email"
              prefix="$"
            />
          </>
        ) : null}
      </Method>

      {provider.loading ? <Loading shape="form" label="Loading sign-in settings" /> : null}
      {provider.error && !provider.data && !provider.loading ? (
        <LoadError
          what="The single sign-on provider"
          error={provider.error}
          onRetry={provider.reload}
        />
      ) : null}
      {!provider.loading && !(provider.error && !provider.data) ? (
        <>
          <Method
            title="OpenID Connect"
            state={
              oidcSaved
                ? on("Configured")
                : ws.signIn?.oidc.configured
                  ? on("Set at install")
                  : off("Not configured")
            }
          >
            <OidcForm
              key={oidcSaved ? JSON.stringify(saved) : "none"}
              api={api}
              ws={ws}
              saved={oidcSaved ? saved : undefined}
              replaces={samlSaved}
              onChanged={provider.reload}
            />
          </Method>
          <Method title="SAML 2.0" state={samlSaved ? on("Configured") : off("Not configured")}>
            <SamlForm
              key={samlSaved ? JSON.stringify(saved) : "none"}
              api={api}
              ws={ws}
              saved={samlSaved ? saved : undefined}
              replaces={Boolean(oidcSaved)}
              onChanged={provider.reload}
            />
          </Method>
        </>
      ) : null}
    </div>
  );
}

/** Runs a save or a removal; keeps the reason and a confirmation for the form to show. */
function useAction(onDone: () => void) {
  const [state, setState] = useState<{ busy: boolean; error?: string; done?: string }>({
    busy: false,
  });
  const run = async (work: () => Promise<unknown>, done: string) => {
    setState({ busy: true });
    try {
      await work();
      setState({ busy: false, done });
      onDone();
    } catch (e) {
      setState({
        busy: false,
        error: explain(e, "It was not saved. Check the values and try again."),
      });
    }
  };
  return { ...state, run };
}

async function remove(send: SendJson) {
  ok(await typedSender(send)(addresses.deleteIdentityProvider));
}

function Outcome({ error, done }: { error?: string | undefined; done?: string | undefined }) {
  return error ? (
    <Notice tone="danger">{error}</Notice>
  ) : done ? (
    <Notice tone="success">{done}</Notice>
  ) : null;
}

function OidcForm({
  api,
  ws,
  saved,
  replaces,
  onChanged,
}: {
  api: Api;
  ws: WorkspaceInfo;
  saved: Extract<Provider, { clientId: string }> | undefined;
  replaces: boolean;
  onChanged: () => void;
}) {
  const [kind, setKind] = useState<"oidc" | "entra" | "google">(saved?.kind ?? "oidc");
  const [clientId, setClientId] = useState(saved?.clientId ?? "");
  const [secret, setSecret] = useState("");
  const [issuer, setIssuer] = useState(saved?.issuer ?? "");
  const [tenant, setTenant] = useState(saved?.tenant ?? "");
  const [hostedDomain, setHostedDomain] = useState(saved?.hostedDomain ?? "");
  const [emailClaim, setEmailClaim] = useState(saved?.emailClaim ?? "");
  const [groupsClaim, setGroupsClaim] = useState(saved?.groupsClaim ?? "");
  const [removing, setRemoving] = useState(false);
  const action = useAction(onChanged);

  return (
    <>
      <p className="fc-muted" style={{ margin: 0 }}>
        Sign in with your company account: Microsoft Entra ID, Google Workspace or any OpenID
        Connect provider.
      </p>
      <CopyBlock
        label="Redirect URI to register at the provider"
        value={`${ws.endpoint}/auth/callback`}
      />
      {replaces ? (
        <Notice tone="warning">SAML is configured. Saving OpenID Connect replaces it.</Notice>
      ) : null}
      <form
        className="fc-stack"
        onSubmit={(event) => {
          event.preventDefault();
          void action.run(
            () =>
              typedSender(api.sendJson)(addresses.putIdentityProvider, {
                json: {
                  kind,
                  clientId: clientId.trim(),
                  ...(secret ? { clientSecret: secret } : {}),
                  ...(kind === "oidc" ? { issuer: issuer.trim() } : {}),
                  ...(kind === "entra" ? { tenant: tenant.trim() } : {}),
                  ...(kind === "google" ? { hostedDomain: hostedDomain.trim() } : {}),
                  ...(emailClaim.trim() ? { emailClaim: emailClaim.trim() } : {}),
                  ...(groupsClaim.trim() ? { groupsClaim: groupsClaim.trim() } : {}),
                  ...(saved && Object.keys(saved.groupRoles).length
                    ? { groupRoles: saved.groupRoles }
                    : {}),
                },
              }),
            "OpenID Connect saved. It applies to the next sign-in.",
          );
        }}
      >
        <div className="fc-row">
          <Field label="Provider">
            {(control) => (
              <Select
                {...control}
                value={kind}
                onChange={(e) => setKind(e.target.value as typeof kind)}
                options={[
                  { value: "oidc", label: "Any OpenID Connect provider" },
                  { value: "entra", label: "Microsoft Entra ID" },
                  { value: "google", label: "Google Workspace" },
                ]}
              />
            )}
          </Field>
          <Field label="Client ID">
            {(control) => (
              <Input
                {...control}
                mono
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            )}
          </Field>
        </div>
        <div className="fc-row">
          {kind === "oidc" ? (
            <Field label="Issuer URL" hint="An https address.">
              {(control) => (
                <Input
                  {...control}
                  mono
                  required
                  type="url"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="https://login.example.com"
                />
              )}
            </Field>
          ) : null}
          {kind === "entra" ? (
            <Field label="Directory (tenant) ID" hint="Only people of this directory can sign in.">
              {(control) => (
                <Input
                  {...control}
                  mono
                  required
                  value={tenant}
                  onChange={(e) => setTenant(e.target.value)}
                />
              )}
            </Field>
          ) : null}
          {kind === "google" ? (
            <Field label="Workspace domain" hint="Only people of this domain can sign in.">
              {(control) => (
                <Input
                  {...control}
                  mono
                  required
                  value={hostedDomain}
                  onChange={(e) => setHostedDomain(e.target.value)}
                  placeholder="acme.fr"
                />
              )}
            </Field>
          ) : null}
          <Field
            label="Client secret"
            hint={
              saved
                ? "A secret is kept. Leave empty to keep it."
                : "Stored sealed. It is never shown again."
            }
          >
            {(control) => (
              <Input
                {...control}
                mono
                type="password"
                autoComplete="off"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
            )}
          </Field>
        </div>
        <div className="fc-row">
          <Field label="Email claim" hint="Optional. The claim that holds the email address.">
            {(control) => (
              <Input
                {...control}
                mono
                value={emailClaim}
                onChange={(e) => setEmailClaim(e.target.value)}
                placeholder="email"
              />
            )}
          </Field>
          <Field label="Groups claim" hint="Optional. The claim that holds the groups.">
            {(control) => (
              <Input
                {...control}
                mono
                value={groupsClaim}
                onChange={(e) => setGroupsClaim(e.target.value)}
                placeholder="groups"
              />
            )}
          </Field>
        </div>
        <Outcome error={action.error} done={action.done} />
        <div className="fc-form-actions">
          <Button type="submit" variant="primary" disabled={action.busy}>
            Save OpenID Connect
          </Button>
          {saved ? (
            <Button variant="danger" onClick={() => setRemoving(true)} disabled={action.busy}>
              Remove provider
            </Button>
          ) : null}
        </div>
      </form>
      {removing ? (
        <RemoveProvider
          what="OpenID Connect"
          onClose={() => setRemoving(false)}
          confirm={() => {
            setRemoving(false);
            void action.run(() => remove(api.sendJson), "The provider is removed.");
          }}
        />
      ) : null}
    </>
  );
}

function SamlForm({
  api,
  ws,
  saved,
  replaces,
  onChanged,
}: {
  api: Api;
  ws: WorkspaceInfo;
  saved: Extract<Provider, { kind: "saml" }> | undefined;
  replaces: boolean;
  onChanged: () => void;
}) {
  const [entityId, setEntityId] = useState(saved?.idpEntityId ?? "");
  const [ssoUrl, setSsoUrl] = useState(saved?.ssoUrl ?? "");
  const [certs, setCerts] = useState(saved?.certificates.join("\n") ?? "");
  const [emailAttribute, setEmailAttribute] = useState(saved?.emailAttribute ?? "");
  const [groupsAttribute, setGroupsAttribute] = useState(saved?.groupsAttribute ?? "");
  const [nameAttribute, setNameAttribute] = useState(saved?.nameAttribute ?? "");
  const [removing, setRemoving] = useState(false);
  const action = useAction(onChanged);
  return (
    <>
      <p className="fc-muted" style={{ margin: 0 }}>
        Sign in through a SAML 2.0 identity provider. Paste its public certificates; nothing secret
        is stored.
      </p>
      <div className="fc-row" style={{ alignItems: "stretch" }}>
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <CopyBlock
            label="Entity ID (service provider)"
            value={`${ws.endpoint}/auth/saml/metadata`}
          />
        </div>
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <CopyBlock
            label="Reply URL (assertion consumer service)"
            value={`${ws.endpoint}/auth/saml/acs`}
          />
        </div>
      </div>
      {replaces ? (
        <Notice tone="warning">OpenID Connect is configured. Saving SAML replaces it.</Notice>
      ) : null}
      <form
        className="fc-stack"
        onSubmit={(event) => {
          event.preventDefault();
          void action.run(
            () =>
              typedSender(api.sendJson)(addresses.putIdentityProvider, {
                json: {
                  kind: "saml",
                  idpEntityId: entityId.trim(),
                  ssoUrl: ssoUrl.trim(),
                  certificates: splitCertificates(certs),
                  ...(emailAttribute.trim() ? { emailAttribute: emailAttribute.trim() } : {}),
                  ...(groupsAttribute.trim() ? { groupsAttribute: groupsAttribute.trim() } : {}),
                  ...(nameAttribute.trim() ? { nameAttribute: nameAttribute.trim() } : {}),
                  ...(saved && Object.keys(saved.groupRoles).length
                    ? { groupRoles: saved.groupRoles }
                    : {}),
                },
              }),
            "SAML saved. It applies to the next sign-in.",
          );
        }}
      >
        <div className="fc-row">
          <Field label="Identity provider entity ID">
            {(control) => (
              <Input
                {...control}
                mono
                required
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
              />
            )}
          </Field>
          <Field label="Sign-on URL" hint="An https address.">
            {(control) => (
              <Input
                {...control}
                mono
                required
                type="url"
                value={ssoUrl}
                onChange={(e) => setSsoUrl(e.target.value)}
              />
            )}
          </Field>
        </div>
        <Field
          label="Certificates"
          hint="One to five PEM certificates, one after the other. More than one lets the provider rotate its key."
        >
          {(control) => (
            <Textarea
              {...control}
              mono
              required
              rows={5}
              value={certs}
              onChange={(e) => setCerts(e.target.value)}
              placeholder={"-----BEGIN CERTIFICATE-----\n…\n-----END CERTIFICATE-----"}
            />
          )}
        </Field>
        <div className="fc-row">
          <Field label="Email attribute" hint="Optional.">
            {(control) => (
              <Input
                {...control}
                mono
                value={emailAttribute}
                onChange={(e) => setEmailAttribute(e.target.value)}
              />
            )}
          </Field>
          <Field label="Groups attribute" hint="Optional.">
            {(control) => (
              <Input
                {...control}
                mono
                value={groupsAttribute}
                onChange={(e) => setGroupsAttribute(e.target.value)}
              />
            )}
          </Field>
          <Field label="Name attribute" hint="Optional.">
            {(control) => (
              <Input
                {...control}
                mono
                value={nameAttribute}
                onChange={(e) => setNameAttribute(e.target.value)}
              />
            )}
          </Field>
        </div>
        <Outcome error={action.error} done={action.done} />
        <div className="fc-form-actions">
          <Button type="submit" variant="primary" disabled={action.busy}>
            Save SAML
          </Button>
          {saved ? (
            <Button variant="danger" onClick={() => setRemoving(true)} disabled={action.busy}>
              Remove provider
            </Button>
          ) : null}
        </div>
      </form>
      {removing ? (
        <RemoveProvider
          what="SAML"
          onClose={() => setRemoving(false)}
          confirm={() => {
            setRemoving(false);
            void action.run(() => remove(api.sendJson), "The provider is removed.");
          }}
        />
      ) : null}
    </>
  );
}

function RemoveProvider({
  what,
  onClose,
  confirm,
}: {
  what: string;
  onClose: () => void;
  confirm: () => void;
}) {
  return (
    <Dialog
      title={`Remove ${what}?`}
      description="People who sign in through it can no longer do so. Other methods, and sessions already open, are not affected."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} data-autofocus>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm}>
            Remove provider
          </Button>
        </>
      }
    />
  );
}

function Install({ ws }: { ws: WorkspaceInfo }) {
  return (
    <div className="fc-methods">
      <section className="fc-panel" aria-label="This install">
        <dl className="fc-dl">
          <dt>Workspace</dt>
          <dd className="fc-mono">{ws.workspace}</dd>
          <dt>Endpoint</dt>
          <dd className="fc-mono">{ws.endpoint}</dd>
          <dt>Base domain</dt>
          <dd className="fc-mono">{ws.install?.baseDomain ?? "Unknown"}</dd>
          <dt>Gateway version</dt>
          <dd className="fc-mono">{ws.install?.version ?? "Unknown"}</dd>
          <dt>Gateway commit</dt>
          <dd className="fc-mono">{ws.install?.commit?.slice(0, 12) ?? "Unknown"}</dd>
          <dt>Signed in as</dt>
          <dd className="fc-mono">{ws.person.email}</dd>
        </dl>
      </section>
      <section className="fc-panel fc-stack" aria-label="Change the install">
        <h2 className="fc-method-title">Change the install</h2>
        <p className="fc-muted" style={{ margin: 0 }}>
          The sign-in methods, the mail sender and the Cloudflare account belong to the install. To
          change them, run <code>forgeron platform install</code> again with the flags you want; the
          self-host guide lists them.
        </p>
      </section>
    </div>
  );
}
