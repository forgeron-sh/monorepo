import {
  DataGrid,
  ResponseSummary,
  formResponseGrid,
  type FormResponse,
  type FormSchema,
} from "@forgeron/ui";

const schema: FormSchema = {
  version: 1,
  title: "Workshop feedback",
  sections: [
    {
      id: "s1",
      title: "",
      questions: [
        {
          id: "session",
          type: "singleChoice",
          title: "Which session did you attend?",
          required: true,
          options: [
            { id: "am", label: "Morning" },
            { id: "pm", label: "Afternoon" },
            { id: "both", label: "Both" },
          ],
        },
        { id: "stars", type: "rating", title: "How was it?", range: { min: 1, max: 5 } },
        {
          id: "topics",
          type: "multiChoice",
          title: "Which topics helped you?",
          options: [
            { id: "t1", label: "Design" },
            { id: "t2", label: "Code" },
            { id: "t3", label: "Process" },
          ],
        },
        { id: "words", type: "longText", title: "What should we change?" },
      ],
    },
  ],
};

const comments = [
  "More time for questions.",
  "The room was too warm.",
  "Share the slides beforehand.",
  "Shorter breaks, longer sessions.",
  "A real project to work on would help.",
];

// Fake data, made from a counter: no real person is behind these rows.
const responses: FormResponse[] = Array.from({ length: 24 }, (_, i) => ({
  id: `r${i + 1}`,
  submittedAt: `2026-11-${String(1 + (i % 9)).padStart(2, "0")}`,
  answers: {
    session: ["am", "pm", "both"][(i * 7) % 3]!,
    stars: 3 + ((i * 5) % 3),
    topics: [["t1"], ["t1", "t2"], ["t2", "t3"], ["t3"]][i % 4]!,
    ...(i % 3 === 0 ? { words: comments[(i / 3) % comments.length]! } : {}),
  },
}));

export default function Default() {
  const grid = formResponseGrid(schema, responses);
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <ResponseSummary schema={schema} responses={responses} />
      <DataGrid label="Responses" columns={grid.columns} rows={grid.rows.slice(0, 6)} />
    </div>
  );
}
