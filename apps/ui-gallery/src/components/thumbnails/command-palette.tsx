import { Folder01Icon, InboxIcon, Search01Icon, UserCircleIcon } from "@forgeron/icons";
import { Icon, Kbd } from "@forgeron/ui";

// A still picture of the open palette for the grids: it lives in a portal, after hydration, so
// a static card would only show the button that opens it.

const rows = [
  { label: "Inbox", icon: InboxIcon },
  { label: "My issues", icon: UserCircleIcon },
  { label: "Projects", icon: Folder01Icon },
];

export default function CommandPaletteThumbnail() {
  return (
    <div className="thumb">
      <div className="fg-cmdk" role="presentation">
        <div className="fg-palette-head">
          <Icon icon={Search01Icon} size={12} variant="mono" className="fg-palette-glass" />
          <span className="fg-palette-input thumb-placeholder">Search or run a command…</span>
          <Kbd keys={["⌘", "K"]} />
        </div>
        <div className="fg-palette-list">
          <div className="fg-palette-group">Go to</div>
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="fg-pop-row fg-palette-row"
              {...(i === 0 ? { "data-highlighted": "" } : {})}
            >
              <Icon icon={row.icon} size={12} variant="mono" />
              <span className="fg-pop-label">{row.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
