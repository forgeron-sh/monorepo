// The details of a file or a folder, in a side panel: its mark, name and kind; who has access
// and how far it is open; its properties (owner, size, location, dates); then, in tabs, its
// versions (restore, download, upload a new one) and its activity.

import {
  Building01Icon,
  Cancel01Icon,
  Download01Icon,
  GlobeIcon,
  LockIcon,
  Upload01Icon,
} from "@forgeron/icons";
import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Avatar } from "../avatar";
import { Button } from "../button";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { AvatarGroup, IconButton } from "../identity";
import { Tabs } from "../tabs";
import { DetailList, type DetailItem } from "../tool-card";
import { FILE_KINDS, fileKindOf, FileTypeMark, formatBytes, type FileKind } from "./drive-parts";

/* ---------------------------------------------------------------- VersionList */

export interface FileVersion {
  id: string;
  /** "v4". */
  label: string;
  /** When it was written, already formatted: "Nov 17, 2026 · 15:40". */
  at: string;
  /** Who wrote it. */
  by: string;
  size?: number;
  /** Why: "Restored from v2", "Prices updated". */
  note?: string;
}

export interface VersionListProps {
  /** Newest first; the first one is the current version. */
  versions: ReadonlyArray<FileVersion>;
  /** Makes an older version the current one; leave out on a read-only file. */
  onRestore?: (id: string) => void;
  onDownload?: (id: string) => void;
  /** A button under the list that uploads a new version. */
  onUpload?: () => void;
  /** A line above the list: how long old versions are kept. */
  retention?: ReactNode;
  className?: string;
}

/** The versions of a file, newest first: who, when, why; restore or download an older one. */
export function VersionList({
  versions,
  onRestore,
  onDownload,
  onUpload,
  retention,
  className,
}: VersionListProps) {
  return (
    <div className={cx("fg-versions", className)}>
      {retention ? <p className="fg-versions-note">{retention}</p> : null}
      <ol className="fg-versions-list">
        {versions.map((v, i) => (
          <li key={v.id} className={cx("fg-versions-row", i === 0 && "fg-versions-current")}>
            <span className="fg-versions-label">{v.label}</span>
            <div className="fg-versions-text">
              <b>{i === 0 ? "Current version" : v.at}</b>
              <span className="fg-versions-by">
                <Avatar name={v.by} size={16} />
                {v.by}
                {v.size !== undefined ? ` · ${formatBytes(v.size)}` : ""}
                {i === 0 ? ` · ${v.at}` : ""}
              </span>
              {v.note ? <i className="fg-versions-why">{v.note}</i> : null}
            </div>
            <span className="fg-versions-acts">
              {i === 0 ? (
                <span className="fg-versions-chip">Current</span>
              ) : (
                <>
                  {onRestore ? (
                    <Button size="sm" onClick={() => onRestore(v.id)}>
                      Restore
                    </Button>
                  ) : null}
                  {onDownload ? (
                    <IconButton
                      icon={Download01Icon}
                      label={`Download ${v.label}`}
                      size="sm"
                      onClick={() => onDownload(v.id)}
                    />
                  ) : null}
                </>
              )}
            </span>
          </li>
        ))}
      </ol>
      {onUpload ? (
        <Button size="sm" onClick={onUpload}>
          <Icon icon={Upload01Icon} size={12} variant="mono" />
          Upload new version
        </Button>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- FileDetails */

export type AccessScope = "restricted" | "organization" | "link";

export interface FileAccess {
  /** The names of the people with access, the owner first. */
  people: ReadonlyArray<string>;
  /** How far it is open; `restricted` by default. */
  scope?: AccessScope;
  /** The line under the people: "Anyone at Atelier Moreau can view". */
  summary?: ReactNode;
  /** A "Manage" button: open the ShareDialog. */
  onManage?: () => void;
}

export type FileDetailsTab = "details" | "versions" | "activity";

export interface FileDetailsProps {
  name: string;
  /** The kind; from the name by default; `folder` for a folder. */
  kind?: FileKind;
  /** In place of the kind's icon. */
  icon?: IconDefinition;
  /** In bytes; for a folder, the total of its files. */
  size?: number;
  /** A folder's content: "12 items". */
  contents?: string;
  owner?: string;
  /** Where it sits; a link to the folder, or a path. */
  location?: ReactNode;
  /** Already formatted. */
  modified?: string;
  created?: string;
  /** More rows after the standard ones: a linked record, a storage key. */
  fields?: ReadonlyArray<DetailItem>;
  /** Who has access; leave out to hide the section. */
  access?: FileAccess;
  /** The Versions tab, for a file. */
  versions?: ReadonlyArray<FileVersion>;
  onRestoreVersion?: (id: string) => void;
  onDownloadVersion?: (id: string) => void;
  onUploadVersion?: () => void;
  /** The line above the versions. */
  retention?: ReactNode;
  /** The Activity tab: an `Activity` or an `AuditLog`. */
  activity?: ReactNode;
  tab?: FileDetailsTab;
  defaultTab?: FileDetailsTab;
  onTabChange?: (tab: FileDetailsTab) => void;
  /** An × in the header. */
  onClose?: () => void;
  className?: string;
}

const SCOPE_ICON: Record<AccessScope, IconDefinition> = {
  restricted: LockIcon,
  organization: Building01Icon,
  link: GlobeIcon,
};

/** A file's or a folder's details: access, properties, versions and activity. */
export function FileDetails({
  name,
  kind,
  icon,
  size,
  contents,
  owner,
  location,
  modified,
  created,
  fields = [],
  access,
  versions,
  onRestoreVersion,
  onDownloadVersion,
  onUploadVersion,
  retention,
  activity,
  tab,
  defaultTab = "details",
  onTabChange,
  onClose,
  className,
}: FileDetailsProps) {
  const k = kind ?? fileKindOf(name);
  const info = FILE_KINDS[k];
  const tabs = [
    { id: "details", label: "Details" },
    ...(versions ? [{ id: "versions", label: "Versions" }] : []),
    ...(activity !== undefined ? [{ id: "activity", label: "Activity" }] : []),
  ];
  const [current, setCurrent] = useControllableState<FileDetailsTab>({
    value: tab,
    defaultValue: defaultTab,
    onChange: onTabChange,
  });
  const shown = tabs.some((t) => t.id === current) ? current : "details";
  const sizeText =
    k === "folder"
      ? [contents, size !== undefined ? formatBytes(size) : null].filter(Boolean).join(" · ")
      : formatBytes(size);
  const rows: DetailItem[] = [
    { label: "Type", value: info.label },
    ...(sizeText
      ? [{ label: "Size", value: <span className="fg-fdet-mono">{sizeText}</span> }]
      : []),
    ...(location !== undefined ? [{ label: "Location", value: location }] : []),
    ...(owner ? [{ label: "Owner", value: owner }] : []),
    ...(modified
      ? [{ label: "Modified", value: <span className="fg-fdet-mono">{modified}</span> }]
      : []),
    ...(created
      ? [{ label: "Created", value: <span className="fg-fdet-mono">{created}</span> }]
      : []),
    ...fields,
  ];

  const details = (
    <div className="fg-fdet-sections">
      {access ? (
        <section className="fg-fdet-section" aria-label="Who has access">
          <div className="fg-fdet-eyebrow">
            <span>Who has access</span>
            {access.onManage ? (
              <Button variant="ghost" size="sm" onClick={access.onManage}>
                Manage
              </Button>
            ) : null}
          </div>
          <div className="fg-fdet-access">
            <AvatarGroup names={access.people} max={6} size={22} />
            <span className="fg-fdet-people">
              {access.people.length === 0
                ? "Only you"
                : access.people.length === 1
                  ? access.people[0]
                  : `${access.people[0]} and ${access.people.length - 1} more`}
            </span>
          </div>
          <p className="fg-fdet-scope">
            <Icon icon={SCOPE_ICON[access.scope ?? "restricted"]} size={12} variant="mono" />
            {access.summary ?? "Restricted to the people above"}
          </p>
        </section>
      ) : null}
      <section
        className="fg-fdet-section"
        aria-label={k === "folder" ? "Folder details" : "File details"}
      >
        <div className="fg-fdet-eyebrow">
          <span>{k === "folder" ? "Folder details" : "File details"}</span>
        </div>
        <DetailList items={rows} className="fg-fdet-list" />
      </section>
    </div>
  );

  const panel =
    shown === "versions" && versions ? (
      <VersionList
        versions={versions}
        {...(onRestoreVersion ? { onRestore: onRestoreVersion } : {})}
        {...(onDownloadVersion ? { onDownload: onDownloadVersion } : {})}
        {...(onUploadVersion ? { onUpload: onUploadVersion } : {})}
        retention={retention}
      />
    ) : shown === "activity" ? (
      activity
    ) : (
      details
    );

  return (
    <aside className={cx("fg-fdet", className)} aria-label={`Details of ${name}`}>
      <header className="fg-fdet-head">
        <FileTypeMark kind={k} size="lg" {...(icon ? { icon } : {})} />
        <div className="fg-fdet-titles">
          <h2 className="fg-fdet-name">{name}</h2>
          <p className="fg-fdet-kind">
            {info.label}
            {k !== "folder" && size !== undefined ? ` · ${formatBytes(size)}` : ""}
          </p>
        </div>
        {onClose ? (
          <IconButton icon={Cancel01Icon} label="Close details" size="sm" onClick={onClose} />
        ) : null}
      </header>
      {tabs.length > 1 ? (
        <Tabs
          label="Details"
          tabs={tabs}
          value={shown}
          onChange={(id) => setCurrent(id as FileDetailsTab)}
          className="fg-fdet-tabs"
        >
          <div className="fg-fdet-body">{panel}</div>
        </Tabs>
      ) : (
        <div className="fg-fdet-body">{details}</div>
      )}
    </aside>
  );
}
