import { Sortable, SortableItem } from "@forgeron/ui";

const columns = [
  { id: "name", label: "Name" },
  { id: "status", label: "Status" },
  { id: "owner", label: "Owner" },
  { id: "due", label: "Due date" },
  { id: "tags", label: "Tags" },
];

export default function Default() {
  return (
    <Sortable
      label="Columns"
      defaultItems={columns}
      getLabel={(column) => column.label}
      style={{ width: 280 }}
    >
      {(column) => (
        <SortableItem key={column.id} id={column.id}>
          {column.label}
        </SortableItem>
      )}
    </Sortable>
  );
}
