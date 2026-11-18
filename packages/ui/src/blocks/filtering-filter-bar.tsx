// The filters of a list view: a "Filter" button that adds one (a field, then its values), and the
// bar of chips that says them: "Status is any of Todo, In Progress ×". After the Tasks prototype.

import { Popover } from "@base-ui/react/popover";
import { Cancel01Icon, FilterIcon, PlusSignIcon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { useState } from "react";
import { cx } from "../cx";
import { useDisclosure } from "../hooks/use-disclosure";
import { Icon } from "../icon";
import {
  operatorText,
  setFilterValues,
  toggleFilterOperator,
  type Filter,
  type FilterField,
} from "./filtering-model";
import { FieldList, ValueList } from "./filtering-picker";

/* ---------------------------------------------------------------- FilterMenu */

export interface FilterMenuProps {
  /** The fields that can be filtered, in the order of the menu. */
  fields: ReadonlyArray<FilterField>;
  value: ReadonlyArray<Filter>;
  onChange: (value: Filter[]) => void;
  /** `button` (default): "Filter" with its icon. `icon`: a square "+" for the end of the bar. */
  variant?: "button" | "icon";
  /** The words of the button. */
  label?: string;
  /** Opens and closes the menu from outside, e.g. from the F shortcut. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * The "Filter" button: a list of fields opens, then the values of the one chosen, ticked several
 * at once. Backspace in the empty search goes back to the fields.
 */
export function FilterMenu({
  fields,
  value,
  onChange,
  variant = "button",
  label = "Filter",
  open: openProp,
  onOpenChange,
  className,
}: FilterMenuProps) {
  const { open, setOpen } = useDisclosure({ open: openProp, onOpenChange });
  const [step, setStep] = useState<string | null>(null);
  const field = step ? fields.find((f) => f.id === step) : undefined;
  const values = field ? (value.find((f) => f.field === field.id)?.values ?? []) : [];
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setStep(null);
      }}
    >
      <Popover.Trigger
        className={cx(
          variant === "icon" ? "fg-iconbtn fg-iconbtn-sm" : "fg-btn fg-btn-sm fg-btn-ghost",
          "fg-filters-trigger",
          className,
        )}
        aria-label={variant === "icon" ? "Add filter" : undefined}
      >
        <Icon icon={variant === "icon" ? PlusSignIcon : FilterIcon} size={12} variant="mono" />
        {variant === "icon" ? null : <span className="fg-filters-trigger-text">{label}</span>}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="fg-pop-positioner" sideOffset={4} align="start">
          <Popover.Popup className="fg-pop fg-fpop" aria-label={field ? field.label : "Filter by"}>
            {field ? (
              <ValueList
                key={field.id}
                field={field}
                values={values}
                onChange={(next) => onChange(setFilterValues(value, field.id, next))}
                onBack={() => setStep(null)}
              />
            ) : (
              <FieldList fields={fields} filters={value} onPick={setStep} />
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* ---------------------------------------------------------------- FilterChip */

interface FilterChipProps {
  field: FilterField;
  filter: Filter;
  filters: ReadonlyArray<Filter>;
  onChange: (value: Filter[]) => void;
}

/** One filter: the field, the operator that toggles, the values that reopen their list, ×. */
function FilterChip({ field, filter, filters, onChange }: FilterChipProps) {
  const byValue = new Map(field.options.map((o) => [o.value, o] as const));
  const chosen = filter.values.map((v) => byValue.get(v) ?? { value: v, label: v });
  const op = operatorText(filter.operator, chosen.length);
  const names = chosen.map((o) => o.label).join(", ");
  const summary = chosen.length > 2 ? `${chosen.length} values` : names;
  const other = filter.operator === "is" ? "is not" : "is";
  return (
    <span className="fg-filter" role="group" aria-label={`${field.label} ${op} ${names}`}>
      <Icon icon={field.icon} size={12} variant="mono" />
      <span className="fg-filter-field">{field.label}</span>
      <button
        type="button"
        className="fg-filter-op"
        aria-label={`${op}, switch to ${other}`}
        onClick={() => onChange(toggleFilterOperator(filters, field.id))}
      >
        {op}
      </button>
      <Popover.Root>
        <Popover.Trigger className="fg-filter-values" aria-label={`${field.label}: ${names}`}>
          {chosen.slice(0, 3).map((o) =>
            "glyph" in o && o.glyph ? (
              <span key={o.value} className="fg-filter-mark">
                {o.glyph}
              </span>
            ) : null,
          )}
          <span className="fg-filter-names">{summary}</span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner className="fg-pop-positioner" sideOffset={4} align="start">
            <Popover.Popup className="fg-pop fg-fpop" aria-label={field.label}>
              <ValueList
                field={field}
                values={filter.values}
                onChange={(next) => onChange(setFilterValues(filters, field.id, next))}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <button
        type="button"
        className="fg-filter-x"
        aria-label={`Remove the ${field.label.toLowerCase()} filter`}
        onClick={() => onChange(filters.filter((f) => f.field !== field.id))}
      >
        <Icon icon={Cancel01Icon} size={12} variant="mono" />
      </button>
    </span>
  );
}

/* ---------------------------------------------------------------- FilterBar */

export interface FilterBarProps {
  fields: ReadonlyArray<FilterField>;
  /** The filters set, one per field, in the order they were added. */
  value: ReadonlyArray<Filter>;
  onChange: (value: Filter[]) => void;
  /** Controls at the end of the bar, after Clear: "Save as view". */
  actions?: ReactNode;
  className?: string;
}

/**
 * The filters set, as chips on a hatched band under the view header, a "+" to add one and Clear
 * to remove them all. Renders nothing when no filter is set.
 */
export function FilterBar({ fields, value, onChange, actions, className }: FilterBarProps) {
  const set = value.filter((f) => f.values.length > 0);
  if (set.length === 0) return null;
  const byId = new Map(fields.map((f) => [f.id, f] as const));
  return (
    <div className={cx("fg-filters", className)} role="group" aria-label="Filters">
      {set.map((filter) => {
        const field = byId.get(filter.field);
        return field ? (
          <FilterChip
            key={filter.field}
            field={field}
            filter={filter}
            filters={value}
            onChange={onChange}
          />
        ) : null;
      })}
      <FilterMenu fields={fields} value={value} onChange={onChange} variant="icon" />
      <span className="fg-filters-gap" />
      <button
        type="button"
        className="fg-btn fg-btn-sm fg-btn-ghost fg-filters-clear"
        onClick={() => onChange([])}
      >
        Clear
      </button>
      {actions}
    </div>
  );
}
