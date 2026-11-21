import {
  QuestionCard,
  QuestionCardBody,
  QuestionCardChoices,
  QuestionCardDelete,
  QuestionCardDuplicate,
  QuestionCardFields,
  QuestionCardLimits,
  QuestionCardRow,
  QuestionCardSummary,
  type FormQuestion,
} from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [question, setQuestion] = useState<FormQuestion>({
    id: "q1",
    type: "singleChoice",
    title: "How did you hear about us?",
    required: true,
    options: [
      { id: "o1", label: "A friend" },
      { id: "o2", label: "Search" },
    ],
  });
  return (
    <div style={{ width: 640, maxWidth: "100%" }}>
      <QuestionCard
        value={question}
        onChange={setQuestion}
        index={1}
        defaultOpen
        onDuplicate={() => {}}
        onDelete={() => {}}
      >
        <QuestionCardRow>
          <QuestionCardSummary />
          <QuestionCardDuplicate />
          <QuestionCardDelete />
        </QuestionCardRow>
        <QuestionCardBody>
          <QuestionCardFields />
          <QuestionCardChoices />
          <QuestionCardLimits />
        </QuestionCardBody>
      </QuestionCard>
    </div>
  );
}
