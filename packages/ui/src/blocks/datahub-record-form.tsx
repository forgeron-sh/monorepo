// A record as a form generated from its fields: one row per field (its name and type on the left,
// the control of its type on the right), the problems under each, ⌘↵ to save. Put it in a Drawer
// to open a row, in a Modal to add one.

import { Key01Icon } from "@forgeron/icons";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useId, useState } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { FieldInput } from "./datahub-field-input";
import { FieldTypeGlyph } from "./datahub-field-type";
import {
  fieldTypeInfo,
  formatValue,
  initialValues,
  normalizeValues,
  validateRecord,
  type CellValue,
  type DataField,
  type RecordValues,
  type RelationSources,
} from "./datahub-model";

export interface RecordFormProps {
  fields: ReadonlyArray<DataField>;
  /** The values by field id. Controlled or not; a new record starts from the fields' defaults. */
  value?: RecordValues;
  defaultValue?: RecordValues;
  onChange?: (values: Record<string, CellValue>) => void;
  /** Called with the values once every field is valid; the problems show otherwise. */
  onSubmit?: (values: Record<string, CellValue>) => void;
  onCancel?: () => void;
  /** `edit`: the primary key is read only. `create` (default): every field is open. */
  mode?: "create" | "edit";
  relations?: RelationSources;
  /** Problems from the server, by field id ("UNIQUE constraint failed"), shown with the others. */
  errors?: Readonly<Record<string, string>>;
  submitLabel?: string;
  /** More at the left of the foot: an "Add another" box, a Delete button. */
  footer?: ReactNode;
  /** Names the form for assistive technology. */
  label?: string;
  className?: string;
}

const typeText = (field: DataField) =>
  field.type === "relation" && field.relation
    ? `→ ${field.relation.table}`
    : fieldTypeInfo(field.type).label.toLowerCase();

/** A record as a form: a row per field, typed controls, problems under them, ⌘↵ saves. */
export function RecordForm({
  fields,
  value,
  defaultValue,
  onChange,
  onSubmit,
  onCancel,
  mode = "create",
  relations,
  errors: serverErrors,
  submitLabel = mode === "create" ? "Add record" : "Save",
  footer,
  label = "Record",
  className,
}: RecordFormProps) {
  const id = useId();
  const [values, setValues] = useControllableState<RecordValues>({
    value,
    defaultValue: { ...initialValues(fields), ...defaultValue },
    onChange: onChange ? (next) => onChange({ ...next }) : undefined,
  });
  const [tried, setTried] = useState(false);
  const problems = { ...(tried ? validateRecord(fields, values) : {}), ...serverErrors };
  const submit = () => {
    setTried(true);
    if (Object.keys(validateRecord(fields, values)).length === 0)
      onSubmit?.(normalizeValues(fields, values));
  };
  const onFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
  };
  return (
    <form
      className={cx("fg-dh-form", className)}
      aria-label={label}
      noValidate
      onSubmit={onFormSubmit}
      onKeyDown={onKeyDown}
    >
      <div className="fg-dh-form-rows">
        {fields.map((field) => {
          const control = `${id}-${field.id}`;
          const problem = problems[field.id];
          const locked = field.readOnly || (field.primary && mode === "edit");
          const note = problem ? `${control}-error` : field.description ? `${control}-hint` : "";
          const current = values[field.id] ?? null;
          return (
            <div key={field.id} className={cx("fg-dh-form-row", problem && "fg-dh-invalid")}>
              <div className="fg-dh-form-key">
                <label htmlFor={control} className="fg-dh-form-name">
                  {field.name}
                  {field.required && !locked ? (
                    <span className="fg-dh-req" aria-label="required">
                      *
                    </span>
                  ) : null}
                </label>
                <span className="fg-dh-form-type">
                  {field.primary ? (
                    <Icon icon={Key01Icon} size={12} variant="mono" title="Primary key" />
                  ) : (
                    <FieldTypeGlyph type={field.type} />
                  )}
                  {typeText(field)}
                </span>
              </div>
              <div className="fg-dh-form-value">
                {locked ? (
                  <output id={control} className="fg-dh-form-locked">
                    {formatValue(field, current, relations) || "—"}
                  </output>
                ) : (
                  <FieldInput
                    field={field}
                    value={current}
                    onChange={(next) => setValues({ ...values, [field.id]: next })}
                    id={control}
                    {...(relations ? { relations } : {})}
                    {...(problem ? { invalid: true } : {})}
                    {...(note ? { describedBy: note } : {})}
                  />
                )}
                {problem ? (
                  <p id={`${control}-error`} className="fg-field-error">
                    {problem}
                  </p>
                ) : field.description ? (
                  <p id={`${control}-hint`} className="fg-field-hint">
                    {field.description}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {onSubmit || onCancel || footer ? (
        <div className="fg-dh-form-foot">
          {footer}
          <span className="fg-dh-spacer" />
          {onCancel ? (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          {onSubmit ? (
            <Button type="submit" variant="primary" kbd="⌘↵">
              {submitLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
