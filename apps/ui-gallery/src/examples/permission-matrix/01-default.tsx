import {
  PermissionMatrix,
  PermissionMatrixBar,
  PermissionMatrixGrid,
  PermissionMatrixKeys,
  PermissionMatrixStatus,
  PermissionMatrixSummary,
  permissionKey,
  type PermissionColumn,
  type PermissionSubject,
  type PermissionValue,
} from "@forgeron/ui";
import { useState } from "react";

const subjects: PermissionSubject[] = [
  { id: "ada", name: "Ada Lovelace", kind: "person", hint: "ada@example.test" },
  { id: "finance", name: "Finance", kind: "team", hint: "4 members" },
  { id: "support", name: "Support", kind: "team", hint: "9 members" },
];

const columns: PermissionColumn[] = [
  { id: "invoices.read", group: "Invoices", label: "Read" },
  { id: "invoices.write", group: "Invoices", label: "Write" },
  { id: "people.read", group: "People", label: "Read" },
];

const saved: PermissionValue = {
  [permissionKey("ada", "invoices.read")]: "allow",
  [permissionKey("finance", "invoices.write")]: "allow",
  [permissionKey("support", "invoices.write")]: "deny",
};

export default function Composed() {
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
      >
        <PermissionMatrixBar />
        <PermissionMatrixGrid />
        <PermissionMatrixKeys />
        <PermissionMatrixSummary />
        <PermissionMatrixStatus />
      </PermissionMatrix>
    </div>
  );
}
