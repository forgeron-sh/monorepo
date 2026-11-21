import { OrgChart, type OrgPerson } from "@forgeron/ui";

export const team: OrgPerson[] = [
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
          { id: "fe", name: "Noah Petit", title: "Frontend lead" },
          { id: "open", name: "Platform", title: "Platform engineer", vacant: true },
        ],
      },
      {
        id: "coo",
        name: "Inès Garcia",
        title: "COO",
        children: [{ id: "ops", name: "Sam Dupont", title: "Operations" }],
      },
      { id: "cfo", name: "Maya Lopez", title: "CFO" },
    ],
  },
];

export default function Default() {
  return (
    <div style={{ width: "100%" }}>
      <OrgChart roots={team} defaultSelected="cto" />
    </div>
  );
}
