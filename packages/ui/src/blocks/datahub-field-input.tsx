// The control for one value of a field, by its type: a text input, a number, a switch, a date,
// a select, a relation picker, a list of files. Shared by RecordForm and the default value of
// FieldEditor, so a field is typed the same way everywhere.

import { Attachment01Icon, Cancel01Icon } from "@forgeron/icons";
import type { ChangeEvent } from "react";
import { useRef } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Checkbox, Input, Textarea } from "../form";
import { Icon } from "../icon";
import { DatePicker, SelectMenu } from "../overlays";
import { LabelPicker } from "../pickers";
import { RelationPicker } from "./datahub-relation-picker";
import { listOf, type CellValue, type DataField, type RelationSources } from "./datahub-model";

export interface FieldInputProps {
  field: DataField;
  value: CellValue;
  onChange: (value: CellValue) => void;
  /** The records relation fields can link, by table name. */
  relations?: RelationSources;
  /** Tied to a `<label htmlFor>`; text inputs only, pickers carry their own label. */
  id?: string;
  /** Names the pickers; the field name by default. */
  label?: string;
  invalid?: boolean;
  /** The id of the hint or error under the control. */
  describedBy?: string;
  disabled?: boolean;
  className?: string;
}

const NONE = "__none__";

/** The control of a value of the field, by its type. */
export function FieldInput({
  field,
  value,
  onChange,
  relations,
  id,
  label = field.name,
  invalid,
  describedBy,
  disabled,
  className,
}: FieldInputProps) {
  const files = useRef<HTMLInputElement>(null);
  const aria = {
    ...(id ? { id } : {}),
    ...(invalid ? { "aria-invalid": true as const } : {}),
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
    ...(disabled ? { disabled } : {}),
  };
  const text = value === null || Array.isArray(value) ? "" : String(value);
  const onText = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange(event.target.value === "" ? null : event.target.value);
  switch (field.type) {
    case "longText":
    case "json":
      return (
        <Textarea
          {...aria}
          mono={field.type === "json"}
          rows={field.type === "json" ? 5 : 3}
          value={text}
          onChange={onText}
          className={className}
        />
      );
    case "number":
      return (
        <Input
          {...aria}
          mono
          inputMode="decimal"
          value={text}
          onChange={(event) => {
            const raw = event.target.value;
            const n = Number(raw);
            // A number while it reads as one; the text as typed in between ("1.", "-").
            onChange(
              raw === ""
                ? null
                : raw.trim() !== "" && Number.isFinite(n) && !/[.,]$/.test(raw)
                  ? n
                  : raw,
            );
          }}
          className={cx("fg-dh-num", className)}
        />
      );
    case "boolean":
      return (
        <Checkbox
          {...aria}
          label={value === true ? "Yes" : "No"}
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
          className={className}
        />
      );
    case "date":
      return (
        <DatePicker
          label={label}
          variant="field"
          presets={[]}
          clearable={!field.required}
          placeholder="YYYY-MM-DD"
          value={typeof value === "string" && value ? value.slice(0, 10) : null}
          onChange={(next) => onChange(next)}
          className={cx("fg-dh-date", className)}
        />
      );
    case "datetime":
      return (
        <Input
          {...aria}
          mono
          type="datetime-local"
          value={text.replace(" ", "T").slice(0, 16)}
          onChange={(event) =>
            onChange(event.target.value ? event.target.value.replace("T", " ") : null)
          }
          className={className}
        />
      );
    case "select":
      return (
        <SelectMenu
          label={label}
          options={[
            ...(field.required ? [] : [{ value: NONE, label: "None" }]),
            ...(field.choices ?? []).map((c) => ({
              value: c.value,
              label: c.label,
              ...(c.color
                ? { glyph: <span className="fg-swatch-mark" style={{ background: c.color }} /> }
                : {}),
            })),
          ]}
          value={text || (field.required ? null : NONE)}
          onChange={(next) => onChange(!next || next === NONE ? null : next)}
          {...(disabled ? { disabled } : {})}
          {...(className ? { className } : {})}
        />
      );
    case "multiSelect":
      return (
        <LabelPicker
          variant="field"
          labels={(field.choices ?? []).map((c) => ({
            value: c.value,
            label: c.label,
            color: c.color ?? "var(--ink-dim)",
          }))}
          value={listOf(value)}
          onChange={(next) => onChange(next.length ? next : null)}
          {...(className ? { className } : {})}
        />
      );
    case "relation":
      return (
        <RelationPicker
          label={label}
          targets={relations?.[field.relation?.table ?? ""] ?? []}
          multiple={field.relation?.multiple ?? false}
          value={listOf(value)}
          onChange={(next) => onChange(next.length ? next : null)}
          {...(disabled ? { disabled } : {})}
          {...(className ? { className } : {})}
        />
      );
    case "file": {
      const names = listOf(value);
      return (
        <div className={cx("fg-dh-files", className)}>
          {names.map((name) => (
            <span key={name} className="fg-dh-file">
              <Icon icon={Attachment01Icon} size={12} variant="mono" />
              <span className="fg-dh-file-name">{name}</span>
              <button
                type="button"
                className="fg-dh-file-x"
                aria-label={`Remove ${name}`}
                disabled={disabled}
                onClick={() => {
                  const rest = names.filter((n) => n !== name);
                  onChange(rest.length ? rest : null);
                }}
              >
                <Icon icon={Cancel01Icon} size={12} variant="mono" />
              </button>
            </span>
          ))}
          <input
            ref={files}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              const picked = [...(event.target.files ?? [])].map((f) => f.name);
              const next = [...names, ...picked.filter((n) => !names.includes(n))];
              onChange(next.length ? next : null);
              event.target.value = "";
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            {...(id ? { id } : {})}
            onClick={() => files.current?.click()}
          >
            Add a file
          </Button>
        </div>
      );
    }
    default:
      return (
        <Input
          {...aria}
          mono={field.type === "email" || field.type === "url"}
          type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          value={text}
          onChange={onText}
          className={className}
        />
      );
  }
}
