// The filters of a list view: a "Filter" button that adds one (a field, then its values), and the
// bar of chips that says them: "Status is any of Todo, In Progress ×". After the Tasks prototype.
//
// Roots with parts. `FilterMenu` (`FilterMenuTrigger`, `FilterMenuContent`), `FilterChip`
// (`FilterChipField`, `FilterChipOperator`, `FilterChipValues`, `FilterChipRemove`) and
// `FilterBar` (`FilterBarChips`, `FilterBarAdd`, `FilterBarGap`, `FilterBarClear`). Without
// children each draws the usual form.

import { Cancel01Icon, FilterIcon, PlusSignIcon } from "@forgeron/icons";
import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { cx } from "../cx";
import { useDisclosure } from "../hooks/use-disclosure";
import { Icon } from "../icon";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { renderPart, type Part } from "../part";
import {
  operatorText,
  setFilterValues,
  toggleFilterOperator,
  type Filter,
  type FilterField,
} from "./filtering-model";
import { FieldList, ValueList } from "./filtering-picker";

/* ---------------------------------------------------------------- FilterMenu */

interface MenuContext {
  fields: ReadonlyArray<FilterField>;
  value: ReadonlyArray<Filter>;
  onChange: (value: Filter[]) => void;
  step: string | null;
  setStep: (field: string | null) => void;
}

const MenuCtx = createContext<MenuContext | null>(null);

/** The state of the enclosing `FilterMenu`: the fields, the filters, the field being chosen. */
export function useFilterMenu(part = "useFilterMenu"): MenuContext {
  const ctx = useContext(MenuCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <FilterMenu>.`);
  return ctx;
}

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
  /** The parts of the menu; without them, the trigger and the lists. */
  children?: ReactNode;
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
  children,
  className,
}: FilterMenuProps) {
  const { open, setOpen } = useDisclosure({ open: openProp, onOpenChange });
  const [step, setStep] = useState<string | null>(null);
  return (
    <MenuCtx.Provider value={{ fields, value, onChange, step, setStep }}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setStep(null);
        }}
      >
        {children ?? (
          <>
            <FilterMenuTrigger variant={variant} {...(className ? { className } : {})}>
              {label}
            </FilterMenuTrigger>
            <FilterMenuContent />
          </>
        )}
      </Popover>
    </MenuCtx.Provider>
  );
}

export interface FilterMenuTriggerProps extends Part<ComponentProps<typeof PopoverTrigger>> {
  /** `button` (default): its icon and the children as words. `icon`: a square "+". */
  variant?: "button" | "icon";
}

/** The button that opens the menu; its children are the words ("Filter"). */
export function FilterMenuTrigger({
  variant = "button",
  className,
  children = "Filter",
  ...rest
}: FilterMenuTriggerProps) {
  return (
    <PopoverTrigger
      data-slot="filter-menu-trigger"
      aria-label={variant === "icon" ? "Add filter" : undefined}
      {...rest}
      className={cx(
        variant === "icon" ? "fg-iconbtn fg-iconbtn-sm" : "fg-btn fg-btn-sm fg-btn-ghost",
        "fg-filters-trigger",
        className,
      )}
    >
      <Icon icon={variant === "icon" ? PlusSignIcon : FilterIcon} size={12} variant="mono" />
      {variant === "icon" ? null : <span className="fg-filters-trigger-text">{children}</span>}
    </PopoverTrigger>
  );
}

/** The popup: the fields, then the values of the one chosen. Children replace both lists. */
export function FilterMenuContent({
  className,
  children,
  ...rest
}: Part<ComponentProps<typeof PopoverContent>>) {
  const { fields, value, onChange, step, setStep } = useFilterMenu("FilterMenuContent");
  const field = step ? fields.find((f) => f.id === step) : undefined;
  return (
    <PopoverContent
      data-slot="filter-menu-content"
      align="start"
      sideOffset={4}
      aria-label={field ? field.label : "Filter by"}
      {...rest}
      className={cx("fg-fpop", className)}
    >
      {children ??
        (field ? (
          <ValueList
            key={field.id}
            field={field}
            values={value.find((f) => f.field === field.id)?.values ?? []}
            onChange={(next) => onChange(setFilterValues(value, field.id, next))}
            onBack={() => setStep(null)}
          />
        ) : (
          <FieldList fields={fields} filters={value} onPick={setStep} />
        ))}
    </PopoverContent>
  );
}

/* ---------------------------------------------------------------- FilterChip */

interface ChipContext {
  field: FilterField;
  filter: Filter;
  filters: ReadonlyArray<Filter>;
  onChange: (value: Filter[]) => void;
  /** What the chip says: "is any of", the names of the values, how many. */
  op: string;
  names: string;
}

const ChipCtx = createContext<ChipContext | null>(null);

function useChip(part: string): ChipContext {
  const ctx = useContext(ChipCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <FilterChip>.`);
  return ctx;
}

export interface FilterChipProps extends Part<Omit<ComponentProps<"span">, "onChange">> {
  field: FilterField;
  filter: Filter;
  filters: ReadonlyArray<Filter>;
  onChange: (value: Filter[]) => void;
  asChild?: boolean;
}

/** One filter: the field, the operator that toggles, the values that reopen their list, ×. */
export function FilterChip({
  field,
  filter,
  filters,
  onChange,
  asChild,
  className,
  children,
  ...rest
}: FilterChipProps) {
  const byValue = new Map(field.options.map((o) => [o.value, o] as const));
  const chosen = filter.values.map((v) => byValue.get(v) ?? { value: v, label: v });
  const op = operatorText(filter.operator, chosen.length);
  const names = chosen.map((o) => o.label).join(", ");
  return (
    <ChipCtx.Provider value={{ field, filter, filters, onChange, op, names }}>
      {renderPart("span", cx("fg-filter", className), asChild, {
        "data-slot": "filter-chip",
        role: "group",
        "aria-label": `${field.label} ${op} ${names}`,
        ...rest,
        children: children ?? (
          <>
            <FilterChipField />
            <FilterChipOperator />
            <FilterChipValues />
            <FilterChipRemove />
          </>
        ),
      })}
    </ChipCtx.Provider>
  );
}

/** The icon and the name of the field. */
export function FilterChipField({ className, ...rest }: Part<ComponentProps<"span">>) {
  const { field } = useChip("FilterChipField");
  return (
    <>
      <Icon icon={field.icon} size={12} variant="mono" />
      <span data-slot="filter-chip-field" {...rest} className={cx("fg-filter-field", className)}>
        {field.label}
      </span>
    </>
  );
}

/** The operator, as a button that switches "is" and "is not". */
export function FilterChipOperator({ className, ...rest }: Part<ComponentProps<"button">>) {
  const { field, filter, filters, onChange, op } = useChip("FilterChipOperator");
  const other = filter.operator === "is" ? "is not" : "is";
  return (
    <button
      type="button"
      data-slot="filter-chip-operator"
      aria-label={`${op}, switch to ${other}`}
      onClick={() => onChange(toggleFilterOperator(filters, field.id))}
      {...rest}
      className={cx("fg-filter-op", className)}
    >
      {op}
    </button>
  );
}

/** The values, as a button that reopens their list in a popover. */
export function FilterChipValues({ className, ...rest }: Part<ComponentProps<"button">>) {
  const { field, filter, filters, onChange, names } = useChip("FilterChipValues");
  const byValue = new Map(field.options.map((o) => [o.value, o] as const));
  const chosen = filter.values.map((v) => byValue.get(v) ?? { value: v, label: v });
  const summary = chosen.length > 2 ? `${chosen.length} values` : names;
  return (
    <Popover>
      <PopoverTrigger
        data-slot="filter-chip-values"
        aria-label={`${field.label}: ${names}`}
        {...rest}
        className={cx("fg-filter-values", className)}
      >
        {chosen.slice(0, 3).map((o) =>
          "glyph" in o && o.glyph ? (
            <span key={o.value} className="fg-filter-mark">
              {o.glyph}
            </span>
          ) : null,
        )}
        <span className="fg-filter-names">{summary}</span>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="fg-fpop" aria-label={field.label}>
        <ValueList
          field={field}
          values={filter.values}
          onChange={(next) => onChange(setFilterValues(filters, field.id, next))}
        />
      </PopoverContent>
    </Popover>
  );
}

/** The × that removes the filter. */
export function FilterChipRemove({ className, ...rest }: Part<ComponentProps<"button">>) {
  const { field, filters, onChange } = useChip("FilterChipRemove");
  return (
    <button
      type="button"
      data-slot="filter-chip-remove"
      aria-label={`Remove the ${field.label.toLowerCase()} filter`}
      onClick={() => onChange(filters.filter((f) => f.field !== field.id))}
      {...rest}
      className={cx("fg-filter-x", className)}
    >
      <Icon icon={Cancel01Icon} size={12} variant="mono" />
    </button>
  );
}

/* ---------------------------------------------------------------- FilterBar */

interface BarContext {
  fields: ReadonlyArray<FilterField>;
  value: ReadonlyArray<Filter>;
  onChange: (value: Filter[]) => void;
}

const BarCtx = createContext<BarContext | null>(null);

function useBar(part: string): BarContext {
  const ctx = useContext(BarCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <FilterBar>.`);
  return ctx;
}

export interface FilterBarProps extends Part<Omit<ComponentProps<"div">, "onChange">> {
  fields: ReadonlyArray<FilterField>;
  /** The filters set, one per field, in the order they were added. */
  value: ReadonlyArray<Filter>;
  onChange: (value: Filter[]) => void;
  /** Controls at the end of the bar, after Clear: "Save as view". Ignored with children. */
  actions?: ReactNode;
  asChild?: boolean;
}

/**
 * The filters set, as chips on a hatched band under the view header, a "+" to add one and Clear
 * to remove them all. Renders nothing when no filter is set. With children, the parts place the
 * chips, the "+", the gap and Clear as you like.
 */
export function FilterBar({
  fields,
  value,
  onChange,
  actions,
  asChild,
  className,
  children,
  ...rest
}: FilterBarProps) {
  const set = value.filter((f) => f.values.length > 0);
  if (set.length === 0) return null;
  return (
    <BarCtx.Provider value={{ fields, value, onChange }}>
      {renderPart("div", cx("fg-filters", className), asChild, {
        "data-slot": "filter-bar",
        role: "group",
        "aria-label": "Filters",
        ...rest,
        children: children ?? (
          <>
            <FilterBarChips />
            <FilterBarAdd />
            <FilterBarGap />
            <FilterBarClear />
            {actions}
          </>
        ),
      })}
    </BarCtx.Provider>
  );
}

/** One chip for each filter set. */
export function FilterBarChips() {
  const { fields, value, onChange } = useBar("FilterBarChips");
  const byId = new Map(fields.map((f) => [f.id, f] as const));
  return (
    <>
      {value
        .filter((f) => f.values.length > 0)
        .map((filter) => {
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
    </>
  );
}

/** The "+" that adds a filter. */
export function FilterBarAdd(props: Part<Omit<FilterMenuProps, "fields" | "value" | "onChange">>) {
  const { fields, value, onChange } = useBar("FilterBarAdd");
  return <FilterMenu fields={fields} value={value} onChange={onChange} variant="icon" {...props} />;
}

/** Pushes what follows to the end of the bar. */
export function FilterBarGap({ className, ...rest }: Part<ComponentProps<"span">>) {
  return <span data-slot="filter-bar-gap" {...rest} className={cx("fg-filters-gap", className)} />;
}

/** Removes every filter. */
export function FilterBarClear({
  className,
  children = "Clear",
  ...rest
}: Part<ComponentProps<"button">>) {
  const { onChange } = useBar("FilterBarClear");
  return (
    <button
      type="button"
      data-slot="filter-bar-clear"
      onClick={() => onChange([])}
      {...rest}
      className={cx("fg-btn fg-btn-sm fg-btn-ghost fg-filters-clear", className)}
    >
      {children}
    </button>
  );
}
