import { EmojiPicker } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [chosen, setChosen] = useState("");
  return (
    <div style={{ width: 300 }}>
      <EmojiPicker onSelect={setChosen} />
      <p style={{ font: "12px var(--font-mono)", color: "var(--ink-muted)" }}>
        Chosen: {chosen || "none"}
      </p>
    </div>
  );
}
