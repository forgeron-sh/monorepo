import "./portal.css";
import { Badge, Button, DetailList, Markdown, Notice, Tabs } from "@forgeron/ui";
import { useState } from "react";
import type { Api } from "../../api";
import { ago } from "../../format";
import { Loading, LoadError } from "../../states";
import { useLoad } from "../../use-load";
import type { WorkspaceInfo } from "../../workspace";
import { imagesOf, interfacesOf, loadToolCard, type ToolCardData } from "./catalog";
import { ConnectInstructions } from "./connect";

// The tool card: the Overview tab of the tool page, for admins and members alike. The README is the
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

/** The workspace roles that open the tool, by their label. */
function Roles({ roles }: { roles: ToolCardData["roles"] }) {
  return roles.map((role, i) => (
    <span key={role.name}>
      {i > 0 ? ", " : ""}
      <code className="fp-role">{role.label}</code>
    </span>
  ));
}

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

      {!granted && ws.person.admin ? (
        // An admin gives roles their access in the tool's Access tab (D-127): never "ask an admin".
        <Notice tone="info" title="Your roles do not let you use this tool yet.">
          What each workspace role is given in this tool is set in its{" "}
          <a href="?tab=access">Access</a> tab: give one of your roles a profile there.
          {card.roles.length > 0 ? (
            <>
              {" "}
              It is open to {card.roles.length > 1 ? "these roles: " : "the role "}
              <Roles roles={card.roles} />.
            </>
          ) : null}
        </Notice>
      ) : !granted ? (
        <Notice tone="info" title="You do not use this tool yet.">
          Ask an admin of this workspace to give you access to it
          {card.roles.length > 0 ? (
            <>
              : it is open to {card.roles.length > 1 ? "these roles: " : "the role "}
              <Roles roles={card.roles} />
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
                label: "Roles that may use it",
                value:
                  card.roles.length > 0 ? (
                    <span className="fc-badges">
                      {card.roles.map((role) => (
                        <Badge
                          key={role.name}
                          mono
                          tone={ws.person.roles.includes(role.name) ? "strong" : "neutral"}
                        >
                          {role.label}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    "No role yet"
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
                      label: "Set by an admin",
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
