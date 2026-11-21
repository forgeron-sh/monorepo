import { RadioGroup, RadioGroupItem } from "@forgeron/ui";

export default function Composed() {
  return (
    <RadioGroup defaultValue="comfortable">
      {["default", "comfortable", "compact"].map((value) => (
        <div key={value} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RadioGroupItem value={value} id={`r-${value}`} />
          <label htmlFor={`r-${value}`}>{value}</label>
        </div>
      ))}
    </RadioGroup>
  );
}
