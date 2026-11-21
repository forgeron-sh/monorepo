// A button stands in for a selection: it gives a draft anchored to a range of the paragraph, and
// the margin opens a box there. The anchor moves with the text through structureRebaseAnchor.
import {
  Button,
  InlineComments,
  structureRebaseAnchor,
  type InlineThread,
  type StructureAnchor,
} from "@forgeron/ui";
import { useState } from "react";

export default function NewThread() {
  const [words, setWords] = useState(
    "Rollback is a single switch, rehearsed the week before the launch.",
  );
  const [threads, setThreads] = useState<InlineThread[]>([]);
  const [draft, setDraft] = useState<StructureAnchor | null>(null);

  const prefix = (text: string) => {
    setWords((w) => text + w);
    // The text was typed at the start: every range of the block moves by its length.
    setThreads((all) =>
      all.map((t) => ({
        ...t,
        anchor:
          structureRebaseAnchor(t.anchor, {
            blockId: "p",
            at: 0,
            remove: 0,
            insert: text.length,
          }) ?? t.anchor,
      })),
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 280px",
        gap: 24,
        width: "100%",
      }}
    >
      <div id="ic-doc2" style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <p
          data-block-id="p"
          style={{ margin: 0, font: "400 14px/22px var(--font-sans)", color: "var(--ink-muted)" }}
        >
          {words}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            size="sm"
            onClick={() =>
              setDraft({
                kind: "range",
                blockId: "p",
                start: words.indexOf("single"),
                end: words.indexOf("single") + 13,
                quote: "single switch",
              })
            }
          >
            Comment on “single switch”
          </Button>
          <Button size="sm" variant="ghost" onClick={() => prefix("Note: ")}>
            Type before it
          </Button>
        </div>
        {threads.map((t) =>
          t.anchor.kind === "range" ? (
            <span
              key={t.id}
              style={{ color: "var(--ink-dim)", font: "400 11px/16px var(--font-mono)" }}
            >
              {t.id}: characters {t.anchor.start} to {t.anchor.end}
            </span>
          ) : null,
        )}
      </div>
      <InlineComments
        threads={threads}
        anchorsIn="#ic-doc2"
        draft={draft}
        onCancelDraft={() => setDraft(null)}
        onCreate={(anchor, body) => {
          setThreads((all) => [
            ...all,
            {
              id: `n${all.length + 1}`,
              anchor,
              status: "open",
              comments: [{ id: `m${all.length + 1}`, author: "You", at: "Just now", body }],
            },
          ]);
          setDraft(null);
        }}
        onResolve={(id) =>
          setThreads((all) => all.map((t) => (t.id === id ? { ...t, status: "resolved" } : t)))
        }
      />
    </div>
  );
}
