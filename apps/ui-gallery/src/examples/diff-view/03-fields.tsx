import { FieldDiff } from "@forgeron/ui";

const before = {
  name: "Acme Logistics",
  status: "Prospect",
  owner: "Hugo Bernard",
  address: { street: "12 rue Vauban", city: "Lyon" },
  tags: ["transport", "eu"],
  notes: "Asked for a quote on pallets.",
  phone: "+33 4 72 00 00 00",
};
const after = {
  name: "Acme Logistics SAS",
  status: "Customer",
  owner: "Hugo Bernard",
  address: { street: "12 rue Vauban", city: "Villeurbanne" },
  tags: ["transport", "eu", "priority"],
  notes: "Asked for a quote on pallets and containers.",
  website: "acme.example",
  phone: "+33 4 72 00 00 00",
};

export default function Fields() {
  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <FieldDiff
        before={before}
        after={after}
        beforeLabel="Nov 12"
        afterLabel="Nov 18"
        labels={{ "address.city": "City", "address.street": "Street" }}
      />
    </div>
  );
}
