import { Button, Dialog, Field, Input, Notice, Select } from "@forgeron/ui";
import { useState } from "react";
import { explain, type Api } from "../../api";
import { copyBranchData } from "./api";

// A branch starts empty (D-121). An admin may replace its data by another branch's, to try a version
// on data someone prepared. Never production's, either way; the tool's name is typed to confirm.

export function CopyDataButton({
  tool,
  api,
  branch,
  branches,
  onCopied,
}: {
  tool: string;
  api: Api;
  branch: string;
  /** The other branches with a preview. */
  branches: string[];
  onCopied: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(branches[0] ?? "");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string>();
  if (branches.length === 0) return null;

  const run = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const copied = await copyBranchData(api.sendJson, { tool, branch, from });
      const rows = copied.tables.reduce((n, t) => n + t.rows, 0);
      setDone(`${rows} ${rows === 1 ? "row" : "rows"} copied from ${from}.`);
      setOpen(false);
      onCopied();
    } catch (e) {
      setError(explain(e, "The data was not copied. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fc-db-copy">
      <Button size="sm" onClick={() => setOpen(true)}>
        Replace with another branch&apos;s data
      </Button>
      {done ? <Notice tone="success">{done}</Notice> : null}
      {open ? (
        <Dialog
          title={`Replace the data of ${branch}`}
          description="Its tables are emptied, then filled with the other branch's rows. Production is never read or changed."
          onClose={() => !busy && setOpen(false)}
          footer={
            <>
              <Button onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="danger" onClick={run} disabled={busy || typed !== tool || !from}>
                {busy ? "Copying…" : "Replace the data"}
              </Button>
            </>
          }
        >
          <Field label="From the branch">
            {(control) => (
              <Select
                {...control}
                value={from}
                options={branches.map((b) => ({ value: b, label: b }))}
                onChange={(e) => setFrom(e.target.value)}
              />
            )}
          </Field>
          <Field label={`Type ${tool} to confirm`}>
            {(control) => (
              <Input
                {...control}
                mono
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                data-autofocus
              />
            )}
          </Field>
          {error ? <Notice tone="danger">{error}</Notice> : null}
        </Dialog>
      ) : null}
    </div>
  );
}
