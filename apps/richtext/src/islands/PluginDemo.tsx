import { fromMarkdown, type RichDoc } from "@forgeron/richtext";
import { RichTextEditor } from "@forgeron/richtext/react";
import "@forgeron/richtext/styles.css";
import { Segmented } from "@forgeron/ui";
import { useMemo, useState } from "react";
import { catalog, docOf } from "../lib/catalog";
import { FAMILY_COMPANIONS, demoSetup, needsUpload } from "../lib/demo-options";
import { pluginsFor, problemWith, registry, withRequires } from "../lib/registry";
import { Output } from "./shared";

/** Plugins an interface plugin needs around it to show anything. */
const COMPANIONS = [
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
  "heading",
  "bulletList",
  "orderedList",
  "taskList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "table",
  "image",
];

const FALLBACK = "Try it here.\n\nSelect a word, press / on an empty line, or type.";

/** The live demo of one plugin: an editor that has it, what it requires, and the menus to reach it. */
export default function PluginDemo({ id }: { id: string }) {
  const doc = docOf(id);
  const found = registry.has(id);
  const [failing, setFailing] = useState("works");
  const ids = useMemo(() => {
    const own = id === "core" ? [] : [id];
    const interfacePlugin = doc?.family === "interface";
    const base = interfacePlugin ? COMPANIONS.filter((c) => registry.has(c)) : [];
    // The core and the placeholder are shown bare: the point is how little there is.
    const bare = doc?.family === "core";
    const withUi = (bare ? ["placeholder"] : ["placeholder", "slash", "bubble"]).filter((c) =>
      registry.has(c),
    );
    const family = (FAMILY_COMPANIONS[doc?.family ?? ""] ?? []).filter((c) => registry.has(c));
    return withRequires([...base, ...own, ...family, ...withUi]);
  }, [id, doc]);
  const plugins = useMemo(() => pluginsFor(ids), [ids]);
  const inPlay = useMemo(() => catalog.filter((d) => ids.includes(d.id)), [ids]);
  // Fake providers for every option any plugin documents: a plugin reads only its own.
  const setup = useMemo(() => demoSetup(catalog, failing === "fails"), [failing]);
  const problem = useMemo(() => problemWith(ids), [ids]);
  const cores = useMemo(() => plugins.map((p) => p.core), [plugins]);
  const [value, setValue] = useState<RichDoc>(() => {
    const sample = doc?.markdown;
    // The sample is read with the plugins of the demo: what none of them reads stays plain text.
    return fromMarkdown(sample ? `${sample}\n` : FALLBACK, cores);
  });
  if (!found) {
    return (
      <p className="t-mono dim rt-empty">
        This plugin has no editor half in the package yet, so there is no live demo.
      </p>
    );
  }
  if (problem) {
    return <p className="t-mono dim rt-empty">These plugins do not go together: {problem}</p>;
  }
  const uploads = needsUpload(inPlay);
  return (
    <div className="rt-stack">
      <p className="t-mono dim rt-ids">
        in this editor: core, {plugins.map((p) => p.core.id).join(", ")}
      </p>
      {uploads ? (
        <Segmented
          label="Fake upload"
          value={failing}
          onChange={setFailing}
          options={[
            { value: "works", label: "Upload works" },
            { value: "fails", label: "Upload fails" },
          ]}
        />
      ) : null}
      <div className="rt-box">
        <RichTextEditor
          key={failing}
          value={value}
          onChange={setValue}
          plugins={plugins}
          pluginOptions={setup.pluginOptions}
          mentions={setup.mentions}
          references={setup.references}
          requestImage={setup.requestImage}
          placeholder="Type / for blocks"
          label={`Demo of the ${doc?.name ?? id} plugin`}
        />
      </div>
      <Output doc={value} plugins={plugins} />
    </div>
  );
}
