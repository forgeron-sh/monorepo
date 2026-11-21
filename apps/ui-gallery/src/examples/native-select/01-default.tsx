import { Select } from "@forgeron/ui";

const stages = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
];

export default function Default() {
  return <Select options={stages} placeholder="Choose a stage" aria-label="Stage" />;
}
