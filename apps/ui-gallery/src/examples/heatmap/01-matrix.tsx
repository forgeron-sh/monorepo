import { Heatmap } from "@forgeron/ui";

const values = [
  [4, 9, 12, 7, 3, 0, 0],
  [1, 3, 5, 8, 6, 1, 0],
  [10, 14, 20, 17, 12, 2, 1],
  [0, 2, 3, 2, 1, 0, 0],
];

export default function Matrix() {
  return (
    <Heatmap
      title="Activity by team"
      rows={["Sales", "Support", "Ops", "Finance"]}
      columns={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
      values={values}
      cell={22}
      unit="activities"
      highlight="Ops"
    />
  );
}
