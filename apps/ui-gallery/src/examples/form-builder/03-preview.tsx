import { FormBuilder, type FormAnswers, type FormSchema } from "@forgeron/ui";
import { useState } from "react";

const schema: FormSchema = {
  version: 1,
  title: "Newsletter",
  sections: [
    {
      id: "s1",
      title: "",
      questions: [
        {
          id: "email",
          type: "shortText",
          title: "Your email",
          required: true,
          validation: { format: "email" },
        },
        {
          id: "topics",
          type: "multiChoice",
          title: "Topics",
          options: [
            { id: "t1", label: "Product news" },
            { id: "t2", label: "Engineering" },
            { id: "t3", label: "Events" },
          ],
        },
      ],
    },
  ],
};

export default function Preview() {
  const [sent, setSent] = useState<FormAnswers | null>(null);
  return (
    <div style={{ display: "grid", gap: 12, width: 760, maxWidth: "100%" }}>
      <FormBuilder defaultValue={schema} defaultMode="preview" onPreviewSubmit={setSent} />
      {sent ? (
        <pre style={{ margin: 0, font: "12px/18px var(--font-mono)" }}>{JSON.stringify(sent)}</pre>
      ) : null}
    </div>
  );
}
