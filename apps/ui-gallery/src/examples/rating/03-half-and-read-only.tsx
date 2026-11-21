import { Rating } from "@forgeron/ui";

export default function HalfAndReadOnly() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Rating label="Your rating" half defaultValue={3.5} />
      <Rating label="Average" readOnly value={4.5} size={12} />
    </div>
  );
}
