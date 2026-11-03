import { Badge, Button, CopyBlock, Notice, Page, Stat } from "@forgeron/ui";
import type { FetchJson } from "./api";
import { pathOf, routeClick } from "./router";
import { loadTools } from "./tools-list";
import { useLoad } from "./use-load";
import type { WorkspaceInfo } from "./workspace";

// The first screen: where the workspace stands and what to do next. The checklist is computed from
// `GET /api/workspace` (counts, no data) so it is true after a reload and for everyone.

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3 8.5l3.2 3.2L13 4.8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
  </svg>
);

export interface Step {
  id: "signed-in" | "members" | "deploy" | "call";
  title: string;
  done: boolean;
}

/** The four steps and whether each is done. */
export function firstRunSteps(ws: WorkspaceInfo): Step[] {
  return [
    { id: "signed-in", title: "Sign in", done: true },
    {
      id: "members",
      title: "Invite your team",
      done: ws.setup.members > 1 || ws.setup.invitations > 0,
    },
    { id: "deploy", title: "Deploy your first tool", done: ws.setup.deployed > 0 },
    { id: "call", title: "Make a first call", done: ws.setup.called },
  ];
}

export interface OverviewProps {
  ws: WorkspaceInfo;
  fetchJson: FetchJson;
  go: (href: string) => void;
}

export function Overview({ ws, fetchJson, go }: OverviewProps) {
  const steps = firstRunSteps(ws);
  const next = steps.find((s) => !s.done)?.id;
  const finished = steps.filter((s) => s.done).length;
  // The command of step 4 names a deployed tool when there is one; the list is not needed before.
  const tools = useLoad(
    () => (ws.setup.deployed > 0 ? loadTools(fetchJson) : Promise.resolve([])),
    [ws.setup.deployed],
  );
  const tool = tools.data?.find((t) => t.production || t.pilot || t.previews.length)?.name;

  const body = (id: Step["id"]) => {
    switch (id) {
      case "signed-in":
        return <p>You are signed in as {ws.person.email}.</p>;
      case "members":
        return (
          <>
            <p>Add the people who will use your tools. They sign in with their email address.</p>
            {ws.person.admin ? (
              <div>
                <Button variant="primary" href={pathOf("members")} onClick={routeClick(go)}>
                  Invite people
                </Button>
              </div>
            ) : (
              <p>Ask an admin of this workspace to invite them.</p>
            )}
          </>
        );
      case "deploy":
        return (
          <>
            <p>In a terminal, run these commands in your tool&apos;s folder, in this order.</p>
            <Command caption="Create a tool" value="forgeron init" />
            <Command
              caption="Link it to this workspace"
              value={`forgeron link --workspace ${ws.workspace}`}
            />
            <Command caption="Sign in from the terminal" value="forgeron login" />
            <Command
              caption="Deploy a preview"
              value="forgeron deploy --env preview --branch <name>"
              hint="Replace <name> with the branch you are working on."
            />
          </>
        );
      case "call":
        return (
          <>
            <p>List the actions of a deployed tool, then call one.</p>
            <Command caption="List the actions" value={`forgeron ${tool ?? "<tool>"} --help`} />
          </>
        );
    }
  };

  return (
    <Page
      title="Overview"
      description={
        <>
          Workspace <span className="fc-mono">{ws.workspace}</span>
        </>
      }
    >
      <section className="fc-section" aria-labelledby="start">
        <div className="fc-section-head">
          <h2 id="start" className="fc-section-title">
            {next ? "Get started" : "Setup"}
          </h2>
        </div>
        {next ? null : (
          <Notice tone="success" title="Your workspace is set up.">
            Tools are deployed and have been called. Open Tools to see what each environment serves.
          </Notice>
        )}
        <div className="fc-progress" style={next ? undefined : { marginTop: "var(--space-4)" }}>
          <span className="fc-progress-bar" aria-hidden="true">
            {steps.map((s) => (
              <span key={s.id} className="fc-progress-seg" data-done={s.done} />
            ))}
          </span>
          <span>
            {finished} of {steps.length} steps done
          </span>
        </div>
        <ol className="fc-steps">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="fc-step"
              data-done={step.done}
              data-next={step.id === next}
            >
              <span className="fc-step-mark">{step.done ? <Check /> : index + 1}</span>
              <div>
                <h3 className="fc-step-title">
                  {step.title}
                  {step.done ? (
                    <Badge tone="success" dot>
                      Done
                    </Badge>
                  ) : step.id === next ? (
                    <Badge tone="strong">Next</Badge>
                  ) : null}
                </h3>
                {step.done && step.id !== "signed-in" ? null : (
                  <div className="fc-step-body">{body(step.id)}</div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="fc-section" aria-labelledby="numbers">
        <div className="fc-section-head">
          <h2 id="numbers" className="fc-section-title">
            In this workspace
          </h2>
        </div>
        <div className="fc-stats">
          <Stat label="Members" value={String(ws.setup.members)} />
          <Stat label="Pending invitations" value={String(ws.setup.invitations)} />
          <Stat label="Tools" value={String(ws.setup.tools)} />
          <Stat label="Tools deployed" value={String(ws.setup.deployed)} />
        </div>
      </section>

      <section className="fc-section" aria-labelledby="endpoint">
        <div className="fc-section-head">
          <h2 id="endpoint" className="fc-section-title">
            Workspace endpoint
          </h2>
        </div>
        <p className="fc-section-hint">The address people and tools use to reach this workspace.</p>
        <CopyBlock label="Workspace endpoint" value={ws.endpoint} />
      </section>
    </Page>
  );
}

function Command({ caption, value, hint }: { caption: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="fc-caption">{caption}</p>
      <CopyBlock label={caption} value={value} prefix="$" />
      {hint ? (
        <p className="fc-section-hint" style={{ margin: "var(--space-1) 0 0" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
