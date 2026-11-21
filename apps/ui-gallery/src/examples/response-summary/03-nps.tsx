import { ResponseSummary, type FormResponse, type FormSchema } from "@forgeron/ui";

// A scale marked as NPS adds the score; a matrix is counted cell by cell; a ranking by points.
const schema: FormSchema = {
  version: 1,
  title: "Customer survey",
  sections: [
    {
      id: "s1",
      title: "",
      questions: [
        {
          id: "nps",
          type: "scale",
          title: "Would you recommend us?",
          range: { min: 0, max: 10, nps: true },
        },
        {
          id: "grid",
          type: "matrix",
          title: "How satisfied are you with each part?",
          options: [
            { id: "speed", label: "Speed" },
            { id: "docs", label: "Docs" },
          ],
          columns: [
            { id: "1", label: "Poor" },
            { id: "2", label: "Fair" },
            { id: "3", label: "Good" },
          ],
        },
        {
          id: "rank",
          type: "ranking",
          title: "What do you want next?",
          options: [
            { id: "api", label: "A public API" },
            { id: "app", label: "A mobile app" },
            { id: "sso", label: "Single sign-on" },
          ],
        },
      ],
    },
  ],
};

const orders = [
  ["api", "app", "sso"],
  ["app", "api", "sso"],
  ["sso", "api", "app"],
];
const responses: FormResponse[] = Array.from({ length: 18 }, (_, i) => ({
  id: `r${i + 1}`,
  answers: {
    nps: [10, 9, 8, 7, 10, 6, 9, 3, 10, 8, 9, 5][(i * 5) % 12]!,
    grid: {
      speed: ["3", "3", "2", "3", "1", "3"][i % 6]!,
      docs: ["2", "3", "3", "1", "2", "3", "2"][i % 7]!,
    },
    rank: orders[(i * 7) % 3]!,
  },
}));

export default function Nps() {
  return <ResponseSummary schema={schema} responses={responses} />;
}
