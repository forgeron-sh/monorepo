import { LineChart } from "@forgeron/ui";

const days = [
  420, 455, 610, 640, 590, 300, 260, 480, 530, 660, 700, 690, 340, 310, 510, 560, 720, 760, 740,
  380, 330, 540, 600, 780, 810, 790, 410, 360,
];
const before = [
  380, 400, 520, 560, 540, 280, 240, 430, 470, 580, 610, 600, 300, 280, 450, 500, 630, 660, 650,
  330, 300, 480, 520, 680, 700, 690, 350, 320,
];
// Four weeks from Oct 21: the dotted line is the four weeks before.
const date = (i: number) => (i < 11 ? `Oct ${21 + i}` : `Nov ${i - 10}`);

export default function AgainstLastPeriod() {
  return (
    <div style={{ width: "100%" }}>
      <LineChart
        title="Requests per day"
        points={days.map((value, i) => ({ label: date(i), value }))}
        previous={before}
        format={(v) => v.toLocaleString("en")}
      />
    </div>
  );
}
