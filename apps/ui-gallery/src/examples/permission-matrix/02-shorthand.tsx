import {
  PermissionMatrix,
  permissionKey,
  type PermissionColumn,
  type PermissionSubject,
  type PermissionValue,
} from "@forgeron/ui";
import { useState } from "react";

const subjects: PermissionSubject[] = [
  { id: "ada", name: "Ada Lovelace", kind: "person", hint: "ada@example.test" },
  { id: "sam", name: "Sam Roche", kind: "person", hint: "sam@example.test" },
  { id: "finance", name: "Finance", kind: "team", hint: "4 members" },
  { id: "support", name: "Support", kind: "team", hint: "9 members" },
];

const columns: PermissionColumn[] = [
  { id: "invoices.read", group: "Invoices", label: "Read" },
  { id: "invoices.write", group: "Invoices", label: "Write" },
  { id: "invoices.delete", group: "Invoices", label: "Delete" },
  { id: "people.read", group: "People", label: "Read" },
  { id: "people.write", group: "People", label: "Write" },
];

const saved: PermissionValue = {
  [permissionKey("ada", "invoices.read")]: "allow",
  [permissionKey("ada", "invoices.write")]: "allow",
  [permissionKey("finance", "invoices.read")]: "allow",
  [permissionKey("finance", "invoices.write")]: "allow",
  [permissionKey("support", "invoices.write")]: "deny",
};

export default function Default() {
  const [value, setValue] = useState<PermissionValue>(saved);
  return (
    <div style={{ width: "100%" }}>
      <PermissionMatrix
        label="Permissions of the workspace"
        subjects={subjects}
        columns={columns}
        value={value}
        onChange={setValue}
        saved={saved}
        inherited={(_subject, column) => (column.endsWith(".read") ? "allow" : undefined)}
      />
    </div>
  );
}
