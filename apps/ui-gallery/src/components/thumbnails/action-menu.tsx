import {
  ArrowUpRight01Icon,
  Copy01Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  Notification01Icon,
} from "@forgeron/icons";
import { Icon, IconButton, Kbd } from "@forgeron/ui";

// A still picture of the open menu for the grids: Base UI renders a menu in a portal, after
// hydration, so a static card would only show its trigger.

const rows = [
  { label: "Open issue", icon: ArrowUpRight01Icon, kbd: "↵" },
  { label: "Copy ID", icon: Copy01Icon },
  { label: "Subscribe", icon: Notification01Icon },
];

export default function ActionMenuThumbnail() {
  return (
    <div className="thumb thumb-stack">
      <IconButton
        icon={MoreHorizontalIcon}
        label="Issue actions"
        variant="boxed"
        data-popup-open=""
      />
      <div className="fg-pop fg-amenu" role="presentation">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="fg-pop-row fg-amenu-row"
            {...(i === 0 ? { "data-highlighted": "" } : {})}
          >
            <span className="fg-amenu-mark">
              <Icon icon={row.icon} size={12} variant="mono" />
            </span>
            <span className="fg-pop-label">{row.label}</span>
            {row.kbd ? <Kbd keys={row.kbd} className="fg-amenu-kbd" /> : null}
          </div>
        ))}
        <div className="fg-amenu-sep" />
        <div className="fg-pop-row fg-amenu-row fg-amenu-danger">
          <span className="fg-amenu-mark">
            <Icon icon={Delete02Icon} size={12} variant="mono" />
          </span>
          <span className="fg-pop-label">Delete issue</span>
        </div>
      </div>
    </div>
  );
}
