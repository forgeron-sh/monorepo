import {
  ArrowRight02Icon,
  Delete02Icon,
  Download01Icon,
  Link01Icon,
  StarIcon,
  UserAdd01Icon,
} from "@forgeron/icons";
import { SelectionBar } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <SelectionBar
        count={3}
        onClear={() => {}}
        inline={5}
        iconOnly={["star", "trash"]}
        actions={[
          { id: "share", label: "Share", icon: UserAdd01Icon },
          { id: "download", label: "Download", icon: Download01Icon },
          { id: "move", label: "Move", icon: ArrowRight02Icon },
          { id: "star", label: "Star", icon: StarIcon },
          { id: "trash", label: "Move to trash", icon: Delete02Icon, danger: true },
          { id: "link", label: "Copy link", icon: Link01Icon },
        ]}
      />
    </div>
  );
}
