// Records brought in from a file: the columns of the file matched to the fields of the table
// (ColumnMapping), and the wizard around it (ImportWizard): a file or pasted rows, the columns,
// a check of every row, the result.

import { ArrowRight01Icon, FileSpreadsheetIcon, Upload01Icon } from "@forgeron/icons";
import type { DragEvent } from "react";
import { useId, useState } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { Checkbox, Textarea } from "../form";
import { Icon } from "../icon";
import { SelectMenu } from "../overlays";
import { Notice } from "../feedback";
import { useControllableState } from "../hooks/use-controllable";
import { FieldTypeGlyph } from "./datahub-field-type";
import {
  fieldTypeInfo,
  guessMapping,
  initialValues,
  parseCsv,
  parseValue,
  type CellValue,
  type DataField,
  type RelationSources,
} from "./datahub-model";

/* ---------------------------------------------------------------- ColumnMapping */

export interface SourceColumn {
  /** The heading in the file. */
  name: string;
  /** A few values of the column, to recognise it. */
  samples?: ReadonlyArray<string>;
}

/** Per source column, the id of the field it fills, or null to skip it. */
export type ColumnMap = ReadonlyArray<string | null>;

/** What stops a mapping: required fields left without a column, a field filled twice. */
export function mappingProblems(fields: ReadonlyArray<DataField>, mapping: ColumnMap): string[] {
  const problems: string[] = [];
  const count = new Map<string, number>();
  for (const id of mapping) if (id) count.set(id, (count.get(id) ?? 0) + 1);
  for (const field of fields) {
    if ((count.get(field.id) ?? 0) > 1) problems.push(`${field.name} is filled by two columns`);
    if (
      field.required &&
      !field.primary &&
      !field.readOnly &&
      field.defaultValue == null &&
      !count.has(field.id)
    )
      problems.push(`${field.name} is required: pick the column that fills it`);
  }
  return problems;
}

export interface ColumnMappingProps {
  columns: ReadonlyArray<SourceColumn>;
  fields: ReadonlyArray<DataField>;
  /** Controlled or not; guessed from the names by default. */
  value?: ColumnMap;
  defaultValue?: ColumnMap;
  onChange?: (mapping: (string | null)[]) => void;
  /** Lists the problems under the table; on by default. */
  showProblems?: boolean;
  className?: string;
}

const SKIP = "__skip__";

/** Each column of a file, a sample of it, and the field it fills, or Skip. */
export function ColumnMapping({
  columns,
  fields,
  value,
  defaultValue,
  onChange,
  showProblems = true,
  className,
}: ColumnMappingProps) {
  const [mapping, setMapping] = useControllableState<ColumnMap>({
    value,
    defaultValue:
      defaultValue ??
      guessMapping(
        columns.map((c) => c.name),
        fields,
      ),
    onChange: onChange ? (next) => onChange([...next]) : undefined,
  });
  const problems = mappingProblems(fields, mapping);
  const open = fields.filter((f) => !f.readOnly);
  return (
    <div className={cx("fg-dh-map", className)}>
      <table className="fg-dh-map-table">
        <thead>
          <tr>
            <th scope="col">Column in the file</th>
            <th scope="col" aria-hidden="true" />
            <th scope="col">Field</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((column, at) => {
            const target = mapping[at] ?? null;
            return (
              <tr key={`${column.name}-${at}`} className={cx(!target && "fg-dh-map-skip")}>
                <td>
                  <span className="fg-dh-map-src">{column.name || `Column ${at + 1}`}</span>
                  {column.samples?.length ? (
                    <span className="fg-dh-map-sample">
                      {column.samples.filter(Boolean).slice(0, 3).join(" · ")}
                    </span>
                  ) : null}
                </td>
                <td className="fg-dh-map-arrow" aria-hidden="true">
                  <Icon icon={ArrowRight01Icon} size={12} variant="mono" />
                </td>
                <td>
                  <SelectMenu
                    label={`Field for ${column.name || `column ${at + 1}`}`}
                    size="sm"
                    options={[
                      { value: SKIP, label: "Skip this column" },
                      ...open.map((f) => ({
                        value: f.id,
                        label: f.name,
                        glyph: <FieldTypeGlyph type={f.type} />,
                        hint: fieldTypeInfo(f.type).label.toLowerCase(),
                      })),
                    ]}
                    value={target ?? SKIP}
                    onChange={(next) =>
                      setMapping(
                        mapping.map((m, i) => (i === at ? (next === SKIP ? null : next) : m)),
                      )
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {showProblems && problems.length ? (
        <ul className="fg-dh-map-problems" aria-live="polite">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- ImportWizard */

/** What the import did; the wizard counts the records it sent when nothing is returned. */
export interface ImportResult {
  inserted: number;
  /** Rows the server refused. */
  failed?: number;
  /** One line from the server. */
  message?: string;
}

export interface ImportWizardProps {
  fields: ReadonlyArray<DataField>;
  /** The records relation columns may name, by table: labels become ids. */
  relations?: RelationSources;
  /** The table written to, in the titles. */
  tableName?: string;
  /** Writes the checked records; may be async. Values are keyed by field id. */
  onImport: (
    records: Record<string, CellValue>[],
  ) => ImportResult | void | Promise<ImportResult | void>;
  /** The Cancel of the first steps and the Done of the last. */
  onClose?: () => void;
  /** Rows shown in the check step. */
  previewRows?: number;
  /** Pasted text to start from: a sample, a clipboard. */
  defaultText?: string;
  className?: string;
}

type Step = "file" | "map" | "check" | "done";
const STEPS: ReadonlyArray<{ key: Step; label: string }> = [
  { key: "file", label: "File" },
  { key: "map", label: "Columns" },
  { key: "check", label: "Check" },
  { key: "done", label: "Import" },
];

interface Checked {
  values: Record<string, CellValue>;
  /** Problems by field id. */
  errors: Record<string, string>;
  /** The text of each cell, by field id, to show what was read. */
  raw: Record<string, string>;
}

/** Turns the rows of a file into records of the fields, with the problem of each cell. */
export function checkRows(
  rows: ReadonlyArray<ReadonlyArray<string>>,
  mapping: ColumnMap,
  fields: ReadonlyArray<DataField>,
  relations?: RelationSources,
): Checked[] {
  const byId = new Map(fields.map((f) => [f.id, f]));
  return rows.map((row) => {
    const values: Record<string, CellValue> = initialValues(fields);
    const errors: Record<string, string> = {};
    const raw: Record<string, string> = {};
    mapping.forEach((id, at) => {
      const field = id ? byId.get(id) : undefined;
      if (!field) return;
      const text = row[at] ?? "";
      raw[field.id] = text;
      const parsed = parseValue(field, text, relations);
      if ("error" in parsed) errors[field.id] = parsed.error;
      else values[field.id] = parsed.value ?? field.defaultValue ?? null;
    });
    for (const field of fields)
      if (
        field.required &&
        !field.primary &&
        !field.readOnly &&
        values[field.id] == null &&
        !errors[field.id]
      )
        errors[field.id] = "Required";
    return { values, errors, raw };
  });
}

/** A file or pasted rows → the columns matched to fields → every row checked → the import. */
export function ImportWizard({
  fields,
  relations,
  tableName,
  onImport,
  onClose,
  previewRows = 8,
  defaultText = "",
  className,
}: ImportWizardProps) {
  const id = useId();
  const [step, setStep] = useState<Step>("file");
  const [text, setText] = useState(defaultText);
  const [fileName, setFileName] = useState<string | null>(null);
  const [header, setHeader] = useState(true);
  const [mapping, setMapping] = useState<ColumnMap>([]);
  const [skipBad, setSkipBad] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);

  const all = text.trim() ? parseCsv(text) : [];
  const width = Math.max(0, ...all.map((r) => r.length));
  const headings = header
    ? Array.from({ length: width }, (_, i) => all[0]?.[i] ?? "")
    : Array.from({ length: width }, (_, i) => `Column ${i + 1}`);
  const rows = header ? all.slice(1) : all;
  const columns: SourceColumn[] = headings.map((name, i) => ({
    name,
    samples: rows.slice(0, 3).map((r) => r[i] ?? ""),
  }));
  const problems = mappingProblems(fields, mapping);
  const checked =
    step === "check" || step === "done" ? checkRows(rows, mapping, fields, relations) : [];
  const bad = checked.filter((c) => Object.keys(c.errors).length > 0).length;
  const ready = checked.length - bad;
  const shownFields = fields.filter((f) => mapping.includes(f.id));

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setText(await file.text());
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDropping(false);
    void readFile(event.dataTransfer.files[0]);
  };
  const toMapping = () => {
    setMapping(guessMapping(headings, fields));
    setStep("map");
  };
  const runImport = async () => {
    const records = checked.filter((c) => Object.keys(c.errors).length === 0).map((c) => c.values);
    setBusy(true);
    setFailure(null);
    try {
      const done = await onImport(records);
      setResult(done ?? { inserted: records.length });
      setStep("done");
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "The import failed");
    } finally {
      setBusy(false);
    }
  };
  const reset = () => {
    setStep("file");
    setText("");
    setFileName(null);
    setResult(null);
    setFailure(null);
  };

  const at = STEPS.findIndex((s) => s.key === step);
  return (
    <section className={cx("fg-dh-imp", className)} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="fg-sr">
        Import into {tableName ?? "the table"}
      </h2>
      <ol className="fg-dh-steps">
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            className={cx("fg-dh-step", i < at && "fg-dh-step-done", i === at && "fg-dh-step-now")}
            aria-current={i === at ? "step" : undefined}
          >
            <span className="fg-dh-step-n">{i + 1}</span>
            {s.label}
          </li>
        ))}
      </ol>

      {step === "file" ? (
        <div className="fg-dh-imp-body">
          <label
            className={cx("fg-dh-drop", dropping && "fg-dh-drop-over")}
            onDragOver={(event) => {
              event.preventDefault();
              if (!dropping) setDropping(true);
            }}
            onDragLeave={() => setDropping(false)}
            onDrop={onDrop}
          >
            <Icon icon={fileName ? FileSpreadsheetIcon : Upload01Icon} size={24} />
            <span className="fg-dh-drop-title">
              {fileName ?? "Drop a CSV file, or click to choose one"}
            </span>
            <span className="fg-dh-drop-hint">
              {fileName ? `${rows.length} rows read` : "Comma, semicolon or tab separated"}
            </span>
            <input
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain"
              className="fg-sr"
              onChange={(event) => void readFile(event.target.files?.[0])}
            />
          </label>
          <div className="fg-field">
            <label className="fg-field-label" htmlFor={`${id}-paste`}>
              Or paste rows
            </label>
            <Textarea
              id={`${id}-paste`}
              mono
              rows={5}
              spellCheck={false}
              placeholder={`${fields.map((f) => f.name).join(",")}\n…`}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setFileName(null);
              }}
            />
          </div>
          <Checkbox
            label="The first row holds the column names"
            checked={header}
            onChange={(event) => setHeader(event.target.checked)}
          />
        </div>
      ) : null}

      {step === "map" ? (
        <div className="fg-dh-imp-body">
          <ColumnMapping columns={columns} fields={fields} value={mapping} onChange={setMapping} />
        </div>
      ) : null}

      {step === "check" ? (
        <div className="fg-dh-imp-body">
          <p className="fg-dh-imp-sum">
            <b>{ready}</b> {ready === 1 ? "row is" : "rows are"} ready
            {bad ? (
              <>
                , <b className="fg-dh-bad">{bad}</b> {bad === 1 ? "has" : "have"} problems
              </>
            ) : null}
            .
          </p>
          <div className="fg-dh-imp-preview">
            <table className="fg-dh-map-table fg-dh-imp-table">
              <thead>
                <tr>
                  <th scope="col">Row</th>
                  {shownFields.map((f) => (
                    <th key={f.id} scope="col">
                      <span className="fg-dh-imp-th">
                        <FieldTypeGlyph type={f.type} />
                        {f.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {checked.slice(0, previewRows).map((c, r) => (
                  <tr key={r}>
                    <td className="fg-dh-mono">{r + (header ? 2 : 1)}</td>
                    {shownFields.map((f) => {
                      const problem = c.errors[f.id];
                      return (
                        <td key={f.id} className={cx(problem && "fg-dh-imp-bad")} title={problem}>
                          {c.raw[f.id] ?? ""}
                          {problem ? <span className="fg-dh-imp-why">{problem}</span> : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {checked.length > previewRows ? (
            <p className="fg-field-hint">
              The first {previewRows} of {checked.length} rows.
            </p>
          ) : null}
          {bad ? (
            <Checkbox
              label="Skip the rows with problems"
              checked={skipBad}
              onChange={(event) => setSkipBad(event.target.checked)}
            />
          ) : null}
          {failure ? (
            <Notice tone="danger" title="Not imported">
              {failure}
            </Notice>
          ) : null}
        </div>
      ) : null}

      {step === "done" && result ? (
        <div className="fg-dh-imp-body fg-dh-imp-done" role="status">
          <span className="fg-dh-imp-big">{result.inserted}</span>
          <span>
            {result.inserted === 1 ? "record" : "records"} added
            {tableName ? (
              <>
                {" "}
                to <code>{tableName}</code>
              </>
            ) : null}
            {result.failed ? `, ${result.failed} refused` : ""}
            {bad ? `, ${bad} rows skipped` : ""}.
          </span>
          {result.message ? <span className="fg-field-hint">{result.message}</span> : null}
        </div>
      ) : null}

      <div className="fg-dh-form-foot">
        {step === "map" || step === "check" ? (
          <Button variant="ghost" onClick={() => setStep(step === "map" ? "file" : "map")}>
            Back
          </Button>
        ) : null}
        <span className="fg-dh-spacer" />
        {step !== "done" && onClose ? (
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        ) : null}
        {step === "file" ? (
          <Button variant="primary" disabled={rows.length === 0} onClick={toMapping}>
            Next
          </Button>
        ) : null}
        {step === "map" ? (
          <Button variant="primary" disabled={problems.length > 0} onClick={() => setStep("check")}>
            Check {rows.length} {rows.length === 1 ? "row" : "rows"}
          </Button>
        ) : null}
        {step === "check" ? (
          <Button
            variant="primary"
            disabled={busy || ready === 0 || (bad > 0 && !skipBad)}
            onClick={() => void runImport()}
          >
            {busy ? "Importing…" : `Import ${ready} ${ready === 1 ? "record" : "records"}`}
          </Button>
        ) : null}
        {step === "done" ? (
          <>
            <Button variant="ghost" onClick={reset}>
              Import another file
            </Button>
            {onClose ? (
              <Button variant="primary" onClick={onClose}>
                Done
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
