import "./portal.css";
import { Badge, Button, DetailList, Markdown, Notice, Tabs } from "@forgeron/ui";
import { useState } from "react";
import type { Api } from "../../api";
import { ago } from "../../format";
import { can } from "../../shell/access";
import { Loading, LoadError } from "../../states";
import { useLoad } from "../../use-load";
import type { WorkspaceInfo } from "../../workspace";
import { imagesOf, interfacesOf, loadToolCard, type ToolCardData } from "./catalog";
import { ConnectInstructions } from "./connect";

// The tool card: the Overview tab of the tool page, for everyone who reads it. The README is the
// tool's own; the column on the right says what the tool needs from the person and what they may do.

export interface ToolOverviewProps {
  tool: string;
  /** A branch's preview (D-120): its README, guide and version instead of production's. */
  branch?: string;
  ws: WorkspaceInfo;
  api: Api;
  now?: () => Date;
}

export default function ToolOverview({
  tool,
  branch,
  ws,
  api,
  now = () => new Date(),
}: ToolOverviewProps) {
  const card = useLoad(() => loadToolCard(api.fetchJson, tool, branch), [api, tool, branch]);
  if (card.loading) return <Loading shape="page" label="Loading the tool card" />;
  if (card.error && !card.data)
    return <LoadError what="The tool card" error={card.error} onRetry={card.reload} />;
  return <ToolCardView card={card.data!} ws={ws} now={now} />;
}

/** The teams (and Everyone) that open the tool, by name. */
function Subjects({ subjects }: { subjects: ToolCardData["subjects"] }) {
  return subjects.map((s, i) => (
    <span key={s.subject}>
      {i > 0 ? ", " : ""}
      <code className="fp-subject">{s.name}</code>
    </span>
  ));
}

/** Whether the person is part of the subject: everyone is, a team if they are in it. */
const isMine = (subject: string, teams: readonly string[]) =>
  subject === "everyone" || teams.some((t) => subject === `team:${t}`);

export function ToolCardView({
  card,
  ws,
  now,
}: {
  card: ToolCardData;
  ws: WorkspaceInfo;
  now: () => Date;
}) {
  const [tab, setTab] = useState("about");
  const granted = card.access === "granted";
  const images = imagesOf(card);
  return (
    <div className="fp-card">
      {granted ? (
        <div className="fp-card-head">
          {card.interfaces.web ? (
            <Button variant="primary" href={`/t/${encodeURIComponent(card.name)}/`}>
              Open
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setTab("install")}>
              Connect
            </Button>
          )}
        </div>
      ) : null}

      {!granted && can(ws.person, "access:write") ? (
        // Whoever gives access does it in the tool's Access tab (D-127, D-136): never "ask someone".
        <Notice tone="info" title="None of your teams uses this tool yet.">
          Who may use this tool is set in its <a href="?tab=access">Access</a> tab: give Everyone,
          or one of your teams, a profile there.
          {card.subjects.length > 0 ? (
            <>
              {" "}
              It is open to <Subjects subjects={card.subjects} />.
            </>
          ) : null}
        </Notice>
      ) : !granted ? (
        <Notice tone="info" title="None of your teams uses this tool yet.">
          Ask someone who gives access to share it with one of your teams
          {card.subjects.length > 0 ? (
            <>
              : it is open to <Subjects subjects={card.subjects} />
            </>
          ) : null}
          .
        </Notice>
      ) : null}

      <div className="fp-card-body">
        <div className="fp-card-main">
          <Tabs
            label="About this tool"
            tabs={[
              { id: "about", label: "About" },
              ...(card.guide ? [{ id: "guide", label: "What its users read" }] : []),
              { id: "install", label: "How to install" },
            ]}
            value={tab}
            onChange={setTab}
          >
            {tab === "about" ? (
              card.readme?.trim() ? (
                <Markdown source={card.readme} images={images} />
              ) : (
                <p className="fc-muted">
                  The owner of this tool has not written a description yet.
                </p>
              )
            ) : tab === "guide" && card.guide ? (
              <Markdown source={card.guide} images={images} />
            ) : (
              <ConnectInstructions tool={card} />
            )}
          </Tabs>
        </div>
        <aside className="fp-card-side" aria-label="Details">
          <DetailList
            items={[
              {
                label: "Version",
                value: card.productionVersion ? (
                  <span className="fc-mono">{card.productionVersion}</span>
                ) : (
                  "Not deployed"
                ),
              },
              {
                label: "Last release",
                value: card.lastRelease ? (
                  <div className="fp-release">
                    <p className="fp-release-head">
                      <span className="fc-mono">{card.lastRelease.version}</span>{" "}
                      <span className="fc-muted">{ago(card.lastRelease.date, now())}</span>
                    </p>
                    {card.lastRelease.changelog.length > 0 ? (
                      <ul className="fp-changelog">
                        {card.lastRelease.changelog.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : (
                  "No release yet"
                ),
              },
              {
                label: "Interfaces",
                value:
                  interfacesOf(card).length > 0 ? (
                    <span className="fc-badges">
                      {interfacesOf(card).map((label) => (
                        <Badge key={label} mono>
                          {label}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    "None"
                  ),
              },
              {
                label: "Teams that may use it",
                value:
                  card.subjects.length > 0 ? (
                    <span className="fc-badges">
                      {card.subjects.map((s) => (
                        <Badge
                          key={s.subject}
                          tone={isMine(s.subject, ws.person.teams) ? "strong" : "neutral"}
                        >
                          {s.label ? `${s.name}: ${s.label}` : s.name}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    "None yet"
                  ),
              },
              ...(card.yourAccess.length > 0
                ? [
                    {
                      label: "Your access",
                      value: (
                        <ul className="fp-access">
                          {card.yourAccess.map((a) => (
                            <li key={a.action}>
                              <code className="fc-mono">{a.action}</code>{" "}
                              <Badge tone={a.allowed ? "success" : "neutral"}>
                                {a.allowed ? "Allowed" : "Not allowed"}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      ),
                    },
                  ]
                : []),
              {
                label: "You will be asked for",
                value:
                  card.requiredUserSecrets.length === 0 && card.connectors.length === 0 ? (
                    "Nothing"
                  ) : (
                    <ul className="fp-access">
                      {card.requiredUserSecrets.map((secret) => (
                        <li key={secret.name}>
                          {secret.label}
                          {secret.why ? <span className="fc-muted"> {secret.why}</span> : null}
                        </li>
                      ))}
                      {card.connectors.map((c) => (
                        <li key={c.name}>
                          {c.name} <span className="fc-muted">account, {c.mode}</span>
                        </li>
                      ))}
                    </ul>
                  ),
              },
              ...(card.requiredSecrets.length > 0
                ? [
                    {
                      label: "Set for the workspace",
                      value: (
                        <ul className="fp-access">
                          {card.requiredSecrets.map((secret) => (
                            <li key={secret.name}>
                              <code className="fc-mono">{secret.name}</code>
                              {secret.why ? <span className="fc-muted"> {secret.why}</span> : null}
                            </li>
                          ))}
                        </ul>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
