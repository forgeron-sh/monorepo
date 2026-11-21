import { SelectMenu, personOptions, priorityOptions, sizeOptions } from "@forgeron/ui";

const people = [
  { id: "ana", name: "Ana Costa", hint: "Design" },
  { id: "leo", name: "Leo Martin", hint: "Platform" },
];

// The same lists in SelectMenu, as a form field.
export default function WithSelectMenu() {
  return (
    <div className="flex flex-wrap gap-4">
      <SelectMenu label="Priority" options={priorityOptions} defaultValue="2" />
      <SelectMenu label="Size" options={sizeOptions([0, 1, 2, 3, 5, 8])} defaultValue="3" />
      <SelectMenu label="Owner" options={personOptions(people, "leo")} defaultValue="leo" />
    </div>
  );
}
