// Pick files: the queue follows them, three at a time, until they are done. Cancel one, cancel
// all, retry a cancelled one. The upload is simulated; yours calls your storage.
import { Button, DropZone, UploadQueue, type UploadItem } from "@forgeron/ui";
import { useEffect, useRef, useState } from "react";

export default function Live() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const tick = () =>
    setItems((all) => {
      let slots = 3;
      const next = all.map((u): UploadItem => {
        if (u.status !== "uploading" && u.status !== "queued") return u;
        if (slots-- <= 0) return u;
        const progress = Math.min(1, u.progress + Math.max(0.05, 300_000 / (u.size ?? 1)));
        return { ...u, progress, status: progress >= 1 ? "done" : "uploading" };
      });
      if (next.every((u) => u.status !== "uploading" && u.status !== "queued") && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      return next;
    });
  const start = () => {
    if (!timer.current) timer.current = setInterval(tick, 160);
  };
  const add = (files: File[]) => {
    setItems((all) => [
      ...all,
      ...files.map((f, i) => ({
        id: `${Date.now()}-${i}`,
        name: f.name,
        size: f.size || 50_000,
        progress: 0,
        status: "queued" as const,
      })),
    ]);
    start();
  };
  const set = (id: string, change: Partial<UploadItem>) =>
    setItems((all) => all.map((u) => (u.id === id ? { ...u, ...change } : u)));

  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 420 }}>
      <DropZone onFiles={add} title="Drop files to upload them" />
      <Button
        size="sm"
        onClick={() =>
          add([
            new File(["x".repeat(900_000)], "Quarterly review.pdf"),
            new File(["x"], "notes.md"),
          ])
        }
      >
        Add two sample files
      </Button>
      <UploadQueue
        items={items}
        footer="To R2 · moreau-drive"
        onCancel={(id) => set(id, { status: "cancelled" })}
        onRetry={(id) => {
          set(id, { status: "queued", progress: 0 });
          start();
        }}
        onCancelAll={() =>
          setItems((all) =>
            all.map((u) => (u.status === "done" ? u : { ...u, status: "cancelled" })),
          )
        }
        onClear={() => setItems([])}
      />
    </div>
  );
}
