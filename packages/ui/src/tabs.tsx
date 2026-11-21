import { useId, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./cx";
import { Tabs as Base } from "@base-ui/react/tabs";

export interface TabItem {
  id: string;
  label: ReactNode;
}

export interface TabsProps extends Omit<
  ComponentProps<"div">,
  "onChange" | "children" | "className"
> {
  label: string;
  tabs: ReadonlyArray<TabItem>;
  value: string;
  onChange: (id: string) => void;
  /** The panel of the selected tab. */
  children?: ReactNode;
  className?: string;
}

/**
 * With `tabs`: tabs with a panel; Left and Right (Home, End) move between them, only the selected one
 * is a tab stop. Without: the root of shadcn's parts (`TabsList`, `TabsTrigger`, `TabsContent`),
 * D-156.
 */
export function Tabs(props: TabsProps | TabsRootProps) {
  return props.tabs !== undefined ? <TabBar {...props} /> : <TabsRoot {...props} />;
}

function TabBar({ label, tabs, value, onChange, children, className, ...rest }: TabsProps) {
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
    <div data-slot="tabs" {...rest} className={cx("fg-tabs", className)}>
      <div
        role="tablist"
        aria-label={label}
        data-slot="tabs-list"
        className="fg-tablist"
        onKeyDown={onKeyDown}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${id}-${tab.id}`}
            aria-selected={tab.id === value}
            aria-controls={`${id}-panel`}
            tabIndex={tab.id === value ? 0 : -1}
            data-slot="tabs-trigger"
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
        data-slot="tabs-content"
        className="fg-tabpanel"
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- shadcn parts (D-156) */

// shadcn's Tabs parts (D-156), on Base UI (D-147): `Tabs` takes them when given no `tabs`.

type Part<T> = Omit<T, "className"> & { className?: string };

/** `tabs` stays undefined: with tabs, `Tabs` is the props-driven one. */
export type TabsRootProps = Part<ComponentProps<typeof Base.Root>> & { tabs?: undefined };

/** The root of the composed tabs: `value`, `defaultValue`, `onValueChange`, `orientation`. */
function TabsRoot({ className, tabs: _tabs, ...rest }: TabsRootProps) {
  return <Base.Root data-slot="tabs" {...rest} className={cx("fg-tabs", className)} />;
}

/** The row of tabs. Arrows move between them. */
export function TabsList({ className, ...rest }: Part<ComponentProps<typeof Base.List>>) {
  return <Base.List data-slot="tabs-list" {...rest} className={cx("fg-tablist", className)} />;
}

/** One tab; `value` ties it to its `TabsContent`. */
export function TabsTrigger({ className, ...rest }: Part<ComponentProps<typeof Base.Tab>>) {
  return <Base.Tab data-slot="tabs-trigger" {...rest} className={cx("fg-tab", className)} />;
}

/** The panel of the tab with the same `value`. */
export function TabsContent({ className, ...rest }: Part<ComponentProps<typeof Base.Panel>>) {
  return <Base.Panel data-slot="tabs-content" {...rest} className={cx("fg-tabpanel", className)} />;
}
