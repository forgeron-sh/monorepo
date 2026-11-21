import { fromMarkdown, toPlainText, type RichDoc } from "@forgeron/richtext";
import { RichTextEditor } from "@forgeron/richtext/react";
import "@forgeron/richtext/styles.css";
import { Button } from "@forgeron/ui";
import { useEffect, useMemo, useState } from "react";
import { catalog } from "../lib/catalog";
import { demoSetup } from "../lib/demo-options";
import { compatible, pluginsFor, problemWith } from "../lib/registry";
import { PAGE_SEED } from "./seed";
import { available, Output, Toggles, type Entry } from "./shared";

interface Note {
  id: string;
  doc: RichDoc;
  at: number;
}

const NOTES_KEY = "forgeron.richtext-site.notes";

function seedNotes(): Note[] {
  return [
    { id: "n1", doc: fromMarkdown(PAGE_SEED), at: 2 },
    {
      id: "n2",
      doc: fromMarkdown(
        "# Task description\n\nSteps to reproduce:\n\n1. Open the page\n2. Click save\n\nCc [@Grace Hopper](mention:grace)",
      ),
      at: 1,
    },
  ];
}

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const list = raw ? (JSON.parse(raw) as Note[]) : null;
    if (Array.isArray(list) && list.length > 0) return list;
  } catch {
    // Storage blocked or damaged: start from the seed.
  }
  return seedNotes();
}

function noteTitle(doc: RichDoc): string {
  const first = toPlainText(doc)
    .split("\n")
    .find((line) => line.trim() !== "");
  return first?.trim().slice(0, 48) || "Untitled";
}

const newNote = (): Note => ({
  id: `n${Date.now().toString(36)}`,
  doc: fromMarkdown(""),
  at: Date.now(),
});

/** Notes saved in this browser, one editor, the plugins ticked above it, and the document written out. */
export default function Playground({ entries }: { entries: ReadonlyArray<Entry> }) {
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
  // Read only in the browser (client:only), so the saved notes are there at the first render.
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [openId, setOpenId] = useState(() => notes[0]!.id);
  useEffect(() => {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch {
      // Not saved: the notes live until the page closes.
    }
  }, [notes]);
  const open = notes.find((n) => n.id === openId) ?? notes[0]!;
  const plugins = useMemo(() => pluginsFor(selected), [selected]);
  const setup = useMemo(() => demoSetup(catalog), []);
  const ids = plugins.map((p) => p.core.id);

  const add = () => {
    const note = newNote();
    setNotes((all) => [note, ...all]);
    setOpenId(note.id);
  };
  const remove = () => {
    const rest = notes.filter((n) => n.id !== open.id);
    const next = rest.length > 0 ? rest : [newNote()];
    setNotes(next);
    setOpenId(next[0]!.id);
  };
  const reset = () => {
    const seed = seedNotes();
    setNotes(seed);
    setOpenId(seed[0]!.id);
  };

  return (
    <div className="rt-stack">
      <Toggles entries={shown} selected={selected} onChange={change} />
      {problem ? (
        <p className="t-mono rt-problem" role="alert">
          {problem}
        </p>
      ) : null}
      <div className="rt-notes">
        <div className="rt-notes-list">
          <div className="rt-bar">
            <Button size="sm" variant="primary" onClick={add}>
              New note
            </Button>
            <Button size="sm" variant="secondary" onClick={remove}>
              Delete
            </Button>
            <Button size="sm" variant="secondary" onClick={reset}>
              Reset
            </Button>
          </div>
          <ul className="rt-notes-items" aria-label="Notes">
            {notes.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className="rt-note"
                  aria-current={n.id === open.id ? "true" : undefined}
                  onClick={() => setOpenId(n.id)}
                >
                  {noteTitle(n.doc)}
                </button>
              </li>
            ))}
          </ul>
          <p className="t-mono dim">Saved in this browser only. Nothing leaves the page.</p>
        </div>
        <div className="rt-box">
          <RichTextEditor
            // Remounted on a new list: a rebuild in place throws in the block handle (see README).
            key={`${open.id}:${ids.join(",")}`}
            value={open.doc}
            onChange={(doc) =>
              setNotes((all) =>
                all.map((n) => (n.id === open.id ? { ...n, doc, at: Date.now() } : n)),
              )
            }
            plugins={plugins}
            pluginOptions={setup.pluginOptions}
            mentions={setup.mentions}
            references={setup.references}
            requestImage={setup.requestImage}
            placeholder={ids.includes("slash") ? "Type / for blocks, @ to mention" : "Write here"}
            label="Note"
          />
        </div>
      </div>
      <Output doc={open.doc} plugins={plugins} />
    </div>
  );
}
