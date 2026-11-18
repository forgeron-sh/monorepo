import { Cancel01Icon } from "@forgeron/icons";
import { Button, Icon, PriorityPicker, PropertyChips, StatusPicker, Switch } from "@forgeron/ui";

// A still picture of the open dialog for the grids: the modal lives in a portal, after
// hydration, so a static card would only show the button that opens it.

export default function CreateDialogThumbnail() {
  return (
    <div className="thumb">
      <div className="fg-modal fg-modal-sm" role="presentation">
        <div className="fg-modal-head">
          <span className="fg-modal-title">New issue</span>
          <span className="fg-iconbtn fg-iconbtn-sm fg-modal-close">
            <Icon icon={Cancel01Icon} size={12} variant="mono" />
          </span>
        </div>
        <div className="fg-create">
          <span className="fg-create-title thumb-placeholder">Issue title</span>
          <span className="fg-create-desc thumb-placeholder">Add description…</span>
          <PropertyChips className="fg-create-props">
            <StatusPicker defaultValue="todo" />
            <PriorityPicker defaultValue={2} />
          </PropertyChips>
          <div className="fg-create-foot">
            <span className="fg-create-space" />
            <Switch label="Create more" />
            <Button variant="primary" size="sm" kbd="⌘↵">
              Create issue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
