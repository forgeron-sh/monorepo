// The list to add a step from, after the "Add a block" panel of the Flows prototype: a search, a
// row of categories, and the triggers or actions grouped under a closed band, each with its pixel
// icon, its app and one line. The search keeps the focus; arrows move, Enter adds. The search and
// the list are the Combobox parts, open inline and filtered here (by the words and the category).

import type { IconDefinition } from "@forgeron/icons";
import { Search01Icon } from "@forgeron/icons";
import { useMemo, useState, type ReactNode } from "react";
import {
  Combobox,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "../combobox";
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

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
        value: g.id,
        label: g.label,
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

  const showCategories = (categories ?? true) && order.length > 1;

  return (
    <div className={cx("fg-spick", className)}>
      {title || context ? (
        <div className="fg-spick-head">
          {title ? <div className="fg-spick-title">{title}</div> : null}
          {context ? <div className="fg-spick-context">{context}</div> : null}
        </div>
      ) : null}
      <Combobox
        inline
        open
        // Base UI accepts "always" (the first row lit as the list opens); its types say boolean.
        {...({ autoHighlight: "always" } as object)}
        loopFocus={false}
        filter={null}
        items={shown}
        value={null}
        itemToStringLabel={(o: StepOption) => o.label}
        isItemEqualToValue={(a: StepOption, b: StepOption) => a.id === b.id}
        onValueChange={(option: StepOption | null) => {
          if (option) onPick(option.id);
        }}
        inputValue={query}
        onInputValueChange={(next: string, details: { isItemPress?: boolean }) => {
          if (!details.isItemPress) setQuery(next);
        }}
      >
        <label className="fg-spick-search">
          <Icon icon={Search01Icon} size={12} variant="mono" />
          <ComboboxChipsInput
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- the picker opens to be typed into
            autoFocus={autoFocus}
            className="fg-spick-input"
            aria-label={placeholder}
            placeholder={placeholder}
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
                onClick={() => setCategory(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
        ) : null}
        <ComboboxEmpty className="fg-spick-empty">{empty}</ComboboxEmpty>
        <ComboboxList className="fg-spick-list" aria-label="Steps">
          {(group: (typeof shown)[number]) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel className="fg-spick-group">
                <span>{group.label}</span>
              </ComboboxLabel>
              <ComboboxCollection>
                {(o: StepOption) => (
                  <ComboboxItem
                    key={o.id}
                    value={o}
                    indicator={false}
                    className="fg-spick-row"
                    glyph={
                      <span className="fg-step-tile">
                        <Icon icon={o.icon} size={12} />
                      </span>
                    }
                    trailing={o.tag ? <span className="fg-spick-tag">{o.tag}</span> : null}
                  >
                    <span className="fg-spick-text">
                      <span className="fg-spick-label">{o.label}</span>
                      {o.app || o.description ? (
                        <span className="fg-spick-desc">
                          {[o.app, o.description].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </Combobox>
      {footer ? <div className="fg-spick-foot">{footer}</div> : null}
    </div>
  );
}
