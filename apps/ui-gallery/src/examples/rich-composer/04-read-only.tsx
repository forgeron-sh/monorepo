import { RichComposer } from "@forgeron/ui";

export default function ReadOnly() {
  return (
    <div style={{ display: "grid", gap: 16, width: "100%", maxWidth: 640 }}>
      <RichComposer readOnly defaultValue="A draft kept for reading" onSend={() => {}} />
      <RichComposer disabled placeholder="Sending is paused" onSend={() => {}} />
    </div>
  );
}
