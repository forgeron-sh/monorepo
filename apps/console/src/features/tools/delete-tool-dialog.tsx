import { Button, Dialog, Field, Input, Notice } from "@forgeron/ui";
import { useState } from "react";
import { explain, type Api } from "../../api";
import { deleteTool } from "./api";

// Deleting a tool for good: every channel's Worker and database goes, production included, then the
// tool and what is attached to it (access, secrets, versions). The tool's name is typed to confirm.

export function DeleteToolDialog({
  api,
  tool,
  onClose,
  onDeleted,
}: {
  api: Api;
  tool: string;
  onClose: () => void;
  /** The tool is gone: the page goes back to the list. */
  onDeleted: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await deleteTool(api, tool);
      onDeleted();
    } catch (e) {
      setError(explain(e, "The tool was not deleted. Try again."));
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={`Delete ${tool}?`}
      description="This cannot be undone."
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit} disabled={busy || typed !== tool}>
            {busy ? "Deleting…" : "Delete tool"}
          </Button>
        </>
      }
    >
      <Notice tone="danger" title="Everything of this tool goes">
        Production and every other channel stop answering, and their databases and files are
        deleted. The tool&apos;s versions, access, secrets and what people added to their library go
        with it. The repository on GitHub is not touched. The audit log keeps this deletion.
      </Notice>
      <Field label={`Type ${tool} to confirm`}>
        {(control) => (
          <Input
            {...control}
            mono
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            data-autofocus
          />
        )}
      </Field>
      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
}
