import { RadioGroup } from "@forgeron/ui";

export default function Row() {
  return (
    <RadioGroup
      label="Billing"
      direction="row"
      defaultValue="monthly"
      options={[
        { value: "monthly", label: "Monthly" },
        { value: "yearly", label: "Yearly" },
      ]}
    />
  );
}
