import { Slider } from "@forgeron/ui";

export default function Composed() {
  return <Slider defaultValue={[50]} max={100} step={1} style={{ width: "60%" }} />;
}
