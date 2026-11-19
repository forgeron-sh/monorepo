import { Gauge } from "@forgeron/ui";

export default function Default() {
  return <Gauge title="Quarterly quota" value={36} target={50} format={(n) => `${n}k`} />;
}
