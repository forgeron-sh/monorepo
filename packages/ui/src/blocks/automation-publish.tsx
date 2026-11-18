// Drafts and versions of an automation, after the Flows prototype: edits make a draft, a publish
// makes an immutable version that the triggers run, an old version comes back as a draft.
// `PublishBar` says where the draft stands next to the active switch and the Publish button;
// `PublishDialog` asks what changed, lists the changes and the checks that block it;
// `VersionHistory` lists the versions with their changes and restores one.

import { DeployIcon, InformationCircleIcon, RollbackIcon } from "@forgeron/icons";
import { useState, type ReactNode } from "react";
import { Badge } from "../badge";
import { Button } from "../button";
import { Switch } from "../controls";
import { cx } from "../cx";
import { Dialog } from "../dialog";
import { Field, Input } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { Led } from "../led";
import type { VersionChange } from "./automation-model";

/* ---------------------------------------------------------------- ChangeList */

export interface ChangeListProps {
  changes: ReadonlyArray<VersionChange>;
  empty?: ReactNode;
  className?: string;
}

const MARK = { add: "+", remove: "−", change: "~" } as const;
const WORD = { add: "Added", remove: "Removed", change: "Changed" } as const;

/** Changes, one line each, marked + added, − removed, ~ changed. */
export function ChangeList({ changes, empty = "No change", className }: ChangeListProps) {
  if (changes.length === 0) return <p className={cx("fg-changes-empty", className)}>{empty}</p>;
  return (
    <ul className={cx("fg-changes", className)}>
      {changes.map((c, i) => (
        <li key={i} className={`fg-changes-${c.kind}`}>
          <span className="fg-changes-mark" aria-hidden="true">
            {MARK[c.kind]}
          </span>
          <span className="fg-sr">{WORD[c.kind]}: </span>
          <span>{c.text}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- PublishBar */

export interface PublishBarProps {
  /** The last published version; none: never published. */
  version?: number;
  /** Changes in the draft since it. */
  changes: number;
  /** Listens to its trigger. Without `onActiveChange` the switch is not shown. */
  active?: boolean;
  onActiveChange?: (active: boolean) => void;
  onPublish?: () => void;
  /** More buttons after Publish: the menu of the automation. */
  children?: ReactNode;
  className?: string;
}

/** Draft or published, the active switch and Publish, for the header of an automation. */
export function PublishBar({
  version,
  changes,
  active,
  onActiveChange,
  onPublish,
  children,
  className,
}: PublishBarProps) {
  const state =
    version === undefined
      ? { tone: "neutral" as const, text: "Never published" }
      : changes > 0
        ? { tone: "warning" as const, text: `Draft · ${changes} change${changes === 1 ? "" : "s"}` }
        : { tone: "success" as const, text: `v${version} published` };
  return (
    <div className={cx("fg-pubbar", className)}>
      <span className="fg-pubbar-state" aria-live="polite">
        <Led tone={state.tone} />
        {state.text}
      </span>
      {onActiveChange ? (
        <Switch
          label={active ? "Active" : "Inactive"}
          checked={active ?? false}
          disabled={version === undefined}
          onChange={(e) => onActiveChange(e.target.checked)}
        />
      ) : null}
      {onPublish ? (
        <Button
          size="sm"
          variant={changes > 0 || version === undefined ? "primary" : "secondary"}
          disabled={version !== undefined && changes === 0}
          onClick={onPublish}
        >
          <Icon icon={DeployIcon} size={12} variant="mono" />
          Publish
        </Button>
      ) : null}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- PublishDialog */

export interface PublishCheck {
  /** `blocking` keeps Publish off: no trigger, a step not deployed. */
  level: "warning" | "blocking";
  text: string;
}

export interface PublishDialogProps {
  /** The number the new version gets. */
  version: number;
  changes: ReadonlyArray<VersionChange>;
  checks?: ReadonlyArray<PublishCheck>;
  /** Says when it takes effect. */
  active?: boolean;
  /** With the message typed, or the first change when none was typed. */
  onPublish: (message: string) => void;
  onClose: () => void;
  /** Under the checks: what runs the steps, `Built from flows 0.2.0+3c9e1f4`. */
  note?: ReactNode;
}

/** What changed and what blocks, before a version is made. */
export function PublishDialog({
  version,
  changes,
  checks = [],
  active,
  onPublish,
  onClose,
  note,
}: PublishDialogProps) {
  const [message, setMessage] = useState("");
  const blocked = checks.some((c) => c.level === "blocking");
  const go = () => {
    if (blocked) return;
    onPublish(message.trim() || changes[0]?.text || "Update");
  };
  return (
    <Dialog
      title={`Publish v${version}`}
      onClose={onClose}
      footer={
        <>
          <span className="fg-pubdlg-when">
            <Icon icon={InformationCircleIcon} size={12} variant="mono" />
            {active
              ? "Active: takes effect on the next trigger."
              : "Stays inactive until you activate it."}
          </span>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={blocked} onClick={go}>
            <Icon icon={DeployIcon} size={12} variant="mono" />
            {`Publish v${version}`}
          </Button>
        </>
      }
    >
      <div className="fg-pubdlg">
        <Field label="What changed">
          {(control) => (
            <Input
              {...control}
              data-autofocus
              placeholder="e.g. Escalate amounts above €5,000"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  go();
                }
              }}
            />
          )}
        </Field>
        <div className="fg-pubdlg-eyebrow">
          {`${changes.length} change${changes.length === 1 ? "" : "s"} ${version > 1 ? `since v${version - 1}` : "in this first version"}`}
        </div>
        <ChangeList changes={changes} />
        {checks.length ? (
          <>
            <div className="fg-pubdlg-eyebrow">Checks</div>
            <ul className="fg-pubdlg-checks">
              {checks.map((c, i) => (
                <li key={i} className={`fg-pubdlg-${c.level}`}>
                  <Led tone={c.level === "blocking" ? "danger" : "warning"} />
                  <span className="fg-sr">
                    {c.level === "blocking" ? "Blocks publishing: " : "Warning: "}
                  </span>
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {note ? <p className="fg-pubdlg-note">{note}</p> : null}
      </div>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- VersionHistory */

export interface AutomationVersion {
  version: number;
  message: string;
  /** `YYYY-MM-DD HH:MM`. */
  at: string;
  by: string;
  changes?: ReadonlyArray<VersionChange>;
}

export interface VersionHistoryProps {
  /** Newest first. */
  versions: ReadonlyArray<AutomationVersion>;
  /** The changes not published yet: a Draft entry on top. */
  draft?: ReadonlyArray<VersionChange>;
  /** The version the triggers run. */
  live?: number;
  /** `draft` or a version number. */
  selected?: number | "draft";
  defaultSelected?: number | "draft";
  onSelect?: (selected: number | "draft") => void;
  /** Restore as draft: the version's steps replace the draft. */
  onRestore?: (version: number) => void;
  /** Publish, on the draft. */
  onPublish?: () => void;
  /** Discard the draft. */
  onDiscard?: () => void;
  className?: string;
}

/** The versions of an automation, the draft on top; one chosen shows its changes. */
export function VersionHistory({
  versions,
  draft,
  live,
  selected,
  defaultSelected,
  onSelect,
  onRestore,
  onPublish,
  onDiscard,
  className,
}: VersionHistoryProps) {
  const first: number | "draft" = draft?.length ? "draft" : (versions[0]?.version ?? "draft");
  const [chosen, choose] = useControllableState<number | "draft">({
    value: selected,
    defaultValue: defaultSelected ?? first,
    onChange: onSelect,
  });
  const version = chosen === "draft" ? undefined : versions.find((v) => v.version === chosen);
  return (
    <div className={cx("fg-versions", className)}>
      <ol className="fg-versions-list" aria-label="Versions">
        {draft?.length ? (
          <li>
            <button
              type="button"
              className="fg-versions-row"
              aria-current={chosen === "draft" ? "true" : undefined}
              onClick={() => choose("draft")}
            >
              <span className="fg-versions-num">Draft</span>
              <span className="fg-versions-msg">{`${draft.length} change${draft.length === 1 ? "" : "s"}`}</span>
              <Led tone="warning" />
            </button>
          </li>
        ) : null}
        {versions.map((v) => (
          <li key={v.version}>
            <button
              type="button"
              className="fg-versions-row"
              aria-current={chosen === v.version ? "true" : undefined}
              onClick={() => choose(v.version)}
            >
              <span className="fg-versions-num">v{v.version}</span>
              <span className="fg-versions-msg">{v.message}</span>
              {live === v.version ? <Badge tone="success">Live</Badge> : null}
              <span className="fg-versions-at">{v.at.slice(0, 10)}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="fg-versions-detail">
        {chosen === "draft" ? (
          <>
            <h3 className="fg-versions-title">Draft</h3>
            <p className="fg-versions-sub">
              {`Changes since ${versions[0] ? `v${versions[0].version}` : "the start"}. Manual runs use the draft; triggers use the published version.`}
            </p>
            <ChangeList changes={draft ?? []} />
            <div className="fg-versions-actions">
              {onPublish ? (
                <Button size="sm" variant="primary" onClick={onPublish}>
                  <Icon icon={DeployIcon} size={12} variant="mono" />
                  Publish
                </Button>
              ) : null}
              {onDiscard && versions.length ? (
                <Button size="sm" onClick={onDiscard}>
                  Discard changes
                </Button>
              ) : null}
            </div>
          </>
        ) : version ? (
          <>
            <h3 className="fg-versions-title">
              {`v${version.version} · ${version.message}`}
              {live === version.version ? <Badge tone="success">Live</Badge> : null}
            </h3>
            <p className="fg-versions-sub">{`Published by ${version.by} on ${version.at}`}</p>
            <ChangeList changes={version.changes ?? []} />
            {onRestore ? (
              <div className="fg-versions-actions">
                <Button size="sm" onClick={() => onRestore(version.version)}>
                  <Icon icon={RollbackIcon} size={12} variant="mono" />
                  Restore as draft
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="fg-versions-sub">Never published.</p>
        )}
      </div>
    </div>
  );
}
