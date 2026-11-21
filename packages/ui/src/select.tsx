import type { ComponentProps, ReactNode, SelectHTMLAttributes } from "react";
import { cx } from "./cx";
import { Select as Base } from "@base-ui/react/select";
import { ArrowDown01Icon, Tick02Icon } from "@forgeron/icons";
import { asChildProps } from "./part";
import { Icon } from "./icon";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: ReadonlyArray<SelectOption>;
  /** Unselectable first entry shown while `value` is empty. */
  placeholder?: ReactNode;
}

/**
 * With `options`: a native select (keyboard and mobile behaviour for free), 32px, sharp corners.
 * Without: the root of shadcn's parts (`SelectTrigger`, `SelectValue`, `SelectContent`,
 * `SelectItem`…), D-156.
 */
export function Select(props: SelectProps | SelectRootProps) {
  return props.options !== undefined ? <NativeSelect {...props} /> : <SelectRoot {...props} />;
}

function NativeSelect({ options, placeholder, className, ...rest }: SelectProps) {
  const controlled = rest.value !== undefined;
  return (
    <select
      data-slot="native-select"
      {...rest}
      className={cx("fg-select", className)}
      {...(placeholder !== undefined && !controlled && rest.defaultValue === undefined
        ? { defaultValue: "" }
        : {})}
    >
      {placeholder !== undefined ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ---------------------------------------------------------------- shadcn parts (D-156) */

// shadcn's Select parts (D-156), on Base UI (D-147): `Select` takes them when given no `options`.

type Part<T> = Omit<T, "className"> & { className?: string };

/** `options` stays undefined: with options, `Select` is the native one. */
export type SelectRootProps = ComponentProps<typeof Base.Root> & { options?: undefined };

/** The root of the composed select: `value`, `defaultValue`, `onValueChange`, `items`, `name`. */
function SelectRoot({ options: _options, ...props }: SelectRootProps) {
  return <Base.Root {...props} />;
}

export type SelectTriggerProps = Part<ComponentProps<typeof Base.Trigger>> & {
  /** `default` 32px, `sm` 28px, as in shadcn. */
  size?: "default" | "sm";
  /** `chip`: a property of a record, 26px, no caret (SelectMenu's chip). Default: a field. */
  variant?: "field" | "chip";
  asChild?: boolean;
};

/** The control: the value and a caret. */
export function SelectTrigger({
  size = "default",
  variant = "field",
  asChild,
  className,
  children,
  ...rest
}: SelectTriggerProps) {
  const inner = asChildProps(asChild, children);
  return (
    <Base.Trigger
      data-slot="select-trigger"
      {...rest}
      className={cx(
        "fg-selm-trigger",
        variant === "chip" && "fg-selm-chip",
        variant === "field" && size === "sm" && "fg-selm-sm",
        className,
      )}
      {...("render" in inner ? inner : {})}
    >
      {"render" in inner ? undefined : (
        <>
          {inner.children}
          {variant === "field" ? (
            <Base.Icon className="fg-selm-caret">
              <Icon icon={ArrowDown01Icon} size={12} variant="mono" />
            </Base.Icon>
          ) : null}
        </>
      )}
    </Base.Trigger>
  );
}

/** The chosen value, or `placeholder`. */
export function SelectValue({ className, ...rest }: Part<ComponentProps<typeof Base.Value>>) {
  return (
    <Base.Value data-slot="select-value" {...rest} className={cx("fg-selm-value", className)} />
  );
}

export type SelectContentProps = Part<ComponentProps<typeof Base.Popup>> & {
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

/** The list that opens under the control, in a portal. */
export function SelectContent({
  side = "bottom",
  align = "start",
  sideOffset = 4,
  className,
  children,
  ...rest
}: SelectContentProps) {
  return (
    <Base.Portal>
      <Base.Positioner
        className="fg-pop-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignItemWithTrigger={false}
      >
        <Base.Popup
          data-slot="select-content"
          {...rest}
          className={cx("fg-pop fg-selm-popup", className)}
        >
          <Base.List className="fg-pop-list">{children}</Base.List>
        </Base.Popup>
      </Base.Positioner>
    </Base.Portal>
  );
}

export type SelectItemProps = Part<ComponentProps<typeof Base.Item>> & {
  /** Any mark before the text: a status glyph, an avatar, a swatch, a pixel icon. */
  glyph?: ReactNode;
  /** Mono text at the end of the row: a shortcut, a count. */
  hint?: ReactNode;
  /** A box before the text that ticks, for a `multiple` select; the tick at the end is dropped. */
  checkbox?: boolean;
};

/** One choice; its children are its text. A tick marks the chosen one. */
export function SelectItem({
  glyph,
  hint,
  checkbox,
  className,
  children,
  ...rest
}: SelectItemProps) {
  return (
    <Base.Item data-slot="select-item" {...rest} className={cx("fg-pop-row", className)}>
      {checkbox ? (
        <span className="fg-check-box" aria-hidden="true">
          <SelectItemIndicator className="" />
        </span>
      ) : null}
      {glyph ?? null}
      <Base.ItemText className="fg-pop-label">{children}</Base.ItemText>
      {hint !== undefined && hint !== null ? <span className="fg-pop-hint">{hint}</span> : null}
      {checkbox ? null : <SelectItemIndicator />}
    </Base.Item>
  );
}

/** The tick of the chosen row, inside `SelectItem` (it draws its own; use this to place it). */
export function SelectItemIndicator({
  className = "fg-pop-tick",
  children,
  ...rest
}: Part<ComponentProps<typeof Base.ItemIndicator>>) {
  return (
    <Base.ItemIndicator data-slot="select-item-indicator" {...rest} className={className}>
      {children ?? <Icon icon={Tick02Icon} size={12} variant="mono" />}
    </Base.ItemIndicator>
  );
}

/** The label of the whole select (for assistive technology); `className="fg-sr"` hides it. */
export function SelectFieldLabel({ className, ...rest }: Part<ComponentProps<typeof Base.Label>>) {
  return <Base.Label data-slot="select-field-label" {...rest} className={className} />;
}

export function SelectGroup({ className, ...rest }: Part<ComponentProps<typeof Base.Group>>) {
  return <Base.Group data-slot="select-group" {...rest} className={className} />;
}

/** The name of a group, inside `SelectGroup`. */
export function SelectLabel({ className, ...rest }: Part<ComponentProps<typeof Base.GroupLabel>>) {
  return (
    <Base.GroupLabel
      data-slot="select-label"
      {...rest}
      className={cx("fg-pop-heading", className)}
    />
  );
}

export function SelectSeparator({
  className,
  ...rest
}: Part<ComponentProps<typeof Base.Separator>>) {
  return (
    <Base.Separator
      data-slot="select-separator"
      {...rest}
      className={cx("fg-pop-sep", className)}
    />
  );
}
