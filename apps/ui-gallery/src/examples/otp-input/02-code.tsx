import { OtpInput } from "@forgeron/ui";
import { useState } from "react";

export default function Code() {
  const [done, setDone] = useState("");
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <OtpInput label="Verification code" group={3} onComplete={setDone} />
      <code>{done ? `entered ${done}` : "waiting"}</code>
    </div>
  );
}
