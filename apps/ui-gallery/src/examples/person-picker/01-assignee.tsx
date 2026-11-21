import { PersonPicker } from "@forgeron/ui";

const people = [
  { id: "cr", name: "Camille Roy", hint: "Sales" },
  { id: "hb", name: "Hugo Bernard", hint: "Engineering" },
  { id: "lm", name: "Léa Martin", hint: "Operations" },
  { id: "np", name: "Nadia Petit", hint: "Finance" },
  { id: "tg", name: "Tom Garnier", hint: "Support" },
];

export default function Assignee() {
  return (
    <>
      <PersonPicker people={people} me="cr" noneLabel="No assignee" defaultValue="hb" />
      <PersonPicker label="Author" people={people} me="cr" defaultValue="cr" />
    </>
  );
}
