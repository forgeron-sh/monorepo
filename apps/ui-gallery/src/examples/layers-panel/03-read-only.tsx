import { LayersPanel } from "@forgeron/ui";

export default function ReadOnly() {
  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      <LayersPanel
        label="Layers (read only)"
        readOnly
        defaultLayers={[
          {
            id: "a",
            name: "Header",
            children: [
              { id: "a1", name: "Logo" },
              { id: "a2", name: "Menu", visible: false },
            ],
          },
          { id: "b", name: "Content", locked: true },
        ]}
        defaultSelected={["a1"]}
      />
    </div>
  );
}
