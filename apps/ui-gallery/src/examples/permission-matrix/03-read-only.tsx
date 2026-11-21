import { PermissionMatrix, permissionKey } from "@forgeron/ui";

export default function ReadOnly() {
  return (
    <div style={{ width: "100%" }}>
      <PermissionMatrix
        label="Permissions of the audit team"
        readOnly
        summaryOpen
        subjects={[
          { id: "audit", name: "Audit", kind: "team" },
          { id: "lea", name: "Léa Martin", kind: "person" },
        ]}
        columns={[
          { id: "logs.read", group: "Logs", label: "Read" },
          { id: "logs.export", group: "Logs", label: "Export" },
        ]}
        defaultValue={{
          [permissionKey("audit", "logs.read")]: "allow",
          [permissionKey("audit", "logs.export")]: "allow",
          [permissionKey("lea", "logs.export")]: "deny",
        }}
      />
    </div>
  );
}
