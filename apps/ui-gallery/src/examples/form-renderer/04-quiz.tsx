import { FormRenderer, type FormAnswers, type FormSchema } from "@forgeron/ui";
import { useState } from "react";

// A quiz is a form plus an answer key. The key stays outside the schema, on your side; the
// renderer hands back typed answers and you score them.
const schema: FormSchema = {
  version: 1,
  title: "Safety quiz",
  submitLabel: "Check my answers",
  thanks: "Done.",
  sections: [
    {
      id: "s1",
      title: "",
      questions: [
        {
          id: "q1",
          type: "singleChoice",
          title: "Where is the meeting point in case of fire?",
          required: true,
          options: [
            { id: "a", label: "The car park" },
            { id: "b", label: "The loading dock" },
            { id: "c", label: "The main lobby" },
          ],
        },
        {
          id: "q2",
          type: "multiChoice",
          title: "Which of these are fire exits?",
          required: true,
          options: [
            { id: "a", label: "The east stairs" },
            { id: "b", label: "The lift" },
            { id: "c", label: "The west stairs" },
          ],
        },
        {
          id: "q3",
          type: "number",
          title: "How many minutes until the alarm test?",
          required: true,
        },
      ],
    },
  ],
};

const key: Record<string, unknown> = { q1: "a", q2: ["a", "c"], q3: 15 };

const same = (a: unknown, b: unknown) =>
  JSON.stringify(Array.isArray(a) ? [...a].sort() : a) ===
  JSON.stringify(Array.isArray(b) ? [...b].sort() : b);

export default function Quiz() {
  const [score, setScore] = useState<string | null>(null);
  const grade = (answers: FormAnswers) => {
    const right = Object.keys(key).filter((id) => same(answers[id], key[id])).length;
    setScore(`${right} of ${Object.keys(key).length} right`);
  };
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <FormRenderer schema={schema} onSubmit={grade} thanks={score ?? "Done."} />
    </div>
  );
}
