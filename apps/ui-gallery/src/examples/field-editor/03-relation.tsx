// A relation: the table it points at, one or several records, a default record.
import { FieldEditor } from "@forgeron/ui";

export default function Relation() {
  return (
    <div style={{ width: 400 }}>
      <FieldEditor
        defaultValue={{
          id: "company",
          name: "company_id",
          type: "relation",
          relation: { table: "companies" },
        }}
        tables={[
          { value: "companies", label: "Companies" },
          { value: "contacts", label: "Contacts" },
          { value: "invoices", label: "Invoices" },
        ]}
        submitLabel="Add field"
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    </div>
  );
}
