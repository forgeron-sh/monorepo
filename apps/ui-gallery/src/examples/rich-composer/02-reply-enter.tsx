import { RichComposer } from "@forgeron/ui";
import { useState } from "react";

export default function ReplyEnter() {
  const [reply, setReply] = useState<{ id: string; author: string; text: string } | null>({
    id: "42",
    author: "Léa Martin",
    text: "Found it: the webhook is sent twice.",
  });
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <RichComposer
        sendOn="enter"
        replyTo={reply}
        onCancelReply={() => setReply(null)}
        onSend={() => setReply(null)}
        attachmentOptions={{ maxSize: 5_000_000, maxFiles: 3 }}
      />
    </div>
  );
}
