import { FormBuilder, type FormSchema } from "@forgeron/ui";
import { useState } from "react";

const initial: FormSchema = {
  version: 1,
  title: "Workshop feedback",
  description: "Two minutes, anonymous.",
  thanks: "Thank you for your feedback.",
  sections: [
    {
      id: "s1",
      title: "The day",
      questions: [
        {
          id: "q1",
          type: "singleChoice",
          title: "Which session did you attend?",
          required: true,
          options: [
            { id: "o1", label: "Morning" },
            { id: "o2", label: "Afternoon" },
          ],
        },
        {
          id: "q2",
          type: "rating",
          title: "How was it?",
          required: true,
          range: { min: 1, max: 5 },
        },
        { id: "q3", type: "longText", title: "What should we change?" },
      ],
    },
  ],
};

export default function Default() {
  const [schema, setSchema] = useState(initial);
  return (
    <div style={{ display: "grid", gap: 16, width: 760, maxWidth: "100%" }}>
      <FormBuilder value={schema} onChange={setSchema} />
      <pre
        style={{
          margin: 0,
          padding: 12,
          maxHeight: 200,
          overflow: "auto",
          border: "1px solid var(--line)",
          background: "var(--bg-sunk)",
          font: "12px/18px var(--font-mono)",
        }}
        aria-label="The value of the builder"
      >
        {JSON.stringify(schema, null, 2)}
      </pre>
    </div>
  );
}
