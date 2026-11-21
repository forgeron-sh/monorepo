import { RadioGroup } from "@forgeron/ui";

export default function Default() {
  return (
    <RadioGroup
      label="Who can open this tool"
      defaultValue="team"
      options={[
        { value: "me", label: "Only me" },
        { value: "team", label: "My team", hint: "Sales, 6 people" },
        { value: "workspace", label: "Everyone in the workspace" },
      ]}
    />
  );
}
