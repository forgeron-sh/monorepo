import { NoteAddIcon } from "@forgeron/icons";
import { EmptyState } from "@forgeron/ui";

export default function Hatch() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <EmptyState
        variant="hatch"
        icon={NoteAddIcon}
        title="No form here yet."
        description={
          <>
            <a href="#new">Create one</a> or <a href="#templates">start from a template</a>.
          </>
        }
      />
    </div>
  );
}
