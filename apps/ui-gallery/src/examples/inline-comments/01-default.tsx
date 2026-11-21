// A document with blocks that carry data-block-id, and the threads in its margin. Click a card to
// bring it to its anchor; select, reply and resolve work on this page's own state.
import {
  InlineComments,
  InlineCommentsActions,
  InlineCommentsBar,
  InlineCommentsComposer,
  InlineCommentsDraft,
  InlineCommentsEmpty,
  InlineCommentsEntries,
  InlineCommentsLane,
  InlineCommentsQuote,
  InlineCommentsThread,
  InlineCommentsThreads,
  type InlineThread,
  type MentionOption,
} from "@forgeron/ui";
import { useState } from "react";

const people: MentionOption[] = [
  { id: "lea", label: "Léa Martin", hint: "Design" },
  { id: "hugo", label: "Hugo Bernard", hint: "Engineering" },
];

const initial: InlineThread[] = [
  {
    id: "t1",
    anchor: { kind: "range", blockId: "b2", start: 12, end: 33, quote: "ship in two phases" },
    status: "open",
    comments: [
      {
        id: "c1",
        author: "Léa Martin",
        at: "Nov 17, 15:40",
        body: "Can we say **which** two phases?",
      },
      {
        id: "c2",
        author: "Hugo Bernard",
        at: "Nov 17, 16:05",
        body: "Phase one is the API, phase two the UI.",
      },
    ],
  },
  {
    id: "t2",
    anchor: { kind: "block", blockId: "b3" },
    status: "open",
    comments: [
      {
        id: "c3",
        author: "Camille Roy",
        at: "Nov 18, 09:12",
        body: "Where does this figure come from?",
      },
    ],
  },
  {
    id: "t3",
    anchor: { kind: "block", blockId: "b1" },
    status: "resolved",
    comments: [{ id: "c4", author: "Léa Martin", at: "Nov 15, 11:00", body: "Typo fixed." }],
  },
];

const text: Record<string, string> = {
  b1: "Launch plan",
  b2: "The new billing page will ship in two phases, the API first and the interface after.",
  b3: "We expect 4 800 accounts to migrate in the first month, with support staffed for the peak.",
  b4: "Rollback is a single switch and is rehearsed the week before.",
};

export default function Composed() {
  const [threads, setThreads] = useState(initial);
  const [active, setActive] = useState<string | null>(null);
  const set = (id: string, patch: Partial<InlineThread>) =>
    setThreads((all) => all.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 280px",
        gap: 24,
        width: "100%",
      }}
    >
      <div
        id="ic-doc"
        style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink-muted)" }}
      >
        <h3
          data-block-id="b1"
          style={{
            margin: "0 0 16px",
            font: "500 18px/24px var(--font-sans)",
            color: "var(--ink)",
          }}
        >
          {text.b1}
        </h3>
        {(["b2", "b3", "b4"] as const).map((id) => (
          <p
            key={id}
            data-block-id={id}
            style={{
              margin: "0 0 28px",
              outline:
                active && threads.find((t) => t.id === active)?.anchor.blockId === id
                  ? "1px dashed var(--accent)"
                  : "none",
              outlineOffset: 4,
            }}
          >
            {text[id]}
          </p>
        ))}
      </div>
      <InlineComments
        threads={threads}
        anchorsIn="#ic-doc"
        active={active}
        onActiveChange={setActive}
        mentions={people}
        onResolve={(id) => set(id, { status: "resolved" })}
        onReopen={(id) => set(id, { status: "open" })}
        onReply={(id, body) =>
          set(id, {
            comments: [
              ...threads.find((t) => t.id === id)!.comments,
              { id: `c${Date.now()}`, author: "You", at: "Just now", body },
            ],
          })
        }
      >
        <InlineCommentsBar />
        <InlineCommentsLane>
          <InlineCommentsDraft />
          <InlineCommentsThreads
            renderThread={(thread) => (
              <InlineCommentsThread thread={thread}>
                <InlineCommentsQuote />
                <InlineCommentsEntries />
                <InlineCommentsComposer />
                <InlineCommentsActions />
              </InlineCommentsThread>
            )}
          />
          <InlineCommentsEmpty />
        </InlineCommentsLane>
      </InlineComments>
    </div>
  );
}
