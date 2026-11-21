import { FormRenderer, type FormAnswers, type FormSchema } from "@forgeron/ui";
import { useState } from "react";

// A request form: the second page only exists for some answers, and a follow-up question appears
// inside it. The review step lists the answers before they are sent.
const schema: FormSchema = {
  version: 1,
  title: "Access request",
  submitLabel: "Send request",
  thanks: "Request sent. You will hear back within two working days.",
  sections: [
    {
      id: "s1",
      title: "Who needs access",
      questions: [
        { id: "name", type: "shortText", title: "Full name", required: true },
        {
          id: "email",
          type: "shortText",
          title: "Work email",
          required: true,
          validation: { format: "email" },
        },
        {
          id: "kind",
          type: "singleChoice",
          title: "Who is it for?",
          required: true,
          options: [
            { id: "me", label: "Me" },
            { id: "contractor", label: "A contractor" },
          ],
        },
      ],
    },
    {
      id: "s2",
      title: "The contractor",
      description: "We need a few details before we can grant access.",
      showIf: {
        id: "g1",
        combinator: "and",
        rules: [{ id: "r1", field: "kind", operator: "eq", value: "contractor" }],
      },
      questions: [
        { id: "company", type: "shortText", title: "Company", required: true },
        { id: "until", type: "date", title: "Access ends on", required: true },
        {
          id: "nda",
          type: "singleChoice",
          title: "Is an NDA signed?",
          required: true,
          options: [
            { id: "yes", label: "Yes" },
            { id: "no", label: "Not yet" },
          ],
        },
        {
          id: "ndawhy",
          type: "longText",
          title: "When will it be signed?",
          showIf: {
            id: "g2",
            combinator: "and",
            rules: [{ id: "r2", field: "nda", operator: "eq", value: "no" }],
          },
        },
      ],
    },
    {
      id: "s3",
      title: "What for",
      questions: [
        {
          id: "systems",
          type: "multiChoice",
          title: "Systems",
          required: true,
          options: [
            { id: "git", label: "Source code" },
            { id: "wiki", label: "Wiki" },
            { id: "ci", label: "Build pipeline" },
          ],
          validation: { minSelected: 1 },
        },
      ],
    },
  ],
};

export default function Intake() {
  const [sent, setSent] = useState<FormAnswers | null>(null);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <FormRenderer schema={schema} onSubmit={setSent} />
      {sent ? (
        <pre
          style={{
            margin: 0,
            padding: 12,
            maxWidth: 640,
            overflow: "auto",
            border: "1px solid var(--line)",
            background: "var(--bg-sunk)",
            font: "12px/18px var(--font-mono)",
          }}
          aria-label="What onSubmit received"
        >
          {JSON.stringify(sent, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
