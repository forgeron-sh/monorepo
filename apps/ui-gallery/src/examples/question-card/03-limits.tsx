import { QuestionCard, newFormQuestion, type FormQuestion } from "@forgeron/ui";

// Each type brings its own editor: limits of a number, a format of text, the scale of a rating,
// the rows and columns of a matrix, the files taken.
const questions: FormQuestion[] = [
  {
    ...newFormQuestion("number", "n1"),
    title: "Team size",
    validation: { min: 1, max: 500, integer: true },
  },
  {
    ...newFormQuestion("scale", "n2"),
    title: "How likely are you to recommend us?",
    range: { min: 0, max: 10, nps: true },
  },
  { ...newFormQuestion("matrix", "n3"), title: "Rate each part" },
  {
    ...newFormQuestion("file", "n4"),
    title: "Attach your brief",
    validation: { maxFiles: 3, maxSizeMb: 10, accept: ".pdf,image/*" },
  },
];

export default function Limits() {
  return (
    <div style={{ display: "grid", gap: 8, width: 640, maxWidth: "100%" }}>
      {questions.map((q, i) => (
        <QuestionCard key={q.id} defaultValue={q} index={i + 1} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
