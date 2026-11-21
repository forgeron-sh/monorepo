// Export data: a format, the columns to include, the range, and how much that comes to before
// anything starts. While the export runs, the dialog shows its progress; when it is done, the
// download. The app does the work and reports it through `state`; the dialog does no network.
//
// A root with parts. Without children it is the usual dialog; with children they are the content
// of a shadcn dialog, each part reading the state of the root:
//
//   <ExportDialog columns={columns} ranges={ranges} onExport={start} onClose={close} state={state}>
//     <ExportDialogHeader />
//     <ExportDialogError />
//     <ExportDialogOptions>
//       <ExportDialogFormats /><ExportDialogRanges /><ExportDialogColumns />
//     </ExportDialogOptions>
//     <ExportDialogPreview /><ExportDialogProgress /><ExportDialogDone />
//     <ExportDialogFooter />
//   </ExportDialog>

import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext } from "react";
import { Banner } from "../banner";
import { cx } from "../cx";
import { Button } from "../button";
import { RadioGroup } from "../controls";
import { Checkbox } from "../form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
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
  /** The parts of the dialog; without them, the usual form, progress and download. */
  children?: ReactNode;
  className?: string;
}

const ALL: ExportRange = { value: "all", label: "Everything" };

interface ExportContext {
  title: string;
  description: string | undefined;
  formats: ReadonlyArray<ExportFormat>;
  columns: ReadonlyArray<ExportColumn>;
  ranges: ReadonlyArray<ExportRange>;
  request: ExportRequest;
  setRequest: (request: ExportRequest) => void;
  state: ExportState;
  problem: string | null;
  filename: string;
  /** The form cannot be changed: the export runs or is done. */
  locked: boolean;
  percent: number | null;
  start: () => void;
  onCancel: (() => void) | undefined;
  onClose: () => void;
}

const Ctx = createContext<ExportContext | null>(null);

/** The state of the enclosing `ExportDialog`: the request, its problem, the state of the export. */
export function useExportDialog(part = "useExportDialog"): ExportContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside an <ExportDialog>.`);
  return ctx;
}

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
  children,
  className,
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
  const problem = exportProblem(request, ranges);
  const ctx: ExportContext = {
    title,
    description,
    formats,
    columns,
    ranges,
    request,
    setRequest,
    state,
    problem,
    filename: exportFilename(name, request.format, today || "today"),
    locked: state.status === "running" || state.status === "done",
    percent: exportPercent(state),
    start: () => {
      if (problem) return;
      onExport({ ...request, columns: orderedColumns(columns, request.columns) });
    },
    onCancel,
    onClose,
  };
  return (
    <Ctx.Provider value={ctx}>
      {children !== undefined ? (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
          <DialogContent className={cx("fg-adm-export", className)}>{children}</DialogContent>
        </Dialog>
      ) : (
        <Dialog
          title={title}
          {...(description ? { description } : {})}
          onClose={onClose}
          className={cx("fg-adm-export", className)}
          footer={<ExportDialogActions />}
        >
          <ExportDialogError />
          <ExportDialogOptions />
          <ExportDialogPreview />
          <ExportDialogProgress />
          <ExportDialogDone />
        </Dialog>
      )}
    </Ctx.Provider>
  );
}

/** The title and the description. */
export function ExportDialogHeader({ children, ...rest }: ComponentProps<"div">) {
  const { title, description } = useExportDialog("ExportDialogHeader");
  return (
    <DialogHeader data-slot="export-dialog-header" {...rest}>
      {children ?? (
        <>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </>
      )}
    </DialogHeader>
  );
}

/** Says so when the export failed. */
export function ExportDialogError() {
  const { state } = useExportDialog("ExportDialogError");
  if (state.status !== "error") return null;
  return (
    <Banner data-slot="export-dialog-error" tone="danger" title="Export failed">
      {state.message}
    </Banner>
  );
}

/** The choices, locked while the export runs: formats, range, columns by default. */
export function ExportDialogOptions({ className, children, ...rest }: ComponentProps<"fieldset">) {
  const { locked } = useExportDialog("ExportDialogOptions");
  return (
    <fieldset
      data-slot="export-dialog-options"
      {...rest}
      className={cx("fg-adm-export-set", className)}
      disabled={locked}
    >
      {children ?? (
        <>
          <ExportDialogFormats />
          <ExportDialogRanges />
          <ExportDialogColumns />
        </>
      )}
    </fieldset>
  );
}

/** The format, as a row of radios. */
export function ExportDialogFormats() {
  const { formats, request, setRequest } = useExportDialog("ExportDialogFormats");
  return (
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
  );
}

/** What to export; nothing is drawn with a single range. */
export function ExportDialogRanges() {
  const { ranges, request, setRequest } = useExportDialog("ExportDialogRanges");
  if (ranges.length < 2) return null;
  return (
    <RadioGroup
      label="Range"
      options={ranges.map((r) => ({
        value: r.value,
        label: r.count === undefined ? r.label : `${r.label} (${r.count.toLocaleString("en-US")})`,
      }))}
      value={request.range}
      onChange={(next) => setRequest({ ...request, range: next })}
    />
  );
}

/** The columns to include, with Select all and Select none. */
export function ExportDialogColumns({ className, ...rest }: ComponentProps<"fieldset">) {
  const { columns, request, setRequest } = useExportDialog("ExportDialogColumns");
  return (
    <fieldset
      data-slot="export-dialog-columns"
      {...rest}
      className={cx("fg-adm-export-cols", className)}
    >
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
        <Button size="sm" variant="ghost" onClick={() => setRequest({ ...request, columns: [] })}>
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
  );
}

/** How much the export comes to, or what is wrong with the request. */
export function ExportDialogPreview({ className, ...rest }: ComponentProps<"p">) {
  const { state, problem, ranges, request, filename } = useExportDialog("ExportDialogPreview");
  if (state.status !== "idle" && state.status !== "error") return null;
  const range = ranges.find((r) => r.value === request.range);
  return (
    <p
      data-slot="export-dialog-preview"
      role="status"
      {...rest}
      className={cx("fg-adm-export-preview", className)}
    >
      {problem ?? `${exportPreview(range?.count, request.columns.length)} · ${filename}`}
    </p>
  );
}

/** The progress bar and the rows so far, while the export runs. */
export function ExportDialogProgress({ className, ...rest }: ComponentProps<"div">) {
  const { state, percent } = useExportDialog("ExportDialogProgress");
  if (state.status !== "running") return null;
  return (
    <div
      data-slot="export-dialog-progress"
      {...rest}
      className={cx("fg-adm-export-progress", className)}
    >
      <Progress
        label="Exporting"
        {...(percent === null ? {} : { value: percent })}
        showValue={percent !== null}
      />
      {state.rows !== undefined ? (
        <span className="fg-adm-mono-dim">{adminPlural(state.rows, "row")} so far</span>
      ) : null}
    </div>
  );
}

/** Says so when the export is ready: rows, size, file name. */
export function ExportDialogDone() {
  const { state, filename } = useExportDialog("ExportDialogDone");
  if (state.status !== "done") return null;
  return (
    <Banner data-slot="export-dialog-done" tone="success" title="Export ready">
      {[
        state.rows !== undefined ? adminPlural(state.rows, "row") : "",
        state.size ?? "",
        state.filename ?? filename,
      ]
        .filter(Boolean)
        .join(" · ")}
    </Banner>
  );
}

/** The buttons of the state: Cancel and Export, Cancel export, or Close and Download. */
export function ExportDialogActions() {
  const { state, onCancel, onClose, problem, start, filename } =
    useExportDialog("ExportDialogActions");
  if (state.status === "running") {
    return onCancel ? <Button onClick={onCancel}>Cancel export</Button> : null;
  }
  if (state.status === "done") {
    return (
      <>
        <Button onClick={onClose}>Close</Button>
        {state.href ? (
          <Button variant="primary" href={state.href} download={state.filename ?? filename}>
            Download
          </Button>
        ) : null}
      </>
    );
  }
  return (
    <>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="primary" disabled={Boolean(problem)} onClick={start}>
        {state.status === "error" ? "Try again" : "Export"}
      </Button>
    </>
  );
}

/** The bottom row; its children replace the default buttons. */
export function ExportDialogFooter({ children, ...rest }: ComponentProps<"div">) {
  return (
    <DialogFooter data-slot="export-dialog-footer" {...rest}>
      {children ?? <ExportDialogActions />}
    </DialogFooter>
  );
}
