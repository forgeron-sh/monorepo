// The content of the rich text page: what it covers, the code to start from, the keys.

export const richtextCovers: ReadonlyArray<string> = [
  "A page as JSON (ProseMirror's own shape): headings, lists, to-dos, quotes, code, tables, images, mentions.",
  "Type / for the block list, select text for its marks, hover a block for its handle: move, duplicate, delete, turn into.",
  "A minimal variant for comments and descriptions: marks, lists and mentions, in a framed field.",
  "Markdown in and out, plain text, and a static renderer: read-only places never load the editor.",
  "Yjs wired in: give it a shared document and several people write in the same page.",
  "Built on Tiptap (ProseMirror, MIT) with no editing engine of ours, and none of its UI.",
];

export const richtextSnippet = `import "@forgeron/ui/styles.css";
import "@forgeron/richtext/styles.css";
import { RichTextEditor, RichTextView } from "@forgeron/richtext/react";
import { toMarkdown, toPlainText, type RichDoc } from "@forgeron/richtext";

export function Notes({ doc, onSave }: { doc: RichDoc; onSave: (doc: RichDoc) => void }) {
  return (
    <RichTextEditor
      defaultValue={doc}
      onChange={onSave}
      placeholder="Type / for blocks"
      mentions={[{ id: "u1", label: "Ada" }]}
    />
  );
}

// Anywhere that only reads: no ProseMirror, no Tiptap.
export const Preview = ({ doc }: { doc: RichDoc }) => <RichTextView value={doc} />;
export const summary = (doc: RichDoc) => toPlainText(doc, { maxLength: 120 });
export const markdown = (doc: RichDoc) => toMarkdown(doc);`;

export const richtextCollabSnippet = `import { RichTextEditor, createLocalSync } from "@forgeron/richtext/react";

// Two documents linked by an in-memory relay: what a provider does over a network.
const sync = createLocalSync(2);
const [ada, grace] = sync.peers;

<RichTextEditor collaboration={{ doc: ada.doc, provider: ada, user: { name: "Ada" } }} />
<RichTextEditor collaboration={{ doc: grace.doc, provider: grace, user: { name: "Grace" } }} />

sync.disconnect(); // both keep typing, apart
sync.connect();    // and converge`;

export const richtextKeys: ReadonlyArray<{ label: string; combo: string }> = [
  { label: "Block list", combo: "/" },
  { label: "Mention", combo: "@" },
  { label: "Bold", combo: "mod+b" },
  { label: "Italic", combo: "mod+i" },
  { label: "Underline", combo: "mod+u" },
  { label: "Link", combo: "mod+k" },
  { label: "Undo", combo: "mod+z" },
  { label: "Redo", combo: "mod+shift+z" },
  { label: "Indent a list item", combo: "tab" },
  { label: "Outdent", combo: "shift+tab" },
];
