import { toMarkdown, toPlainText, type RichDoc } from "@forgeron/richtext";
import type { EditorPlugin } from "@forgeron/richtext/plugins/editor";
import { Checkbox, Segmented } from "@forgeron/ui";
import { useMemo, useState } from "react";
import { registry, withAdded, without } from "../lib/registry";

/** What the toggles need to know of a plugin: the catalog docs, as plain data. */
export interface Entry {
  id: string;
  name: string;
  family: string;
  familyLabel: string;
}

/** Only the plugins whose editor half the package has (a doc with no half yet is not toggled). */
export const available = (entries: ReadonlyArray<Entry>): Entry[] =>
  entries.filter((e) => e.id !== "core" && registry.has(e.id));

/** One checkbox per plugin, by family. Checking a plugin brings what it requires; unchecking one takes its dependents. */
export function Toggles({
  entries,
  selected,
  onChange,
}: {
  entries: ReadonlyArray<Entry>;
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
}) {
  const families = useMemo(() => {
    const map = new Map<string, { label: string; entries: Entry[] }>();
    for (const e of entries) {
      const f = map.get(e.family) ?? { label: e.familyLabel, entries: [] };
      f.entries.push(e);
      map.set(e.family, f);
    }
    return [...map.entries()];
  }, [entries]);
  return (
    <div className="rt-toggles" role="group" aria-label="Plugins">
      {families.map(([id, family]) => (
        <div key={id} className="rt-toggle-family" role="group" aria-label={family.label}>
          <span className="t-mono dim rt-toggle-label">{family.label}</span>
          {family.entries.map((e) => (
            <Checkbox
              key={e.id}
              label={e.name}
              checked={selected.has(e.id)}
              onChange={(ev) =>
                onChange(ev.target.checked ? withAdded(selected, e.id) : without(selected, e.id))
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export type OutputKind = "markdown" | "json" | "text";

/** The document as Markdown, JSON or plain text, written with the plugins of the editor. */
export function Output({
  doc,
  plugins,
  initial = "markdown",
}: {
  doc: RichDoc;
  plugins: ReadonlyArray<EditorPlugin>;
  initial?: OutputKind;
}) {
  const [tab, setTab] = useState<string>(initial);
  const cores = useMemo(() => plugins.map((p) => p.core), [plugins]);
  const output = useMemo(() => {
    if (tab === "json") return JSON.stringify(doc, null, 2);
    if (tab === "text") return toPlainText(doc, {}, cores);
    return toMarkdown(doc, cores);
  }, [doc, tab, cores]);
  return (
    <div className="rt-output">
      <Segmented
        label="Output"
        value={tab}
        onChange={setTab}
        options={[
          { value: "markdown", label: "Markdown" },
          { value: "json", label: "JSON" },
          { value: "text", label: "Text" },
        ]}
      />
      <pre className="rt-out" tabIndex={0}>
        {output}
      </pre>
    </div>
  );
}
