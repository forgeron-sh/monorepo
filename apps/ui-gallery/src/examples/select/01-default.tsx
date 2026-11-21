import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@forgeron/ui";

// shadcn's composition: Select without options is the root of the parts.
const items = [
  { value: "eu", label: "Europe (Paris)" },
  { value: "us", label: "United States (Ohio)" },
];

export default function Composed() {
  return (
    <Select items={items} defaultValue="eu">
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Region" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Region</SelectLabel>
          {items.map((i) => (
            <SelectItem key={i.value} value={i.value}>
              {i.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
