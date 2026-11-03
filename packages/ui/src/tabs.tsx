import { useId, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./cx";

export interface TabItem {
  id: string;
  label: ReactNode;
}

export interface TabsProps {
  label: string;
  tabs: ReadonlyArray<TabItem>;
  value: string;
  onChange: (id: string) => void;
  /** The panel of the selected tab. */
  children?: ReactNode;
  className?: string;
}

/** Tabs with a panel. Left and Right (Home, End) move between them; only the selected one is a tab stop. */
export function Tabs({ label, tabs, value, onChange, children, className }: TabsProps) {
  const id = useId();
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((t) => t.id === value);
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : event.key === "ArrowLeft"
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    onChange(tabs[next]!.id);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };
  return (
    <div className={cx("fg-tabs", className)}>
      <div role="tablist" aria-label={label} className="fg-tablist" onKeyDown={onKeyDown}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${id}-${tab.id}`}
            aria-selected={tab.id === value}
            aria-controls={`${id}-panel`}
            tabIndex={tab.id === value ? 0 : -1}
            className="fg-tab"
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${value}`}
        className="fg-tabpanel"
      >
        {children}
      </div>
    </div>
  );
}
