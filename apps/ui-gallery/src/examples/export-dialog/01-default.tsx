import { Button, ExportDialog, type ExportState } from "@forgeron/ui";
import { useEffect, useRef, useState } from "react";

const columns = [
  { id: "name", label: "Name" },
  { id: "email", label: "Email", hint: "personal" },
  { id: "team", label: "Team" },
  { id: "joined", label: "Joined" },
  { id: "last", label: "Last seen" },
  { id: "status", label: "Status" },
];

const ranges = [
  { value: "all", label: "Everyone", count: 1284 },
  { value: "filtered", label: "Current filter", count: 37 },
  { value: "selected", label: "Selection", count: 3 },
];

export default function Default() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ExportState>({ status: "idle" });
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => () => clearInterval(timer.current), []);

  const start = () => {
    let progress = 0;
    setState({ status: "running", progress });
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      progress += 0.12;
      if (progress >= 1) {
        clearInterval(timer.current);
        setState({
          status: "done",
          href: "#",
          filename: "members-2026-11-19.csv",
          rows: 1284,
          size: "212 KB",
        });
      } else setState({ status: "running", progress, rows: Math.round(progress * 1284) });
    }, 350);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Export</Button>
      {open ? (
        <ExportDialog
          title="Export members"
          columns={columns}
          ranges={ranges}
          name="Members"
          today="2026-11-19"
          state={state}
          onExport={start}
          onCancel={() => {
            clearInterval(timer.current);
            setState({ status: "idle" });
          }}
          onClose={() => {
            clearInterval(timer.current);
            setOpen(false);
            setState({ status: "idle" });
          }}
        />
      ) : null}
    </>
  );
}
