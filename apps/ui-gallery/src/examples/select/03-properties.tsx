import {
  AlertSquareIcon,
  CheckmarkCircle01Icon,
  CircleIcon,
  Loading03Icon,
  UserIcon,
} from "@forgeron/icons";
import { SelectMenu } from "@forgeron/ui";
import { useState } from "react";

const statuses = [
  { value: "todo", label: "Todo", icon: CircleIcon, hint: "1" },
  { value: "progress", label: "In Progress", icon: Loading03Icon, hint: "2" },
  { value: "review", label: "In Review", icon: AlertSquareIcon, hint: "3" },
  { value: "done", label: "Done", icon: CheckmarkCircle01Icon, hint: "4" },
];

const people = [
  { value: "hb", label: "Hugo Bernard", icon: UserIcon },
  { value: "np", label: "Nadia Petit", icon: UserIcon },
  { value: "lm", label: "Léa Martin", icon: UserIcon },
];

export default function Properties() {
  const [status, setStatus] = useState<string | null>("review");
  return (
    <>
      <SelectMenu
        label="Status"
        variant="chip"
        options={statuses}
        value={status}
        onChange={setStatus}
      />
      <SelectMenu label="Assignee" variant="chip" options={people} defaultValue="hb" />
    </>
  );
}
