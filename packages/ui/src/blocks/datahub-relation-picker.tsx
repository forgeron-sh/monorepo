// Links a record to records of another table: a search over the targets in a popup, one or
// several at once. The trigger shows the linked records as small chips.

import { ArrowDown01Icon, Link01Icon, Tick02Icon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Combobox,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
} from "../combobox";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { useDisclosure } from "../hooks/use-disclosure";
import { Icon } from "../icon";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
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
        <ComboboxChipsInput
          ref={focus}
          className="fg-fpop-input"
          placeholder={`Search ${label.toLowerCase()}…`}
          aria-label={label}
        />
      </div>
      <ComboboxEmpty className="fg-fpop-empty">No record</ComboboxEmpty>
      <ComboboxList>
        {(id: string) => {
          const target = byId.get(id);
          if (!target) return null;
          return (
            <ComboboxItem
              key={id}
              value={id}
              indicator={!multiple}
              glyph={
                multiple ? (
                  <span className="fg-check-box" aria-hidden="true">
                    <ComboboxItemIndicator>
                      <Icon icon={Tick02Icon} size={12} variant="mono" />
                    </ComboboxItemIndicator>
                  </span>
                ) : (
                  <Icon icon={Link01Icon} size={12} variant="mono" />
                )
              }
              hint={target.hint ?? target.id}
            >
              {target.label}
            </ComboboxItem>
          );
        }}
      </ComboboxList>
    </>
  );
  // The root's props are the same for one record or several; its types tell the two apart.
  const rootProps = {
    inline: true,
    open: true,
    autoHighlight: true,
    items: targets.map((t) => t.id),
    filteredItems: shown,
    itemToStringLabel: (id: string) => byId.get(id)?.label ?? id,
    inputValue: query,
    multiple,
    value: multiple ? [...ids] : (ids[0] ?? null),
    onValueChange: (next: string[] | string | null) => {
      if (multiple) {
        setIds(next as string[]);
      } else {
        setIds(next ? [next as string] : []);
        setOpen(false);
        setQuery("");
      }
    },
    onInputValueChange: (next: string, details: { isItemPress?: boolean }) => {
      if (!details.isItemPress) setQuery(next);
    },
  };
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger
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
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="fg-fpop fg-dh-relpop"
        aria-label={label}
      >
        <Combobox {...(rootProps as object)}>{list}</Combobox>
      </PopoverContent>
    </Popover>
  );
}
