import { CrownIcon } from "@forgeron/icons";
import { FileTypeMark } from "@forgeron/ui";

// A row, a header and a preview; another icon and colour for a team drive.
export default function Sizes() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <FileTypeMark kind="sheet" />
      <FileTypeMark kind="sheet" size="lg" />
      <FileTypeMark kind="sheet" size="xl" />
      <FileTypeMark
        kind="folder"
        size="lg"
        icon={CrownIcon}
        tone="var(--accent)"
        label="Direction"
      />
    </div>
  );
}
