import { FormRenderer, type FormSchema } from "@forgeron/ui";

const schema: FormSchema = {
  version: 1,
  title: "Customer survey",
  description: "Help us improve. It takes about two minutes.",
  thanks: "Thank you. Your answers help us decide what to build next.",
  sections: [
    {
      id: "s1",
      title: "Your experience",
      questions: [
        {
          id: "nps",
          type: "scale",
          title: "How likely are you to recommend us to a colleague?",
          required: true,
          range: { min: 0, max: 10, nps: true, lowLabel: "Not likely", highLabel: "Very likely" },
        },
        {
          id: "stars",
          type: "rating",
          title: "Overall, how would you rate the product?",
          range: { min: 1, max: 5 },
        },
        {
          id: "grid",
          type: "matrix",
          title: "How satisfied are you with each part?",
          required: true,
          options: [
            { id: "speed", label: "Speed" },
            { id: "docs", label: "Documentation" },
            { id: "support", label: "Support" },
          ],
          columns: [
            { id: "low", label: "Poor" },
            { id: "mid", label: "Fair" },
            { id: "high", label: "Good" },
          ],
        },
      ],
    },
    {
      id: "s2",
      title: "What next",
      questions: [
        {
          id: "rank",
          type: "ranking",
          title: "Put these in the order you want them",
          options: [
            { id: "api", label: "A public API" },
            { id: "mobile", label: "A mobile app" },
            { id: "sso", label: "Single sign-on" },
          ],
        },
        { id: "more", type: "longText", title: "Anything else?", placeholder: "Optional" },
      ],
    },
  ],
};

export default function Survey() {
  return <FormRenderer schema={schema} />;
}
