// The playground page: one self-contained document, with no dependency and no build step.
// It reads the manifest from `/_play/manifest` and calls the tool through the same origin.

export const PLAYGROUND_HTML = `<!doctype html>
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
</style>
</head>
<body>
<nav id="actions" aria-label="Actions"></nav>
<main id="main"><p>Pick an action.</p></main>
<script>
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};
let manifest;
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
    const response = await fetch("/api/" + name + query, get ? {} : { method: "POST", body: JSON.stringify(body) });
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
  );
};

fetch("/_play/manifest").then((r) => r.json()).then((m) => {
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
