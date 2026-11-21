import { CursorPresence, type EditorCursor } from "@forgeron/ui";
import { useEffect, useState } from "react";

const paths: Record<string, Array<[number, number]>> = {
  lea: [
    [60, 50],
    [220, 70],
    [300, 160],
    [120, 190],
  ],
  karim: [
    [420, 60],
    [360, 200],
    [200, 120],
    [440, 150],
  ],
};

export default function Moving() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1200);
    return () => window.clearInterval(id);
  }, []);
  const cursors: EditorCursor[] = Object.entries(paths).map(([id, path]) => {
    const [x, y] = path[tick % path.length]!;
    return { id, name: id === "lea" ? "Léa" : "Karim", x, y };
  });
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 520,
        height: 240,
        border: "1px solid var(--line-strong)",
        background: "var(--bg-sunk)",
      }}
    >
      <CursorPresence label="People here" cursors={cursors} />
    </div>
  );
}
