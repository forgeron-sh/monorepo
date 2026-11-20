import { Cancel01Icon } from "@forgeron/icons";
import { Button, Icon } from "@forgeron/ui";

// A still picture of the open sheet for the grids: the sheet lives in a portal, after hydration.

export default function SheetThumbnail() {
  return (
    <div className="thumb">
      <div
        className="fg-sheet"
        role="presentation"
        data-side="right"
        style={{ position: "relative", width: 240, transition: "none" }}
      >
        <div className="fg-sheet-header">
          <span className="fg-dialog-title">Edit profile</span>
          <span className="fg-dialog-desc">Make changes to your profile here.</span>
        </div>
        <span className="fg-dialog-x">
          <Icon icon={Cancel01Icon} size={12} variant="mono" />
        </span>
        <div className="fg-sheet-foot">
          <Button variant="default">Save changes</Button>
          <Button variant="outline">Close</Button>
        </div>
      </div>
    </div>
  );
}
