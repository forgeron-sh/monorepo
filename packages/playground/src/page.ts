// The playground page: one self-contained document, with no dependency and no build step.
// It reads the manifest from `manifestUrl` and calls the tool through the same origin, below `base`.

export interface PlaygroundOptions {
  /** Where the tool is mounted on the origin: `""` locally, `/t/crm` on the platform. */
  base: string;
  /** Where the page reads the manifest it lists the actions from. */
  manifestUrl: string;
}

// The two values are JSON in a script: `<` is escaped so that neither can close the element.
const literal = (value: string) => JSON.stringify(value).replaceAll("<", "\\u003c");

export function playgroundHtml(options: PlaygroundOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Forgeron playground</title>
<style>
  :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
  body { margin: 0; display: grid; grid-template-columns: 18rem 1fr; min-height: 100vh; }
  nav { border-right: 1px solid #8884; padding: 1rem; overflow: auto; }
  nav button { display: block; width: 100%; text-align: left; margin: 0 0 .25rem; padding: .4rem .6rem;
    border: 0; border-radius: 6px; background: none; color: inherit; font: inherit; cursor: pointer; }
  nav button[aria-current="true"] { background: #8883; font-weight: 600; }
  main { padding: 1.5rem; max-width: 48rem; }
  label { display: block; margin: .75rem 0 .25rem; font-weight: 600; }
  small { display: block; opacity: .7; font-weight: 400; }
  input:not([type=checkbox]), select, textarea { width: 100%; box-sizing: border-box; padding: .4rem; font: inherit; }
  textarea { min-height: 5rem; font-family: ui-monospace, monospace; }
  .run { margin-top: 1rem; padding: .5rem 1.2rem; font: inherit; cursor: pointer; }
  pre { background: #8882; padding: 1rem; border-radius: 6px; overflow: auto; white-space: pre-wrap; }
  .error { color: #c0392b; }
  h2 { font-size: 1rem; margin: 2rem 0 .5rem; }
  details { margin: .5rem 0; }
  summary { cursor: pointer; font-weight: 600; }
</style>
</head>
<body>
<nav id="actions" aria-label="Actions"></nav>
<main id="main"><p>Pick an action.</p></main>
<script>
const BASE = ${literal(options.base)};
const MANIFEST_URL = ${literal(options.manifestUrl)};
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};
let manifest;
let mcpTools = [];
let cliCommands = [];
const json = (value) => JSON.stringify(value, null, 2);
const actionsNav = document.getElementById("actions");
const main = document.getElementById("main");

const fieldOf = (name, schema, required) => {
  const id = "f-" + name;
  const label = el("label", { htmlFor: id }, name + (required ? " *" : ""));
  if (schema.description) label.append(el("small", {}, schema.description));
  let input;
  if (Array.isArray(schema.enum)) {
    input = el("select", { id });
    if (!required) input.append(el("option", { value: "" }, ""));
    for (const value of schema.enum) input.append(el("option", { value: String(value) }, String(value)));
    input.kind = "enum";
  } else if (schema.type === "boolean") {
    input = el("input", { id, type: "checkbox", checked: schema.default === true });
    input.kind = "boolean";
  } else if (schema.type === "number" || schema.type === "integer") {
    input = el("input", { id, type: "number", step: schema.type === "integer" ? "1" : "any" });
    input.kind = "number";
  } else if (schema.type === "string") {
    input = el("input", { id, type: "text" });
    input.kind = "string";
  } else {
    input = el("textarea", { id, placeholder: "JSON" });
    input.kind = "json";
  }
  if (schema.default !== undefined && input.kind !== "boolean" && input.kind !== "json") input.value = String(schema.default);
  input.fieldName = name;
  return { label, input };
};

// An empty optional field is left out; a value that does not parse is reported, not sent.
const valueOf = (input) => {
  if (input.kind === "boolean") return input.checked;
  if (input.value === "") return undefined;
  if (input.kind === "number") return Number(input.value);
  if (input.kind === "json") return JSON.parse(input.value);
  return input.value;
};

const show = (name) => {
  const action = manifest.actions[name];
  for (const button of actionsNav.children) button.setAttribute("aria-current", String(button.dataset.name === name));
  const properties = action.input.properties || {};
  const required = new Set(action.input.required || []);
  const form = el("form");
  const inputs = [];
  for (const [field, schema] of Object.entries(properties)) {
    const { label, input } = fieldOf(field, schema, required.has(field));
    inputs.push(input);
    form.append(label, input);
  }
  form.append(el("button", { className: "run", type: "submit" }, "Run"));
  const result = el("pre", { id: "result", hidden: true });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (action.confirm && !confirm("Run " + name + "? This action is destructive.")) return;
    result.hidden = false;
    result.className = "";
    let body = {};
    try {
      for (const input of inputs) {
        const value = valueOf(input);
        if (value !== undefined) body[input.fieldName] = value;
      }
    } catch (error) {
      result.className = "error";
      result.textContent = "Invalid input: " + error.message;
      return;
    }
    const get = action.http.method === "GET";
    const query = get ? "?" + new URLSearchParams(Object.entries(body).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)])) : "";
    result.textContent = "…";
    const response = await fetch(BASE + "/api/" + name + query, get ? {} : { method: "POST", body: JSON.stringify(body) });
    const text = await response.text();
    let shown = text;
    try { shown = JSON.stringify(JSON.parse(text), null, 2); } catch {}
    result.className = response.ok ? "" : "error";
    result.textContent = response.status + "\\n" + shown;
  });
  main.replaceChildren(
    el("h1", {}, name),
    el("p", {}, action.description),
    el("p", {}, el("small", {}, "access: " + action.access + (action.confirm ? " · asks for confirmation" : ""))),
    form,
    result,
    el("h2", {}, "What each interface sees"),
    preview(name, action),
  );
};

// What Claude, the API and the CLI are given of the action, as the running tool reports it.
const preview = (name, action) => {
  const part = (title, ...lines) => el("details", {}, el("summary", {}, title), el("pre", {}, lines.join("\\n")));
  const mcp = mcpTools.find((t) => t.name === mcpName(name));
  const cli = cliCommands.find((c) => c.action === name);
  const api = action.http.method + " /api/" + name;
  return el(
    "div",
    {},
    part("MCP", mcp ? mcp.name + "\\n" + (mcp.description || "") + "\\n\\n" + json(mcp.inputSchema) : "Not exposed to this identity."),
    part("API", action.interfaces.includes("api") ? api + "\\n\\n" + json(action.input) : "Not exposed."),
    part(
      "CLI",
      cli
        ? [cli.command + cli.args.map((a) => " <" + a.name + ">").join("")]
            .concat(cli.options.map((o) => "  " + o.flag + " (" + o.type + (o.required ? ", required" : "") + ")" + (o.description ? " " + o.description : "")))
            .join("\\n")
        : "Not exposed to this identity.",
    ),
  );
};
const mcpName = (name) => manifest.name + "_" + name.replaceAll(".", "_");

const load = async () => {
  const m = await (await fetch(MANIFEST_URL)).json();
  const list = await (await fetch(BASE + "/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) })).json();
  mcpTools = (list.result && list.result.tools) || [];
  const cli = await fetch(BASE + "/cli", { headers: { accept: "application/json" } });
  cliCommands = cli.ok ? (await cli.json()).commands : [];
  return m;
};
load().then((m) => {
  manifest = m;
  document.title = (m.title || m.name) + " · Forgeron playground";
  const names = Object.keys(m.actions).filter((n) => m.actions[n].interfaces.includes("api"));
  if (!names.length) main.replaceChildren(el("p", {}, "This tool has no action on the API."));
  for (const name of names) {
    const button = el("button", { type: "button" }, name);
    button.dataset.name = name;
    button.addEventListener("click", () => show(name));
    actionsNav.append(button);
  }
});
</script>
</body>
</html>
`;
}
