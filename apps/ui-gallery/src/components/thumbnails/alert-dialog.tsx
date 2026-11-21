import { Button } from "@forgeron/ui";

// A still picture of the open alert dialog for the grids: it lives in a portal, after hydration.

export default function AlertDialogThumbnail() {
  return (
    <div className="thumb">
      <div
        className="fg-dialog"
        role="presentation"
        style={{ position: "relative", display: "grid", gap: 16 }}
      >
        <div className="fg-dialog-header">
          <span className="fg-dialog-title">Are you sure?</span>
          <span className="fg-dialog-desc">This cannot be undone.</span>
        </div>
        <div className="fg-dialog-foot" style={{ marginTop: 8 }}>
          <Button variant="outline">Cancel</Button>
          <Button variant="default">Continue</Button>
        </div>
      </div>
    </div>
  );
}
