import { Cancel01Icon } from "@forgeron/icons";
import { Button, Icon } from "@forgeron/ui";

// A still picture of the open dialog for the grids: the dialog lives in a portal, after hydration.

export default function DialogThumbnail() {
  return (
    <div className="thumb">
      <div
        className="fg-dialog"
        role="presentation"
        style={{ position: "relative", display: "grid", gap: 16 }}
      >
        <div className="fg-dialog-header">
          <span className="fg-dialog-title">Rename the report</span>
          <span className="fg-dialog-desc">Shown to everyone in the workspace.</span>
        </div>
        <span className="fg-dialog-x">
          <Icon icon={Cancel01Icon} size={12} variant="mono" />
        </span>
        <div className="fg-dialog-foot" style={{ marginTop: 8 }}>
          <Button variant="ghost">Cancel</Button>
          <Button variant="default">Save</Button>
        </div>
      </div>
    </div>
  );
}
