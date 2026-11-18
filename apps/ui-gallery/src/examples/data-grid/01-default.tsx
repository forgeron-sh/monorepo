import { DataGrid } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: 380 }}>
      <DataGrid
        label="contacts"
        columns={[
          { name: "id", type: "integer", chips: [{ kind: "primary" }], numeric: true },
          { name: "email", type: "text", chips: [{ kind: "unique" }] },
          { name: "phone", type: "text" },
        ]}
        rows={[
          [1, "camille@roy.fr", "+33 6 12 34 56 78"],
          [2, "hugo@roy.fr", null],
          [3, "lea@roy.fr", null],
        ]}
      />
    </div>
  );
}
