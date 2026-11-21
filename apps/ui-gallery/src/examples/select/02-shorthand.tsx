import { SelectMenu } from "@forgeron/ui";

const stages = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export default function Default() {
  return <SelectMenu label="Stage" showLabel options={stages} placeholder="Choose a stage" />;
}
