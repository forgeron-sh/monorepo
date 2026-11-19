import { EndpointList, type EndpointTestResult, type WebhookEndpoint } from "@forgeron/ui";
import { useState } from "react";

const endpoints: WebhookEndpoint[] = [
  {
    id: "e1",
    name: "Billing sync",
    url: "https://example.test/hooks/billing",
    description: "Pushes paid invoices to the ledger.",
    events: [
      "invoice.paid",
      "invoice.sent",
      "invoice.late",
      "payment.refunded",
      "customer.updated",
    ],
    status: "active",
    lastDeliveryAt: "2026-11-19 09:41",
    secret: { isSet: true, rotatedAt: "2026-10-02" },
  },
  {
    id: "e2",
    name: "Chat alerts",
    url: "https://example.test/hooks/chat",
    events: ["member.joined"],
    status: "failing",
    lastDeliveryAt: "2026-11-18 22:03",
    secret: { isSet: true, rotatedAt: "2026-09-12" },
  },
  {
    id: "e3",
    url: "https://example.test/hooks/archive",
    events: ["document.deleted"],
    status: "disabled",
    secret: { isSet: false },
  },
];

export default function Default() {
  const [list, setList] = useState(endpoints);
  const [testing, setTesting] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, EndpointTestResult>>({});
  return (
    <div style={{ width: "100%", maxWidth: 720 }}>
      <EndpointList
        endpoints={list}
        today="2026-11-19"
        testing={testing}
        testResults={results}
        getSecret={() => "fg_test_xxxxxxxx"}
        onReplaceSecret={() => {}}
        onSelect={() => {}}
        onToggle={(id, enabled) =>
          setList(
            list.map((e) => (e.id === id ? { ...e, status: enabled ? "active" : "disabled" } : e)),
          )
        }
        onTest={(id) => {
          setTesting([...testing, id]);
          setTimeout(() => {
            setTesting((t) => t.filter((x) => x !== id));
            setResults((r) => ({
              ...r,
              [id]:
                id === "e2"
                  ? { ok: false, code: 503, message: "Service unavailable" }
                  : { ok: true, code: 200 },
            }));
          }, 800);
        }}
      />
    </div>
  );
}
