import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  statusOptions,
} from "@forgeron/ui";

// The picker's options, in shadcn's Select parts: the glyph and the hint ride on the item.
export default function ComposedSelect() {
  return (
    <Select
      items={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
      defaultValue="progress"
    >
      <SelectTrigger variant="chip">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((o) => (
          <SelectItem key={o.value} value={o.value} glyph={o.glyph}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
