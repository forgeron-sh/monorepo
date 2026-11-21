import { Button } from "@forgeron/ui";

// A still picture of the open menu for the grids: Base UI renders a menu in a portal, after
// hydration, so a static card would only show its trigger.

export default function DropdownMenuThumbnail() {
  return (
    <div className="thumb thumb-stack">
      <Button variant="outline" data-popup-open="">
        Account
      </Button>
      <div className="fg-pop fg-pop-list" role="presentation">
        <div className="fg-pop-heading">Camille Roy</div>
        <div className="fg-pop-row" data-highlighted="">
          <span className="fg-pop-label">Profile</span>
          <span className="fg-pop-hint">⇧⌘P</span>
        </div>
        <div className="fg-pop-row">
          <span className="fg-pop-label">Settings</span>
          <span className="fg-pop-hint">⌘,</span>
        </div>
        <div className="fg-pop-sep" />
        <div className="fg-pop-row fg-pop-danger">
          <span className="fg-pop-label">Sign out</span>
        </div>
      </div>
    </div>
  );
}
