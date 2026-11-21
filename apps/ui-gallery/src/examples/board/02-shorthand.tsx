import { Board } from "@forgeron/ui";

const columns = [
  { id: "todo", title: "To do", items: ["Write the brief", "Book the venue"] },
  { id: "doing", title: "Doing", items: ["Draft the invoice"] },
  { id: "done", title: "Done", items: [] as string[] },
];

export default function Default() {
  return (
    <div style={{ width: "100%" }}>
      <Board columns={columns} itemKey={(item) => item} renderItem={(item) => item} />
    </div>
  );
}
