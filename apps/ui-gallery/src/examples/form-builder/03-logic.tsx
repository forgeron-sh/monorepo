import { FormBuilder, type FormSchema } from "@forgeron/ui";

// A page and a question that show only for some answers (open a card, then Show this question
// only if…). The rules read the questions before them.
const schema: FormSchema = {
  version: 1,
  title: "Request for equipment",
  sections: [
    {
      id: "s1",
      title: "The request",
      questions: [
        {
          id: "kind",
          type: "singleChoice",
          title: "What do you need?",
          required: true,
          options: [
            { id: "laptop", label: "A laptop" },
            { id: "screen", label: "A screen" },
            { id: "other", label: "Something else" },
          ],
        },
        {
          id: "why",
          type: "longText",
          title: "Tell us what it is for",
          required: true,
          showIf: {
            id: "g1",
            combinator: "and",
            rules: [{ id: "r1", field: "kind", operator: "eq", value: "other" }],
          },
        },
        { id: "budget", type: "number", title: "Budget", validation: { min: 0 } },
      ],
    },
    {
      id: "s2",
      title: "Approval",
      showIf: {
        id: "g2",
        combinator: "and",
        rules: [{ id: "r2", field: "budget", operator: "gt", value: "1000" }],
      },
      questions: [{ id: "manager", type: "shortText", title: "Who approved it?", required: true }],
    },
  ],
};

export default function Logic() {
  return (
    <div style={{ width: 760, maxWidth: "100%" }}>
      <FormBuilder defaultValue={schema} />
    </div>
  );
}
