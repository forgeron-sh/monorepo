import { DeliveryLog, type WebhookDelivery } from "@forgeron/ui";
import { useState } from "react";

const deliveries: WebhookDelivery[] = [
  {
    id: "d1",
    event: "invoice.paid",
    at: "2026-11-19 09:41",
    status: "success",
    code: 200,
    durationMs: 84,
    attempts: 1,
    request: {
      id: "evt_test_0001",
      type: "invoice.paid",
      data: { invoice: "INV-214", amount: 12500, currency: "EUR" },
    },
    response: { received: true },
  },
  {
    id: "d2",
    event: "member.joined",
    at: "2026-11-18 22:03",
    status: "failed",
    code: 503,
    durationMs: 1240,
    attempts: 5,
    request: { id: "evt_test_0002", type: "member.joined", data: { member: "lea@example.test" } },
    response: { error: "Service unavailable" },
  },
  {
    id: "d3",
    event: "invoice.sent",
    at: "2026-11-18 16:20",
    status: "retrying",
    attempts: 2,
    request: { id: "evt_test_0003", type: "invoice.sent" },
  },
  {
    id: "d4",
    event: "document.deleted",
    at: "2026-11-18 11:02",
    status: "success",
    code: 204,
    durationMs: 3100,
    attempts: 1,
    request: { id: "evt_test_0004" },
  },
];

export default function Default() {
  const [sending, setSending] = useState<string[]>([]);
  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <DeliveryLog
        deliveries={deliveries}
        redelivering={sending}
        defaultOpen={["d2"]}
        onRedeliver={(id) => {
          setSending([...sending, id]);
          setTimeout(() => setSending((s) => s.filter((x) => x !== id)), 800);
        }}
      />
    </div>
  );
}
