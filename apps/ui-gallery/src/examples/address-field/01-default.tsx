import { AddressField, AddressFieldPart } from "@forgeron/ui";

// Only the parts you need, in the order you want.
export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <AddressField aria-label="Delivery address" required>
        <AddressFieldPart name="line1" label="Street" />
        <AddressFieldPart name="postcode" />
        <AddressFieldPart name="city" />
      </AddressField>
    </div>
  );
}
