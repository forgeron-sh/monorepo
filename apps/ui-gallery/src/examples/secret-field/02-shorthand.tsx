import { SecretField } from "@forgeron/ui";
import { useState } from "react";

export default function Default() {
  const [rotated, setRotated] = useState("2026-11-01");
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <SecretField
        label="Signing secret"
        hint="Used to sign every request we send you."
        isSet
        rotatedAt={rotated}
        today="2026-11-19"
        // The value is a placeholder, read only when asked for.
        getValue={() => "fg_test_xxxxxxxx"}
        onReplace={() => setRotated("2026-11-19")}
        onRemove={() => {}}
      />
    </div>
  );
}
