import { MessageList, type ConversationMessage } from "@forgeron/ui";

const sam = { id: "sam", name: "Sam Roche", role: "Customer" };
const agent = { id: "agent", name: "Jo Bernard", role: "Support" };

const messages: ConversationMessage[] = [
  {
    id: "1",
    at: "2026-11-19T09:00:00Z",
    author: sam,
    body: "My invoice shows the wrong VAT number.",
  },
  {
    id: "2",
    at: "2026-11-19T09:02:00Z",
    author: sam,
    body: "Screenshot attached.",
    attachments: [
      { id: "a", name: "invoice-214.pdf", size: 238000, url: "#" },
      { id: "b", name: "upload.png", size: 1_800_000, progress: 0.6 },
    ],
  },
  {
    id: "3",
    at: "2026-11-19T09:05:00Z",
    author: agent,
    body: "Thanks, checking now.",
    status: "sending",
  },
  {
    id: "4",
    at: "2026-11-19T09:06:00Z",
    author: agent,
    body: "I can fix it today.",
    status: "failed",
  },
  { id: "5", at: "2026-11-19T09:07:00Z", author: sam, body: "Removed.", deleted: true },
  { id: "6", at: "2026-11-19T09:10:00Z", kind: "system", body: "Ticket assigned to Jo Bernard" },
];

export default function States() {
  return (
    <div
      style={{ height: 420, width: "100%", maxWidth: 680, border: "1px solid var(--line-strong)" }}
    >
      <MessageList
        messages={messages}
        currentUserId="agent"
        now="2026-11-19T12:00:00Z"
        timeZone="UTC"
        onRetry={() => {}}
        onDiscard={() => {}}
      />
    </div>
  );
}
