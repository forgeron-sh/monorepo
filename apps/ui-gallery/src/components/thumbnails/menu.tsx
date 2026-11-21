import { Button } from "@forgeron/ui";

// A still picture of the open menu for the grids: Base UI renders a menu in a portal, after
// hydration, so a static card would only show its trigger.

export default function MenuThumbnail() {
  return (
    <div className="thumb thumb-stack">
      <Button variant="outline" data-popup-open="">
        Camille Roy
      </Button>
      <div className="fg-pop fg-pop-list fg-menu-list" role="presentation">
        <div className="fg-pop-heading">Theme</div>
        <div className="fg-pop-row fg-pop-inset">System</div>
        <div className="fg-pop-row fg-pop-inset" data-highlighted="">
          Forge
        </div>
        <div className="fg-pop-sep" />
        <div className="fg-pop-row">Documentation</div>
        <div className="fg-pop-row fg-pop-danger">Sign out</div>
      </div>
    </div>
  );
}
