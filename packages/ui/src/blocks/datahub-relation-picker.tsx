// Links a record to records of another table: a search over the targets in a popup, one or
// several at once. The trigger shows the linked records as small chips.

import { Combobox } from "@base-ui/react/combobox";
import { Popover } from "@base-ui/react/popover";
import { ArrowDown01Icon, Link01Icon, Tick02Icon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { useDisclosure } from "../hooks/use-disclosure";
import { Icon } from "../icon";
import type { RelationTarget } from "./datahub-model";

export interface RelationPickerProps {
  /** Names the control and the search: "Company". */
  label: string;
  /** The records that can be linked. */
  targets: ReadonlyArray<RelationTarget>;
  /** The linked record ids. */
  value?: ReadonlyArray<string>;
  defaultValue?: ReadonlyArray<string>;
  onChange?: (ids: string[]) => void;
  /** Several records; one by default (choosing closes the list). */
  multiple?: boolean;
  placeholder?: string;
  /** `field` (default): a form control, 32px; `chip`: in a row, 26px. */
  variant?: "field" | "chip";
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Drawn in the trigger in place of the chips: a cell's own text, when the cell is the trigger. */
  children?: ReactNode;
  className?: string;
}

const matches = (t: RelationTarget, q: string) =>
  !q ||
  t.label.toLowerCase().includes(q) ||
  t.id.toLowerCase().includes(q) ||
  (t.hint ?? "").toLowerCase().includes(q);

/** The records of another table to link: search by name, id or hint; arrows, Enter, Escape. */
export function RelationPicker({
  label,
  targets,
  value,
  defaultValue = [],
  onChange,
  multiple = false,
  placeholder = "Link a record",
  variant = "field",
  disabled,
  open: openProp,
  onOpenChange,
  children,
  className,
}: RelationPickerProps) {
  const { open, setOpen } = useDisclosure({ open: openProp, onOpenChange });
  const [ids, setIds] = useControllableState<ReadonlyArray<string>>({
    value,
    defaultValue,
    onChange: onChange ? (next) => onChange([...next]) : undefined,
  });
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(targets.map((t) => [t.id, t] as const)), [targets]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return targets.filter((t) => matches(t, q)).map((t) => t.id);
  }, [targets, query]);
  const focus = useCallback((input: HTMLInputElement | null) => {
    input?.focus({ preventScroll: true });
  }, []);
  const chosen = ids.map((id) => byId.get(id) ?? { id, label: id });
  const name = chosen.length ? `${label}: ${chosen.map((c) => c.label).join(", ")}` : label;
  const list = (
    <>
      <div className="fg-fpop-head">
        <Combobox.Input
          ref={focus}
          className="fg-fpop-input"
          placeholder={`Search ${label.toLowerCase()}…`}
          aria-label={label}
        />
      </div>
      <Combobox.Empty className="fg-fpop-empty">No record</Combobox.Empty>
      <Combobox.List className="fg-pop-list">
        {(id: string) => {
          const target = byId.get(id);
          if (!target) return null;
          return (
            <Combobox.Item key={id} value={id} className="fg-pop-row">
              {multiple ? (
                <span className="fg-check-box" aria-hidden="true">
                  <Combobox.ItemIndicator>
                    <Icon icon={Tick02Icon} size={12} variant="mono" />
                  </Combobox.ItemIndicator>
                </span>
              ) : (
                <Icon icon={Link01Icon} size={12} variant="mono" />
              )}
              <span className="fg-pop-label">{target.label}</span>
              <span className="fg-pop-hint">{target.hint ?? target.id}</span>
              {multiple ? null : (
                <Combobox.ItemIndicator className="fg-pop-tick">
                  <Icon icon={Tick02Icon} size={12} variant="mono" />
                </Combobox.ItemIndicator>
              )}
            </Combobox.Item>
          );
        }}
      </Combobox.List>
    </>
  );
  const common = {
    inline: true,
    open: true,
    autoHighlight: true,
    items: targets.map((t) => t.id),
    filteredItems: shown,
    itemToStringLabel: (id: string) => byId.get(id)?.label ?? id,
    inputValue: query,
  } as const;
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <Popover.Trigger
        className={cx(
          "fg-selm-trigger fg-dh-relpick",
          variant === "chip" && "fg-selm-chip",
          chosen.length === 0 && "fg-selm-empty",
          className,
        )}
        aria-label={name}
        disabled={disabled}
      >
        {children ?? (
          <>
            {chosen.length === 0 ? (
              <span className="fg-dh-relpick-empty">
                <Icon icon={Link01Icon} size={12} variant="mono" />
                {placeholder}
              </span>
            ) : (
              <span className="fg-dh-relchips">
                {chosen.map((c) => (
                  <span key={c.id} className="fg-dh-relchip">
                    {c.label}
                  </span>
                ))}
              </span>
            )}
            {variant === "field" ? (
              <span className="fg-selm-caret" aria-hidden="true">
                <Icon icon={ArrowDown01Icon} size={12} variant="mono" />
              </span>
            ) : null}
          </>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="fg-pop-positioner" sideOffset={4} align="start">
          <Popover.Popup className="fg-pop fg-fpop fg-dh-relpop" aria-label={label}>
            {multiple ? (
              <Combobox.Root<string, true>
                {...common}
                multiple
                value={[...ids]}
                onValueChange={(next) => setIds(next)}
                onInputValueChange={(next, details) => {
                  if (!details.isItemPress) setQuery(next);
                }}
              >
                {list}
              </Combobox.Root>
            ) : (
              <Combobox.Root<string>
                {...common}
                value={ids[0] ?? null}
                onValueChange={(next) => {
                  setIds(next ? [next] : []);
                  setOpen(false);
                  setQuery("");
                }}
                onInputValueChange={(next, details) => {
                  if (!details.isItemPress) setQuery(next);
                }}
              >
                {list}
              </Combobox.Root>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
