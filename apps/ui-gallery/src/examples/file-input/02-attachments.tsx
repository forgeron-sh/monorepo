import { FileInput, type FileRejection } from "@forgeron/ui";
import { useState } from "react";

export default function Attachments() {
  const [refused, setRefused] = useState<FileRejection[]>([]);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <FileInput
        label="Attachments"
        multiple
        accept="image/*,.pdf"
        maxSize={5 * 1024 * 1024}
        maxFiles={3}
        onReject={setRefused}
      />
      {refused.length > 0 ? (
        <code>{refused.map((r) => `${r.file.name}: ${r.reason}`).join(", ")}</code>
      ) : null}
    </div>
  );
}
