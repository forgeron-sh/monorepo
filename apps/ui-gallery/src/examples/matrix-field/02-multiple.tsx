import { MatrixField } from "@forgeron/ui";

export default function Multiple() {
  return (
    <div style={{ width: 520, maxWidth: "100%" }}>
      <MatrixField
        label="Which days can you work each shift?"
        multiple
        rows={[
          { id: "early", label: "Early" },
          { id: "late", label: "Late" },
        ]}
        columns={[
          { id: "mon", label: "Mon" },
          { id: "tue", label: "Tue" },
          { id: "wed", label: "Wed" },
          { id: "thu", label: "Thu" },
          { id: "fri", label: "Fri" },
        ]}
        defaultValue={{ early: ["mon", "wed"] }}
      />
    </div>
  );
}
