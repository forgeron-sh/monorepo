import { Cancel01Icon } from "@forgeron/icons";
import { Icon } from "@forgeron/ui";

// A still picture of the open modal for the grids: it lives in a portal, after hydration.

export default function ModalThumbnail() {
  return (
    <div className="thumb">
      <div
        className="fg-modal fg-modal-sm"
        role="presentation"
        style={{ width: 300, display: "grid", gap: 16 }}
      >
        <div className="fg-modal-head">
          <span className="fg-chip">OPS</span>
          <span className="fg-modal-sep">›</span>
          <span className="fg-modal-title">New issue</span>
          <span className="fg-iconbtn fg-iconbtn-sm fg-modal-close">
            <Icon icon={Cancel01Icon} size={12} variant="mono" />
          </span>
        </div>
        <span className="thumb-placeholder">Title</span>
      </div>
    </div>
  );
}
