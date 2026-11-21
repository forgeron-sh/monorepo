import { AttachmentList } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <AttachmentList
        items={[
          { id: "a", name: "invoice-214.pdf", size: 238_000, url: "#" },
          { id: "b", name: "recording.mp4", size: 48_000_000, progress: 0.35 },
          { id: "c", name: "archive.zip", size: 900_000_000, error: "over the 25 MB limit" },
        ]}
        onRemove={() => {}}
        onRetry={() => {}}
      />
    </div>
  );
}
