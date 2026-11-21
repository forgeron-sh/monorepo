import { QuestionCard, moveFormItem, newFormQuestion, type FormQuestion } from "@forgeron/ui";
import { useState } from "react";

// The parent owns the order: Alt + Up and Alt + Down on a row (or its grip) ask for a move.
export default function Reorder() {
  const [list, setList] = useState<FormQuestion[]>([
    { ...newFormQuestion("shortText", "a"), title: "First name" },
    { ...newFormQuestion("shortText", "b"), title: "Last name" },
    { ...newFormQuestion("date", "c"), title: "Date of birth" },
  ]);
  const move = (id: string, delta: -1 | 1) =>
    setList((cur) => {
      const from = cur.findIndex((q) => q.id === id);
      return moveFormItem(cur, from, from + delta);
    });
  return (
    <div style={{ display: "grid", gap: 8, width: 640, maxWidth: "100%" }}>
      {list.map((q, i) => (
        <QuestionCard
          key={q.id}
          value={q}
          onChange={(next) => setList((cur) => cur.map((x) => (x.id === q.id ? next : x)))}
          index={i + 1}
          onMove={(delta) => move(q.id, delta)}
        />
      ))}
    </div>
  );
}
