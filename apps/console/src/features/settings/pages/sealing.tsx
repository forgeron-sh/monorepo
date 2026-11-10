import { addresses } from "@forgeron/platform-contract/client";
import { Button, Notice, Page } from "@forgeron/ui";
import { useState } from "react";
import { explain, ok, typedSender, type Api } from "../../../api";

// Sealing again (D-108): after `SECRETS_KEY` is replaced, what the platform keeps sealed (tool secrets,
// every version of people's secrets, connections, the sign-in provider and connectors' clients) is sealed
// again under the new key, for this workspace. The answer is counts; no value comes out.

interface Report {
  resealed: number;
  current: number;
  unreadable: number;
}

export default function SealingPage({ api }: { api: Api }) {
  const [state, setState] = useState<"idle" | "running">("idle");
  const [report, setReport] = useState<Report>();
  const [problem, setProblem] = useState<string>();

  const run = async () => {
    setState("running");
    setProblem(undefined);
    try {
      setReport(ok(await typedSender(api.sendJson)(addresses.resealSecrets)));
    } catch (error) {
      setProblem(explain(error, "The secrets could not be sealed again."));
    } finally {
      setState("idle");
    }
  };

  return (
    <Page
      title="Sealing key"
      description="Seal this workspace's stored secrets again under the current key."
    >
      <p className="fc-section-hint" style={{ margin: 0 }}>
        After you replace <span className="fc-mono">SECRETS_KEY</span> and list the old one in{" "}
        <span className="fc-mono">SECRETS_KEY_PREVIOUS</span>, seal again here. When every workspace
        of the install answers 0 sealed again and 0 unreadable, the old key can be removed.
      </p>
      {problem ? (
        <Notice tone="danger" title="Not done">
          {problem}
        </Notice>
      ) : null}
      {report ? (
        <Notice
          tone={report.unreadable > 0 ? "warning" : "success"}
          title={`${report.resealed} sealed again, ${report.current} already current, ${report.unreadable} unreadable`}
        >
          {report.unreadable > 0
            ? "An unreadable value is no key's: it was left as it is and must be typed again."
            : "Nothing is shown: only counts."}
        </Notice>
      ) : null}
      <div>
        <Button variant="primary" onClick={run} disabled={state === "running"}>
          {state === "running" ? "Sealing…" : "Seal again"}
        </Button>
      </div>
    </Page>
  );
}
