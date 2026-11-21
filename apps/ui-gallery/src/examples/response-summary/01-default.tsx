import {
  ResponseSummary,
  ResponseSummaryEmpty,
  ResponseSummaryList,
  ResponseSummaryQuestion,
  ResponseSummaryQuestionBody,
  ResponseSummaryQuestionHead,
  ResponseSummaryTotals,
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
          options: [
            { id: "am", label: "Morning" },
            { id: "pm", label: "Afternoon" },
          ],
        },
        { id: "stars", type: "rating", title: "How was it?", range: { min: 1, max: 5 } },
      ],
    },
  ],
};

const responses: FormResponse[] = [
  { id: "r1", answers: { session: "am", stars: 5 } },
  { id: "r2", answers: { session: "pm", stars: 4 } },
  { id: "r3", answers: { session: "am", stars: 4 } },
];

export default function Default() {
  return (
    <div style={{ width: 640, maxWidth: "100%" }}>
      <ResponseSummary schema={schema} responses={responses}>
        <ResponseSummaryTotals />
        <ResponseSummaryEmpty />
        <ResponseSummaryList>
          {schema.sections[0]!.questions.map((q, i) => (
            <ResponseSummaryQuestion key={q.id} index={i}>
              <ResponseSummaryQuestionHead />
              <ResponseSummaryQuestionBody />
            </ResponseSummaryQuestion>
          ))}
        </ResponseSummaryList>
      </ResponseSummary>
    </div>
  );
}
