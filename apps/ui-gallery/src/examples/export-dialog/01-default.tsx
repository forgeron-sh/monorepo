import {
  Button,
  ExportDialog,
  ExportDialogColumns,
  ExportDialogDone,
  ExportDialogError,
  ExportDialogFooter,
  ExportDialogFormats,
  ExportDialogHeader,
  ExportDialogOptions,
  ExportDialogPreview,
  ExportDialogProgress,
  type ExportState,
} from "@forgeron/ui";
import { useState } from "react";

const columns = [
  { id: "name", label: "Name" },
  { id: "email", label: "Email", hint: "personal" },
  { id: "team", label: "Team" },
];

export default function Composed() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ExportState>({ status: "idle" });
  return (
    <>
      <Button onClick={() => setOpen(true)}>Export</Button>
      {open ? (
        <ExportDialog
          title="Export members"
          columns={columns}
          name="Members"
          today="2026-11-19"
          state={state}
          onExport={() => setState({ status: "done", href: "#", rows: 1284, size: "212 KB" })}
          onClose={() => {
            setOpen(false);
            setState({ status: "idle" });
          }}
        >
          <ExportDialogHeader />
          <ExportDialogError />
          <ExportDialogOptions>
            <ExportDialogFormats />
            <ExportDialogColumns />
          </ExportDialogOptions>
          <ExportDialogPreview />
          <ExportDialogProgress />
          <ExportDialogDone />
          <ExportDialogFooter />
        </ExportDialog>
      ) : null}
    </>
  );
}
