// The list to add a step from, after the "Add a block" panel of the Flows prototype: a search, a
// row of categories, and the triggers or actions grouped under a closed band, each with its pixel
// icon, its app and one line. The search keeps the focus; arrows move, Enter adds.

import type { IconDefinition } from "@forgeron/icons";
import { Search01Icon } from "@forgeron/icons";
import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";

export interface StepOption {
  id: string;
  /** `Deal moved to Won`. */
  label: string;
  /** One line: `When a deal reaches Won`. */
  description?: string;
  icon: IconDefinition;
  /** The id of its group: `trigger`, `apps`, `logic`. */
  group: string;
  /** The app it comes from, before the description: `CRM`. */
  app?: string;
  /** A short mark at the end: `code`, `beta`. */
  tag?: string;
  /** More words the search finds it by. */
  keywords?: string;
}

export interface StepGroup {
  id: string;
  label: string;
}

export interface StepPickerProps {
  options: ReadonlyArray<StepOption>;
  /** The groups, in order, with their names. Without it, groups come in the order of the options. */
  groups?: ReadonlyArray<StepGroup>;
  onPick: (id: string) => void;
  /** Above the search: `Add a step`. */
  title?: ReactNode;
  /** Under the title: where the step goes, `After “Deal moved to Won”`. */
  context?: ReactNode;
  placeholder?: string;
  /** The row of groups to narrow the list; shown when there are several groups. */
  categories?: boolean;
  /** At the bottom: `Missing a step? Write a function.` and a button. */
  footer?: ReactNode;
  /** Focuses the search when shown. */
  autoFocus?: boolean;
  /** Shown when nothing matches. */
  empty?: ReactNode;
  className?: string;
}

/** Triggers or actions to add, grouped, searchable, from the keyboard. */
export function StepPicker({
  options,
  groups,
  onPick,
  title,
  context,
  placeholder = "Search steps",
  categories,
  footer,
  autoFocus,
  empty = "No step matches",
  className,
}: StepPickerProps) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [active, setActive] = useState(0);

  const order = useMemo(() => {
    if (groups) return groups;
    const seen: StepGroup[] = [];
    for (const o of options)
      if (!seen.some((g) => g.id === o.group)) seen.push({ id: o.group, label: o.group });
    return seen;
  }, [groups, options]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return order
      .filter((g) => category === "all" || g.id === category)
      .map((g) => ({
        group: g,
        items: options.filter(
          (o) =>
            o.group === g.id &&
            (!q ||
              [o.label, o.description, o.app, o.keywords]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(q)),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [order, options, query, category]);

  const flat = shown.flatMap((g) => g.items);
  const current = Math.min(active, Math.max(flat.length - 1, 0));
  const optionId = (i: number) => `${id}-o${i}`;
  const showCategories = (categories ?? true) && order.length > 1;

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const last = flat.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(current + 1, last),
      ArrowUp: Math.max(current - 1, 0),
      PageDown: Math.min(current + 6, last),
      PageUp: Math.max(current - 6, 0),
    };
    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]!);
      document.getElementById(optionId(moves[event.key]!))?.scrollIntoView?.({ block: "nearest" });
    } else if (event.key === "Enter") {
      const option = flat[current];
      if (!option) return;
      event.preventDefault();
      onPick(option.id);
    }
  };

  return (
    <div className={cx("fg-spick", className)}>
      {title || context ? (
        <div className="fg-spick-head">
          {title ? <div className="fg-spick-title">{title}</div> : null}
          {context ? <div className="fg-spick-context">{context}</div> : null}
        </div>
      ) : null}
      <label className="fg-spick-search">
        <Icon icon={Search01Icon} size={12} variant="mono" />
        <input
          // oxlint-disable-next-line jsx-a11y/no-autofocus -- the picker opens to be typed into
          autoFocus={autoFocus}
          className="fg-spick-input"
          role="combobox"
          aria-expanded="true"
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={flat.length ? optionId(current) : undefined}
          aria-label={placeholder}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
      </label>
      {showCategories ? (
        <div className="fg-spick-cats" role="group" aria-label="Category">
          {[{ id: "all", label: "All" }, ...order].map((g) => (
            <button
              key={g.id}
              type="button"
              className="fg-spick-cat"
              aria-pressed={category === g.id}
              onClick={() => {
                setCategory(g.id);
                setActive(0);
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="fg-spick-list" id={`${id}-list`} role="listbox" aria-label="Steps">
        {shown.length === 0 ? <div className="fg-spick-empty">{empty}</div> : null}
        {shown.map(({ group, items }) => (
          <div key={group.id} role="group" aria-labelledby={`${id}-g-${group.id}`}>
            <div className="fg-spick-group" id={`${id}-g-${group.id}`}>
              <span>{group.label}</span>
            </div>
            {items.map((o) => {
              const i = flat.indexOf(o);
              return (
                <div
                  key={o.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === current}
                  className="fg-spick-row"
                  onPointerDown={(e) => e.preventDefault()}
                  onPointerMove={() => i !== current && setActive(i)}
                  onClick={() => onPick(o.id)}
                >
                  <span className="fg-step-tile">
                    <Icon icon={o.icon} size={12} />
                  </span>
                  <span className="fg-spick-text">
                    <span className="fg-spick-label">{o.label}</span>
                    {o.app || o.description ? (
                      <span className="fg-spick-desc">
                        {[o.app, o.description].filter(Boolean).join(" · ")}
                      </span>
                    ) : null}
                  </span>
                  {o.tag ? <span className="fg-spick-tag">{o.tag}</span> : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {footer ? <div className="fg-spick-foot">{footer}</div> : null}
    </div>
  );
}
