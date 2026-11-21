import { Button, EmptyState } from "@forgeron/ui";

export default function WithAction() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <EmptyState
        title="No project views yet."
        description="Filter the projects list, then save it."
        action={<Button variant="primary">New view</Button>}
      />
    </div>
  );
}
