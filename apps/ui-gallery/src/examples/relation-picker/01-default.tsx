import { RelationPicker } from "@forgeron/ui";

const companies = [
  { id: "c-104", label: "Fromagerie Roy", hint: "Lyon" },
  { id: "c-212", label: "Garnier Transports", hint: "Grenoble" },
  { id: "c-318", label: "Petit & Fils", hint: "Annecy" },
  { id: "c-402", label: "Martin Distribution", hint: "Chambéry" },
];

export default function Default() {
  return (
    <div style={{ width: 260 }}>
      <RelationPicker label="Company" targets={companies} defaultValue={["c-212"]} />
    </div>
  );
}
