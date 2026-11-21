import { UploadQueue } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 380 }}>
      <UploadQueue
        footer="To R2 · moreau-drive"
        onCancel={() => {}}
        onRetry={() => {}}
        onCancelAll={() => {}}
        items={[
          { id: "1", name: "Dock plan.pdf", size: 240_000, progress: 1, status: "done" },
          {
            id: "2",
            name: "Gate B at night.jpg",
            size: 1_840_000,
            progress: 0.46,
            status: "uploading",
          },
          {
            id: "3",
            name: "Invoices 2025.zip",
            size: 812_000_000,
            progress: 0,
            status: "failed",
            error: "Too large",
          },
          { id: "4", name: "Tariffs 2027.xlsx", size: 52_400, progress: 0, status: "queued" },
        ]}
      />
    </div>
  );
}
