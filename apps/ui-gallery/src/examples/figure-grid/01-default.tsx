import { FigureGrid } from "@forgeron/ui";

export default function Default() {
  return (
    <FigureGrid
      figures={[
        { n: "348", label: "cities in the network" },
        { n: "50MS", label: "from 95% of Internet users" },
        { n: "13K+", label: "network interconnections" },
        { n: "0", label: "cold starts, on V8 isolates" },
      ]}
    />
  );
}
