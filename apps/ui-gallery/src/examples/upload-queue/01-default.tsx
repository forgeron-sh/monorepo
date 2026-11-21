import {
  UploadQueue,
  UploadQueueFooter,
  UploadQueueHeader,
  UploadQueueList,
  UploadQueueRow,
  type UploadItem,
} from "@forgeron/ui";

const items: UploadItem[] = [
  { id: "1", name: "Dock plan.pdf", size: 240_000, progress: 1, status: "done" },
  { id: "2", name: "Gate B at night.jpg", size: 1_840_000, progress: 0.46, status: "uploading" },
  { id: "3", name: "Tariffs 2027.xlsx", size: 52_400, progress: 0, status: "queued" },
];

export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 380 }}>
      <UploadQueue
        items={items}
        footer="To R2 · moreau-drive"
        onCancel={() => {}}
        onCancelAll={() => {}}
      >
        <UploadQueueHeader />
        <UploadQueueList>
          {items.map((item) => (
            <UploadQueueRow key={item.id} item={item} />
          ))}
        </UploadQueueList>
        <UploadQueueFooter />
      </UploadQueue>
    </div>
  );
}
