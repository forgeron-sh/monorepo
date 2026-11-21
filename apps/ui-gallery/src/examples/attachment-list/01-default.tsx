import {
  AttachmentList,
  AttachmentListActions,
  AttachmentListBody,
  AttachmentListDownload,
  AttachmentListItem,
  AttachmentListMeta,
  AttachmentListName,
  AttachmentListProgress,
  AttachmentListRemove,
  AttachmentListRetry,
  AttachmentListThumb,
  type ConversationAttachment,
} from "@forgeron/ui";
import { useState } from "react";

const start: ConversationAttachment[] = [
  { id: "a", name: "invoice-214.pdf", size: 238_000, url: "#" },
  { id: "b", name: "recording.mp4", size: 48_000_000, progress: 0.35 },
  { id: "c", name: "archive.zip", size: 900_000_000, error: "over the 25 MB limit" },
];

export default function Composed() {
  const [files, setFiles] = useState(start);
  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <AttachmentList
        onRemove={(file) => setFiles((all) => all.filter((f) => f.id !== file.id))}
        onRetry={() => {}}
      >
        {files.map((file) => (
          <AttachmentListItem key={file.id} item={file}>
            <AttachmentListThumb />
            <AttachmentListBody>
              <AttachmentListName />
              <AttachmentListMeta />
              <AttachmentListProgress />
            </AttachmentListBody>
            <AttachmentListActions>
              <AttachmentListDownload />
              <AttachmentListRetry />
              <AttachmentListRemove />
            </AttachmentListActions>
          </AttachmentListItem>
        ))}
      </AttachmentList>
    </div>
  );
}
