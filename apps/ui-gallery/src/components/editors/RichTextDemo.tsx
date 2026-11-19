import {
  fromMarkdown,
  toMarkdown,
  toPlainText,
  type MentionItem,
  type RichDoc,
} from "@forgeron/richtext";
import {
  blockquote,
  bubble,
  codeBlock,
  heading,
  horizontalRule,
  listPlugins,
  markPlugins,
  placeholder,
  references,
  slash,
  table,
  type EditorPlugin,
} from "@forgeron/richtext/plugins/editor";
import {
  RichTextEditor,
  RichTextView,
  createLocalSync,
  toYDoc,
  type LocalSync,
} from "@forgeron/richtext/react";
import { Button, Segmented } from "@forgeron/ui";
import { useEffect, useMemo, useState } from "react";
import { callout } from "./callout-plugin";

// The live editors of the rich text page: the full page (with its Markdown beside it), the minimal
// field, the read-only view, and two editors on two Y.Docs linked by an in-memory relay.

const SEED = `# Release notes

Write like in a page: **bold**, *italic*, <u>underline</u>, ~~strike~~, \`code\` and [links](https://forgeron.sh).

## To ship

- [x] Pick a block with /
- [ ] Select text for its marks
- [ ] Drag a block by its grip

> A quote, a list, a table, some code: everything is a block.

| Block | Where |
| --- | --- |
| Table | the / menu |
| Mention | type @ |

\`\`\`ts
const page = fromMarkdown("# Hello");
\`\`\`
`;

const PEOPLE: MentionItem[] = [
  { id: "ada", label: "Ada Lovelace", hint: "ada@example.com" },
  { id: "grace", label: "Grace Hopper", hint: "grace@example.com" },
  { id: "alan", label: "Alan Turing", hint: "alan@example.com" },
];

const COMMENT = fromMarkdown(
  "Thanks [@Ada Lovelace](mention:ada), the **second step** needs a look:\n\n- check the logs\n- retry once",
);

function Full() {
  const [doc, setDoc] = useState<RichDoc>(() => fromMarkdown(SEED));
  const [tab, setTab] = useState("markdown");
  const output = useMemo(
    () =>
      tab === "markdown"
        ? toMarkdown(doc)
        : tab === "json"
          ? JSON.stringify(doc, null, 2)
          : toPlainText(doc),
    [doc, tab],
  );
  return (
    <div className="ed-rt-stack">
      <div className="ed-rt-box">
        <RichTextEditor
          value={doc}
          onChange={setDoc}
          mentions={PEOPLE}
          placeholder="Type / for blocks"
          requestImage={async () => ({ src: "/favicon.svg", alt: "Forgeron" })}
          label="Page"
        />
      </div>
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
      <pre className="ed-rt-out">{output}</pre>
    </div>
  );
}

interface Note {
  id: string;
  doc: RichDoc;
  at: number;
}

const NOTES_KEY = "forgeron.richtext.notes";

function seedNotes(): Note[] {
  return [
    { id: "n1", doc: fromMarkdown(SEED), at: 2 },
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

// A small Notes test bench: a list, one editor, saved in this browser (localStorage). It is only a
// way to try the editor on several documents; nothing leaves the page.
function Notes() {
  // The page renders in the browser only (client:only), so the saved notes can be read at once.
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
  const add = () => {
    const id = `n${Date.now().toString(36)}`;
    setNotes((all) => [{ id, doc: fromMarkdown(""), at: Date.now() }, ...all]);
    setOpenId(id);
  };
  const remove = () => {
    const rest = notes.filter((n) => n.id !== open.id);
    const next =
      rest.length > 0
        ? rest
        : [{ id: `n${Date.now().toString(36)}`, doc: fromMarkdown(""), at: Date.now() }];
    setNotes(next);
    setOpenId(next[0]!.id);
  };
  const reset = () => {
    const seed = seedNotes();
    setNotes(seed);
    setOpenId(seed[0]!.id);
  };
  return (
    <div className="ed-rt-notes">
      <div className="ed-rt-notes-list">
        <div className="ed-rt-bar">
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
        <ul className="ed-rt-notes-items" aria-label="Notes">
          {notes.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className="ed-rt-note"
                aria-current={n.id === open.id ? "true" : undefined}
                onClick={() => setOpenId(n.id)}
              >
                {noteTitle(n.doc)}
              </button>
            </li>
          ))}
        </ul>
        <p className="t-mono dim">Saved in this browser only.</p>
      </div>
      <div className="ed-rt-box">
        <RichTextEditor
          key={open.id}
          defaultValue={open.doc}
          onChange={(doc) =>
            setNotes((all) =>
              all.map((n) => (n.id === open.id ? { ...n, doc, at: Date.now() } : n)),
            )
          }
          mentions={PEOPLE}
          placeholder="Type / for blocks, @ to mention"
          requestImage={async () => ({ src: "/favicon.svg", alt: "Forgeron" })}
          label="Note"
        />
      </div>
    </div>
  );
}

function Minimal() {
  const [doc, setDoc] = useState<RichDoc>(COMMENT);
  return (
    <div className="ed-rt-stack">
      <RichTextEditor
        variant="minimal"
        value={doc}
        onChange={setDoc}
        mentions={PEOPLE}
        placeholder="Add a comment"
        label="Comment"
      />
    </div>
  );
}

function View() {
  const doc = useMemo(() => fromMarkdown(SEED), []);
  return (
    <div className="ed-rt-box">
      <RichTextView value={doc} />
    </div>
  );
}

function Collab() {
  const [sync] = useState<LocalSync>(() =>
    createLocalSync(2, [toYDoc(fromMarkdown("# Shared page\n\nEdit here, and there."))]),
  );
  const [connected, setConnected] = useState(true);
  useEffect(() => () => sync.destroy(), [sync]);
  const [ada, grace] = sync.peers as [(typeof sync.peers)[number], (typeof sync.peers)[number]];
  const peers = [
    { peer: ada, name: "Ada", color: "var(--accent)" },
    { peer: grace, name: "Grace", color: "var(--success)" },
  ];
  return (
    <div className="ed-rt-stack">
      <div className="ed-rt-bar">
        <Button
          size="sm"
          variant={connected ? "secondary" : "primary"}
          onClick={() => {
            if (connected) sync.disconnect();
            else sync.connect();
            setConnected(!connected);
          }}
        >
          {connected ? "Go offline" : "Reconnect"}
        </Button>
        <span className="t-mono dim">
          {connected ? "Connected: edits relay at once" : "Offline: each side keeps its own edits"}
        </span>
      </div>
      <div className="ed-rt-pair">
        {peers.map(({ peer, name, color }) => (
          <div key={name} className="ed-rt-box">
            <p className="t-mono dim ed-rt-who">{name}</p>
            <RichTextEditor
              collaboration={{ doc: peer.doc, provider: peer, user: { name, color } }}
              variant="full"
              blockHandle={false}
              label={`${name}'s page`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Features come from plugins: the core is paragraphs and text; each button adds or removes a plugin
// (a list of plugins is the whole configuration). `callout` is defined in this gallery, in one file.
const PLUGINS_SEED = `# A page with everything

Plain text, **bold**, a [link](https://forgeron.sh) and a mention of [@Ada Lovelace](mention:ada).

:::callout
A callout: a plugin of this gallery, not of the package.
:::

- [ ] a to-do
- a bullet

> a quote

| Plugin | Adds |
| --- | --- |
| table | rows and columns |
`;

const GROUPS: ReadonlyArray<{ id: string; label: string; plugins: ReadonlyArray<EditorPlugin> }> = [
  { id: "marks", label: "marks", plugins: markPlugins },
  { id: "heading", label: "heading", plugins: [heading] },
  { id: "lists", label: "lists", plugins: listPlugins },
  { id: "quote", label: "quote", plugins: [blockquote] },
  { id: "code", label: "codeBlock", plugins: [codeBlock] },
  { id: "divider", label: "horizontalRule", plugins: [horizontalRule] },
  { id: "table", label: "table", plugins: [table] },
  { id: "references", label: "references", plugins: [references] },
  { id: "callout", label: "callout", plugins: [callout] },
];

const ALL_CORES = [...GROUPS.flatMap((g) => g.plugins), slash, bubble, placeholder].map(
  (p) => p.core,
);

function Plugins() {
  const [on, setOn] = useState<ReadonlySet<string>>(() => new Set(GROUPS.map((g) => g.id)));
  const [doc, setDoc] = useState<RichDoc>(() => fromMarkdown(PLUGINS_SEED, ALL_CORES));
  const plugins = useMemo<ReadonlyArray<EditorPlugin>>(
    () => [
      placeholder,
      ...GROUPS.filter((g) => on.has(g.id)).flatMap((g) => g.plugins),
      slash,
      bubble,
    ],
    [on],
  );
  const cores = useMemo(() => plugins.map((p) => p.core), [plugins]);
  const toggle = (id: string) =>
    setOn((now) => {
      const next = new Set(now);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  return (
    <div className="ed-rt-stack">
      <div className="ed-rt-bar" role="group" aria-label="Plugins">
        <Button size="sm" variant="secondary" onClick={() => setOn(new Set())}>
          Core only
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setOn(new Set(GROUPS.map((g) => g.id)))}
        >
          Everything
        </Button>
        {GROUPS.map((g) => (
          <Button
            key={g.id}
            size="sm"
            variant={on.has(g.id) ? "primary" : "secondary"}
            aria-pressed={on.has(g.id)}
            onClick={() => toggle(g.id)}
          >
            {g.label}
          </Button>
        ))}
      </div>
      <p className="t-mono dim">plugins: core · {plugins.map((p) => p.core.id).join(" · ")}</p>
      <div className="ed-rt-box">
        <RichTextEditor
          value={doc}
          onChange={setDoc}
          plugins={plugins}
          mentions={PEOPLE}
          placeholder="Type / for what is installed"
          label="Plugins"
        />
      </div>
      <pre className="ed-rt-out">{toMarkdown(doc, cores)}</pre>
    </div>
  );
}

export default function RichTextDemo({
  kind,
}: {
  kind: "full" | "minimal" | "view" | "collab" | "notes" | "plugins";
}) {
  if (kind === "plugins") return <Plugins />;
  if (kind === "notes") return <Notes />;
  if (kind === "minimal") return <Minimal />;
  if (kind === "view") return <View />;
  if (kind === "collab") return <Collab />;
  return <Full />;
}
