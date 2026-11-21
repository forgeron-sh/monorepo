// The versions of a record: each one's content is its fields, and the diff is a before and after.
import { VersionCompare, type CompareVersion } from "@forgeron/ui";

const versions: CompareVersion[] = [
  {
    id: "r3",
    label: "v3",
    at: "Nov 18, 10:02",
    by: "Maya Lopez",
    content: {
      title: "Quote 2026-114",
      amount: 18400,
      currency: "EUR",
      status: "Sent",
      terms: "Net 30",
    },
  },
  {
    id: "r2",
    label: "v2",
    at: "Nov 16, 14:20",
    by: "Hugo Bernard",
    note: "Discount applied",
    content: {
      title: "Quote 2026-114",
      amount: 19200,
      currency: "EUR",
      status: "Draft",
      terms: "Net 30",
    },
  },
  {
    id: "r1",
    label: "v1",
    at: "Nov 15, 09:41",
    by: "Hugo Bernard",
    content: { title: "Quote 2026-114", amount: 21000, currency: "EUR", status: "Draft" },
  },
];

export default function Record() {
  return (
    <div style={{ width: "100%" }}>
      <VersionCompare versions={versions} labels={{ amount: "Total", terms: "Payment terms" }} />
    </div>
  );
}
