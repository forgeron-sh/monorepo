import { actionAddresses, optionFlag } from "@forgeron/manifest";
import type { Engine } from "./engine";
import { EXIT_CODE, type Manifest, type User } from "./types";

// `/cli`: the command manifest the `forgeron` binary fetches (sdk.md §5, §7). It is derived
// from the manifest: the positional arguments of `cli.args`, one option per other input field.

interface Property {
  type?: unknown;
  description?: unknown;
  default?: unknown;
}

function optionType(property: Property): "string" | "number" | "integer" | "boolean" | "json" {
  const { type } = property;
  return type === "string" || type === "number" || type === "integer" || type === "boolean"
    ? type
    : "json";
}

function commandOf(tool: string, name: string, entry: Manifest["actions"][string]) {
  const properties = (entry.input.properties ?? {}) as Record<string, Property>;
  const required = new Set(Array.isArray(entry.input.required) ? entry.input.required : []);
  const describe = (field: string, property: Property) => ({
    name: field,
    type: optionType(property),
    required: required.has(field),
    ...(typeof property.description === "string" ? { description: property.description } : {}),
    ...(property.default !== undefined ? { default: property.default } : {}),
  });
  return {
    action: name,
    command: actionAddresses(tool, name).cli,
    path: name.split("."),
    description: entry.description,
    confirm: entry.confirm,
    args: entry.cli.args.map((field) => describe(field, properties[field] ?? {})),
    options: Object.entries(properties)
      .filter(([field]) => !entry.cli.args.includes(field))
      .map(([field, property]) => ({ ...describe(field, property), flag: optionFlag(field) })),
  };
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function handleCli(
  request: Request,
  engine: Engine,
  manifest: Manifest,
  user: User,
): Response {
  if (request.method !== "GET") {
    return new Response(null, { status: 405, headers: { allow: "GET" } });
  }
  const commands = engine
    .list(user, "cli")
    .map(({ name, entry }) => commandOf(manifest.name, name, entry));

  if (request.headers.get("accept")?.includes("text/html")) {
    const items = commands
      .map(
        (c) =>
          `<li><code>forgeron ${escapeHtml(manifest.name)} ${escapeHtml(c.path.join(" "))}</code> — ${escapeHtml(c.description)}</li>`,
      )
      .join("");
    const html = `<!doctype html><meta charset="utf-8"><title>${escapeHtml(manifest.name)}</title><h1>${escapeHtml(manifest.title ?? manifest.name)}</h1><p>Install the CLI, run <code>forgeron login</code>, then:</p><ul>${items}</ul>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  return Response.json({
    tool: manifest.name,
    version: manifest.version,
    ...(manifest.title ? { title: manifest.title } : {}),
    // How the binary exits for each error code: the server is the one source of the table.
    exitCodes: EXIT_CODE,
    commands,
  });
}
