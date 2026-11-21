import { NoteAddIcon } from "@forgeron/icons";
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <EmptyState>
        <EmptyStateIcon icon={NoteAddIcon} />
        <EmptyStateTitle>No project views yet.</EmptyStateTitle>
        <EmptyStateDescription>Filter the projects list, then save it.</EmptyStateDescription>
        <EmptyStateActions>
          <Button variant="primary">New view</Button>
        </EmptyStateActions>
      </EmptyState>
    </div>
  );
}
