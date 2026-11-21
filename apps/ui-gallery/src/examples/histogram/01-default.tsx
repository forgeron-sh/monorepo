import { Histogram } from "@forgeron/ui";

// 600 response times, a long tail: the p50 and p95 rules, and the tail past the 400 ms objective.
let seed = 7;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const times = Array.from({ length: 600 }, () => {
  const base = 80 + 120 * random() + 80 * random();
  return Math.round(random() < 0.08 ? base + 300 * random() + 150 : base);
});

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <Histogram
        title="Gateway response time"
        values={times}
        unit="requests"
        format={(v) => `${Math.round(v)} ms`}
        threshold={400}
      />
    </div>
  );
}
