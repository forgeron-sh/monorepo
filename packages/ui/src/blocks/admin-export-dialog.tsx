// Export data: a format, the columns to include, the range, and how much that comes to before
// anything starts. While the export runs, the dialog shows its progress; when it is done, the
// download. The app does the work and reports it through `state`; the dialog does no network.

import { Banner } from "../banner";
import { Button } from "../button";
import { RadioGroup } from "../controls";
import { Checkbox } from "../form";
import { Dialog } from "../dialog";
import { useControllableState } from "../hooks/use-controllable";
import { Progress } from "../marks";
import {
  DEFAULT_EXPORT_FORMATS,
  exportFilename,
  exportPercent,
  exportPreview,
  exportProblem,
  orderedColumns,
  toggleIn,
  adminPlural,
  type ExportColumn,
  type ExportFormat,
  type ExportRange,
  type ExportRequest,
  type ExportState,
} from "./admin-model";

export interface ExportDialogProps {
  title?: string;
  description?: string;
  formats?: ReadonlyArray<ExportFormat>;
  columns: ReadonlyArray<ExportColumn>;
  /** What to export: everything, the filtered list, the selection. Default: everything. */
  ranges?: ReadonlyArray<ExportRange>;
  /** What is asked for: format, column ids and range. Controlled, or left to the dialog. */
  value?: ExportRequest;
  defaultValue?: ExportRequest;
  onChange?: (request: ExportRequest) => void;
  /** Where the export stands. `idle` (default) shows the form. */
  state?: ExportState;
  /** The Export button: start it, then report through `state`. */
  onExport: (request: ExportRequest) => void;
  /** Stops a running export. Without it the running state has no Cancel. */
  onCancel?: () => void;
  onClose: () => void;
  /** What the file is called: `members` gives `members-2026-11-19.csv`. */
  name?: string;
  /** Today, `YYYY-MM-DD`, for the file name. */
  today?: string;
}

const ALL: ExportRange = { value: "all", label: "Everything" };

/** A dialog to export: format, columns, range, a preview count, then progress and the download. */
export function ExportDialog({
  title = "Export",
  description,
  formats = DEFAULT_EXPORT_FORMATS,
  columns,
  ranges = [ALL],
  value,
  defaultValue,
  onChange,
  state = { status: "idle" },
  onExport,
  onCancel,
  onClose,
  name = "export",
  today = "",
}: ExportDialogProps) {
  const [request, setRequest] = useControllableState<ExportRequest>({
    value,
    defaultValue: defaultValue ?? {
      format: formats[0]?.value ?? "csv",
      columns: columns.map((c) => c.id),
      range: ranges[0]?.value ?? "all",
    },
    onChange,
  });
  const range = ranges.find((r) => r.value === request.range);
  const problem = exportProblem(request, ranges);
  const filename = exportFilename(name, request.format, today || "today");
  const locked = state.status === "running" || state.status === "done";
  const percent = exportPercent(state);

  const start = () => {
    if (problem) return;
    onExport({ ...request, columns: orderedColumns(columns, request.columns) });
  };

  const footer =
    state.status === "running" ? (
      onCancel ? (
        <Button onClick={onCancel}>Cancel export</Button>
      ) : null
    ) : state.status === "done" ? (
      <>
        <Button onClick={onClose}>Close</Button>
        {state.href ? (
          <Button variant="primary" href={state.href} download={state.filename ?? filename}>
            Download
          </Button>
        ) : null}
      </>
    ) : (
      <>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={Boolean(problem)} onClick={start}>
          {state.status === "error" ? "Try again" : "Export"}
        </Button>
      </>
    );

  return (
    <Dialog
      title={title}
      {...(description ? { description } : {})}
      onClose={onClose}
      className="fg-adm-export"
      footer={footer}
    >
      {state.status === "error" ? (
        <Banner tone="danger" title="Export failed">
          {state.message}
        </Banner>
      ) : null}
      <fieldset className="fg-adm-export-set" disabled={locked}>
        <RadioGroup
          label="Format"
          direction="row"
          options={formats.map((f) => ({
            value: f.value,
            label: f.label,
            ...(f.description ? { hint: f.description } : {}),
          }))}
          value={request.format}
          onChange={(format) => setRequest({ ...request, format })}
        />
        {ranges.length > 1 ? (
          <RadioGroup
            label="Range"
            options={ranges.map((r) => ({
              value: r.value,
              label:
                r.count === undefined ? r.label : `${r.label} (${r.count.toLocaleString("en-US")})`,
            }))}
            value={request.range}
            onChange={(next) => setRequest({ ...request, range: next })}
          />
        ) : null}
        <fieldset className="fg-adm-export-cols">
          <legend>
            Columns{" "}
            <span className="fg-adm-mono-dim">
              {request.columns.length} of {columns.length}
            </span>
          </legend>
          <div className="fg-adm-export-bulk">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRequest({ ...request, columns: columns.map((c) => c.id) })}
            >
              Select all
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRequest({ ...request, columns: [] })}
            >
              Select none
            </Button>
          </div>
          <div className="fg-adm-export-list">
            {columns.map((c) => (
              <Checkbox
                key={c.id}
                label={
                  <>
                    {c.label}
                    {c.hint ? <span className="fg-adm-mono-dim"> {c.hint}</span> : null}
                  </>
                }
                checked={request.columns.includes(c.id)}
                onChange={(e) =>
                  setRequest({
                    ...request,
                    columns: toggleIn(request.columns, c.id, e.currentTarget.checked),
                  })
                }
              />
            ))}
          </div>
        </fieldset>
      </fieldset>
      {state.status === "idle" || state.status === "error" ? (
        <p className="fg-adm-export-preview" role="status">
          {problem ?? `${exportPreview(range?.count, request.columns.length)} · ${filename}`}
        </p>
      ) : null}
      {state.status === "running" ? (
        <div className="fg-adm-export-progress">
          <Progress
            label="Exporting"
            {...(percent === null ? {} : { value: percent })}
            showValue={percent !== null}
          />
          {state.rows !== undefined ? (
            <span className="fg-adm-mono-dim">{adminPlural(state.rows, "row")} so far</span>
          ) : null}
        </div>
      ) : null}
      {state.status === "done" ? (
        <Banner tone="success" title="Export ready">
          {[
            state.rows !== undefined ? adminPlural(state.rows, "row") : "",
            state.size ?? "",
            state.filename ?? filename,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Banner>
      ) : null}
    </Dialog>
  );
}
