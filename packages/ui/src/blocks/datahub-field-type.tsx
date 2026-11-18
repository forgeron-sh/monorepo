// The type of a field: its pixel glyph, and the picker that chooses one among the Data hub types
// (text, number, date, select, relation, file…), each with what SQLite stores it as.

import { cx } from "../cx";
import { Icon } from "../icon";
import { SelectMenu } from "../overlays";
import { FIELD_TYPES, fieldTypeInfo, type FieldType } from "./datahub-model";

export interface FieldTypeGlyphProps {
  type: FieldType;
  /** In px; 12 (default) in a row, 24 in a card. */
  size?: number;
  /** Says the type to assistive technology; decorative without it. */
  title?: string;
  className?: string;
}

/** The pixel glyph of a field type, in one tone. */
export function FieldTypeGlyph({ type, size = 12, title, className }: FieldTypeGlyphProps) {
  return (
    <Icon
      icon={fieldTypeInfo(type).icon}
      size={size}
      variant="mono"
      className={cx("fg-dh-glyph", className)}
      {...(title ? { title } : {})}
    />
  );
}

export interface FieldTypePickerProps {
  /** Names the control; "Type" by default. */
  label?: string;
  showLabel?: boolean;
  value?: FieldType;
  defaultValue?: FieldType;
  onChange?: (type: FieldType) => void;
  /** The types offered, in order; all by default. */
  types?: ReadonlyArray<FieldType>;
  /** Writes the storage (`TEXT`, `REAL`…) at the end of each row. */
  showStorage?: boolean;
  /** `field` (default) in a form; `chip` in a row. */
  variant?: "field" | "chip";
  size?: "sm" | "md";
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/** One field type among the Data hub's, each with its pixel glyph; typeahead and arrows. */
export function FieldTypePicker({
  label = "Type",
  showLabel,
  value,
  defaultValue,
  onChange,
  types,
  showStorage = true,
  variant = "field",
  size = "md",
  disabled,
  open,
  onOpenChange,
  className,
}: FieldTypePickerProps) {
  const offered = types ? FIELD_TYPES.filter((t) => types.includes(t.type)) : FIELD_TYPES;
  return (
    <SelectMenu
      label={label}
      {...(showLabel ? { showLabel } : {})}
      options={offered.map((t) => ({
        value: t.type,
        label: t.label,
        icon: t.icon,
        ...(showStorage ? { hint: t.storage } : {}),
      }))}
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      onChange={(next) => {
        if (next) onChange?.(next as FieldType);
      }}
      placeholder="Pick a type"
      variant={variant}
      size={size}
      {...(disabled ? { disabled } : {})}
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
      className={cx("fg-dh-typepick", className)}
    />
  );
}
