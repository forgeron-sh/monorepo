import type { Registry } from "@forgeron/registry";
import type { SetupCheckResult } from "@forgeron/runtime";
import { sameOriginPost } from "../identity/authn/origin";
import type { Person } from "../kernel/person";
import { errorPage } from "../pages/errors";
import { isDone, mySecretsPage } from "../pages/my-secrets";

// `/my/secrets` (D-106): the signed-in person's own secrets, in one place. The session cookie only (a
// token cannot reach it), the same-origin rule of the gateway's forms (D-049), and no value ever leaves
// the registry: the page lists names, kinds, versions and which tool uses what.

const KIND = /^[a-z][a-z0-9]*(\.[a-z0-9][a-z0-9-]*)*$/;
const MAX_VALUE = 4096;

export interface MySecretsContext {
  workspace: string;
  registry: Pick<
    Registry,
    | "addSecretVersion"
    | "bindUserSecret"
    | "createPersonSecret"
    | "currentManifest"
    | "deletePersonSecret"
    | "findTool"
    | "listPersonSecrets"
    | "readPersonSecret"
    | "readUserSecrets"
    | "readUserSetup"
    | "renamePersonSecret"
    | "unbindUserSecret"
  >;
  /** The person of the session cookie; `undefined` if there is none. */
  session(request: Request): Promise<Person | undefined>;
  /** The tool's own check of a setup (D-101). Without it nothing is checked. */
  checkSetup?(
    tool: string,
    person: Person,
    candidate: { setup: Record<string, string>; secrets: Record<string, string> },
  ): Promise<SetupCheckResult>;
}

export async function handleMySecrets(request: Request, context: MySecretsContext) {
  const url = new URL(request.url);
  const posting = request.method === "POST";
  if (request.method !== "GET" && !posting) {
    return errorPage(405, { workspace: context.workspace, headers: { allow: "GET, POST" } });
  }
  if (posting && !sameOriginPost(request)) {
    return errorPage(403, {
      workspace: context.workspace,
      detail: "This request did not come from your secrets page.",
    });
  }
  const person = await context.session(request);
  if (!person) {
    if (posting) return errorPage(401, { workspace: context.workspace });
    return new Response(null, {
      status: 302,
      headers: { location: `/auth/login?next=${encodeURIComponent("/my/secrets")}` },
    });
  }

  const list = () => context.registry.listPersonSecrets(context.workspace, person.id);
  const show = async (extra: { done?: string; error?: string; status?: number } = {}) =>
    mySecretsPage({ workspace: context.workspace, person, secrets: await list(), ...extra });
  const refuse = (error: string) => show({ error, status: 400 });
  const back = (done: string) =>
    new Response(null, { status: 303, headers: { location: `/my/secrets?done=${done}` } });

  if (!posting) {
    const done = url.searchParams.get("done");
    return show(isDone(done) ? { done } : {});
  }

  const form = await request.formData().catch(() => undefined);
  if (!form) return refuse("The form could not be read.");
  const text = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  const secrets = await list();
  const owned = (id: string) => secrets.find((s) => s.id === id);

  /**
   * Asks each tool that would get this value from now on whether it is good, before anything is kept.
   * `values` is what a tool's field would hold; the rest of the person's setup is as it is.
   */
  async function refusedByATool(
    tools: Array<{ tool: string; fields: string[] }>,
    value: string,
  ): Promise<string | undefined> {
    for (const { tool, fields } of tools) {
      const record = await context.registry.findTool(context.workspace, tool);
      if (!record || !context.checkSetup) continue;
      const manifest = await context.registry.currentManifest(record.id).catch(() => undefined);
      if (!manifest?.setup?.check) continue;
      const own = await context.registry.readUserSecrets(record.id, person!.id).catch(() => ({}));
      const verdict = await context.checkSetup(tool, person!, {
        setup: await context.registry.readUserSetup(record.id, person!.id),
        secrets: { ...own, ...Object.fromEntries(fields.map((f) => [f, value])) },
      });
      if (!verdict.ok) {
        const why = Object.values(verdict.errors).join(" ");
        return `${tool}: ${verdict.message}${why ? ` ${why}` : ""} Nothing was changed.`;
      }
    }
    return undefined;
  }

  switch (text("action")) {
    case "new": {
      const label = text("label").trim();
      const kind = text("kind").trim();
      const value = text("value");
      if (!label || label.length > 80)
        return refuse("Give the secret a name of at most 80 characters.");
      if (kind && !KIND.test(kind))
        return refuse("A kind is lower case words separated by dots, like odoo.api-key.");
      if (!value || value.length > MAX_VALUE)
        return refuse("Give a value, at most 4,096 characters.");
      await context.registry.createPersonSecret({
        workspace: context.workspace,
        person: person.id,
        label,
        value,
        ...(kind ? { kind } : {}),
      });
      return back("created");
    }
    case "version": {
      const secret = owned(text("secret"));
      const value = text("value");
      if (!secret) return refuse("That is not one of your secrets.");
      if (!value || value.length > MAX_VALUE)
        return refuse("Give a value, at most 4,096 characters.");
      // Only the tools that follow the latest version get it: a pinned one keeps its version.
      const following = new Map<string, string[]>();
      for (const u of secret.usedBy.filter((b) => b.pin === undefined)) {
        following.set(u.tool, [...(following.get(u.tool) ?? []), u.field]);
      }
      const refused = await refusedByATool(
        [...following].map(([tool, fields]) => ({ tool, fields })),
        value,
      );
      if (refused) return refuse(refused);
      await context.registry.addSecretVersion({
        workspace: context.workspace,
        person: person.id,
        secretId: secret.id,
        value,
      });
      return back("version");
    }
    case "rename": {
      const label = text("label").trim();
      if (!label || label.length > 80)
        return refuse("Give the secret a name of at most 80 characters.");
      if (
        !(await context.registry.renamePersonSecret(
          context.workspace,
          person.id,
          text("secret"),
          label,
        ))
      ) {
        return refuse("That is not one of your secrets.");
      }
      return back("renamed");
    }
    case "delete": {
      const secret = owned(text("secret"));
      if (!secret) return refuse("That is not one of your secrets.");
      if (secret.usedBy.length > 0 && text("confirm") !== "yes") {
        return refuse("Tick the box to confirm: the tools that use it will ask for a new secret.");
      }
      await context.registry.deletePersonSecret(context.workspace, person.id, secret.id);
      return back("deleted");
    }
    case "unbind":
    case "bind": {
      // Only a binding the person has: the tool, the field and the scope name it.
      const tool = text("tool");
      const field = text("field");
      const scope = text("scope");
      const record = await context.registry.findTool(context.workspace, tool);
      const has = secrets.some((s) =>
        s.usedBy.some((u) => u.tool === tool && u.field === field && u.scope === scope),
      );
      if (!record || !has) return refuse("That tool does not use one of your secrets there.");
      if (text("action") === "unbind") {
        await context.registry.unbindUserSecret({
          toolId: record.id,
          person: person.id,
          field,
          scope,
        });
        return back("unbound");
      }
      const target = owned(text("secret"));
      const pin = text("pin") === "" ? null : Number(text("pin"));
      if (!target) return refuse("That is not one of your secrets.");
      if (pin !== null && !target.history.some((h) => h.version === pin)) {
        return refuse("That secret has no such version.");
      }
      // The tool's check, on the value it would now get.
      const value = await context.registry.readPersonSecret(
        context.workspace,
        person.id,
        target.id,
        pin ?? undefined,
      );
      if (value === undefined) return refuse("That secret cannot be read.");
      const refused = await refusedByATool([{ tool, fields: [field] }], value);
      if (refused) return refuse(refused);
      await context.registry.bindUserSecret({
        toolId: record.id,
        person: person.id,
        field,
        scope,
        secretId: target.id,
        pin,
      });
      return back("bound");
    }
    default:
      return refuse("That action is not known.");
  }
}
