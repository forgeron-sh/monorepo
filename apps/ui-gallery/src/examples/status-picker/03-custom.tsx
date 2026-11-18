import { StatusPicker } from "@forgeron/ui";

export default function Custom() {
  return (
    <StatusPicker
      defaultValue="review"
      statuses={["todo", "progress", "review", "done"]}
      names={{ todo: "New", progress: "Answering", review: "Waiting on client", done: "Solved" }}
    />
  );
}
