// The parts of the chart: the canvas holds the links and the cards, which you may place yourself.
import {
  OrgChart,
  OrgChartCanvas,
  OrgChartCards,
  OrgChartLinks,
  type OrgPerson,
} from "@forgeron/ui";
import { useState } from "react";

const team: OrgPerson[] = [
  {
    id: "ceo",
    name: "Camille Roy",
    title: "Chief executive",
    children: [
      {
        id: "cto",
        name: "Hugo Bernard",
        title: "CTO",
        children: [
          { id: "be", name: "Léa Martin", title: "Backend lead" },
          { id: "open", name: "Platform", title: "Platform engineer", vacant: true },
        ],
      },
      { id: "cfo", name: "Maya Lopez", title: "CFO" },
    ],
  },
];

export default function Default() {
  const [picked, setPicked] = useState<string | null>("cto");
  return (
    <div style={{ width: "100%" }}>
      <OrgChart roots={team} selected={picked} onSelectedChange={setPicked} label="Team">
        <OrgChartCanvas>
          <OrgChartLinks />
          <OrgChartCards />
        </OrgChartCanvas>
      </OrgChart>
    </div>
  );
}
