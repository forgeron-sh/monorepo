import { RankingField } from "@forgeron/ui";

// Starts ordered: no dimming and no Keep this order button.
export default function Ordered() {
  return (
    <div style={{ width: 420, maxWidth: "100%" }}>
      <RankingField
        label="Your priorities"
        defaultValue={["b", "c", "a"]}
        items={[
          { id: "a", label: "Price" },
          { id: "b", label: "Quality" },
          { id: "c", label: "Delivery time" },
        ]}
      />
    </div>
  );
}
