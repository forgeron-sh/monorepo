import { fromMarkdown, type RichDoc } from "@forgeron/richtext";
import { RichTextEditor } from "@forgeron/richtext/react";
import { Button } from "@forgeron/ui";
import "@forgeron/richtext/styles.css";
import { useMemo, useState } from "react";
import { demoSetup } from "../lib/demo-options";
import { compatible, pluginsFor, problemWith, withRequires } from "../lib/registry";
import { catalog } from "../lib/catalog";
import { PAGE_SEED } from "./seed";
import { available, Output, Toggles, type Entry } from "./shared";

const MINIMAL = [
  "link",
  "bold",
  "italic",
  "strike",
  "underline",
  "code",
  "bulletList",
  "orderedList",
  "taskList",
  "references",
  "slash",
  "bubble",
];

/** The home page's editor: tick the plugins, the editor is rebuilt with `plugins={...}`. */
export default function Picker({ entries }: { entries: ReadonlyArray<Entry> }) {
  const shown = useMemo(() => available(entries), [entries]);
  const everything = useMemo(() => compatible(shown.map((e) => e.id)), [shown]);
  const [selected, setSelected] = useState<ReadonlySet<string>>(everything);
  const [problem, setProblem] = useState<string>();
  // A list that does not go together (two owners of one node type) is refused, and says why.
  const change = (next: Set<string>) => {
    const bad = problemWith(next);
    setProblem(bad);
    if (!bad) setSelected(next);
  };
  const [doc, setDoc] = useState<RichDoc>(() => fromMarkdown(PAGE_SEED));
  const plugins = useMemo(() => pluginsFor(selected), [selected]);
  const setup = useMemo(() => demoSetup(catalog), []);
  const ids = plugins.map((p) => p.core.id);
  return (
    <div className="rt-stack">
      <Toggles entries={shown} selected={selected} onChange={change} />
      {problem ? (
        <p className="t-mono rt-problem" role="alert">
          {problem}
        </p>
      ) : null}
      <div className="rt-bar">
        <Button size="sm" variant="secondary" onClick={() => change(new Set())}>
          Core only
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => change(new Set(withRequires(MINIMAL)))}
        >
          Minimal
        </Button>
        <Button size="sm" variant="secondary" onClick={() => change(everything)}>
          Everything
        </Button>
      </div>
      <p className="t-mono dim rt-ids">
        plugins=[<span className="rt-ids-list">{ids.length ? ids.join(", ") : ""}</span>] + core
      </p>
      <div className="rt-box">
        <RichTextEditor
          // Remounted on a new list: a rebuild in place throws in the block handle (see README).
          key={ids.join(",")}
          value={doc}
          onChange={setDoc}
          plugins={plugins}
          pluginOptions={setup.pluginOptions}
          mentions={setup.mentions}
          references={setup.references}
          requestImage={setup.requestImage}
          placeholder={ids.includes("slash") ? "Type / for what is installed" : "Write here"}
          label="Editor built from the ticked plugins"
        />
      </div>
      <Output doc={doc} plugins={plugins} />
    </div>
  );
}
