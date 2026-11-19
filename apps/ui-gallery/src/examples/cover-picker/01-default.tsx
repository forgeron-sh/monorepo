// Patterns are drawn from the tokens in a few tones; a picture is uploaded or linked, then dragged
// (or moved with the arrows) to choose which part shows.
import { CoverArt, CoverPicker, type CoverValue } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [cover, setCover] = useState<CoverValue | null>({
    type: "pattern",
    pattern: "ember",
    tone: "accent",
  });
  return (
    <div style={{ display: "grid", gap: 16, width: "100%", maxWidth: 440 }}>
      <CoverPicker value={cover} onChange={setCover} />
      {cover ? <CoverArt value={cover} height={72} /> : null}
    </div>
  );
}
