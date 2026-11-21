// The details of a file or a folder, in a side panel: its mark, name and kind; who has access
// and how far it is open; its properties (owner, size, location, dates); then, in tabs, its
// versions (restore, download, upload a new one) and its activity.
//
// Roots with parts. `FileDetails` (`FileDetailsHeader`, `FileDetailsBody` with `FileDetailsAccess`
// and `FileDetailsProperties` in its sections) and `VersionList` (`VersionListNote`,
// `VersionListItems`, `VersionListRow`, `VersionListUpload`). Without children each draws all its
// regions; with children they are yours.

import {
  Building01Icon,
  Cancel01Icon,
  Download01Icon,
  GlobeIcon,
  LockIcon,
  Upload01Icon,
} from "@forgeron/icons";
import type { IconDefinition } from "@forgeron/icons";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
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
  /** The regions of the list; without them, the note, the rows and the upload button. */
  children?: ReactNode;
  className?: string;
}

interface VersionsContext {
  versions: ReadonlyArray<FileVersion>;
  retention: ReactNode;
  onRestore: ((id: string) => void) | undefined;
  onDownload: ((id: string) => void) | undefined;
  onUpload: (() => void) | undefined;
}

const VersionsCtx = createContext<VersionsContext | null>(null);

function useVersions(part: string): VersionsContext {
  const ctx = useContext(VersionsCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <VersionList>.`);
  return ctx;
}

/** The versions of a file, newest first: who, when, why; restore or download an older one. */
export function VersionList({
  versions,
  onRestore,
  onDownload,
  onUpload,
  retention,
  children,
  className,
}: VersionListProps) {
  return (
    <VersionsCtx.Provider value={{ versions, retention, onRestore, onDownload, onUpload }}>
      <div data-slot="version-list" className={cx("fg-versions", className)}>
        {children ?? (
          <>
            <VersionListNote />
            <VersionListItems />
            <VersionListUpload />
          </>
        )}
      </div>
    </VersionsCtx.Provider>
  );
}

/** The line above the list: how long old versions are kept. */
export function VersionListNote({ className, children, ...rest }: ComponentProps<"p">) {
  const { retention } = useVersions("VersionListNote");
  const text = children ?? retention;
  return text ? (
    <p data-slot="version-list-note" {...rest} className={cx("fg-versions-note", className)}>
      {text}
    </p>
  ) : null;
}

/** The rows, newest first; the first one is the current version. */
export function VersionListItems({ className, children, ...rest }: ComponentProps<"ol">) {
  const { versions } = useVersions("VersionListItems");
  return (
    <ol data-slot="version-list-items" {...rest} className={cx("fg-versions-list", className)}>
      {children ??
        versions.map((v, i) => <VersionListRow key={v.id} version={v} current={i === 0} />)}
    </ol>
  );
}

/** The button under the list that uploads a new version. */
export function VersionListUpload({ children, ...rest }: ComponentProps<typeof Button>) {
  const { onUpload } = useVersions("VersionListUpload");
  if (!onUpload) return null;
  return (
    <Button data-slot="version-list-upload" size="sm" onClick={onUpload} {...rest}>
      {children ?? (
        <>
          <Icon icon={Upload01Icon} size={12} variant="mono" />
          Upload new version
        </>
      )}
    </Button>
  );
}

/** One version: its label, who and when, why, and Restore and Download unless it is the current one. */
export function VersionListRow({
  version: v,
  current: isCurrent,
  className,
  ...rest
}: Omit<ComponentProps<"li">, "children"> & { version: FileVersion; current?: boolean }) {
  const { onRestore, onDownload } = useVersions("VersionListRow");
  const i = isCurrent ? 0 : 1;
  return (
    <li
      data-slot="version-list-row"
      {...rest}
      className={cx("fg-versions-row", i === 0 && "fg-versions-current", className)}
    >
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
  /** The regions of the panel; without them, the header and the body. */
  children?: ReactNode;
  className?: string;
}

const SCOPE_ICON: Record<AccessScope, IconDefinition> = {
  restricted: LockIcon,
  organization: Building01Icon,
  link: GlobeIcon,
};

interface DetailsContext extends Omit<FileDetailsProps, "children" | "className" | "kind"> {
  kind: FileKind;
  tabs: ReadonlyArray<{ id: string; label: string }>;
  shown: FileDetailsTab;
  setCurrent: (tab: FileDetailsTab) => void;
}

const DetailsCtx = createContext<DetailsContext | null>(null);

/** What the panel shows: the file, its tabs, the tab open, for a part of your own. */
export function useFileDetails(part = "useFileDetails"): DetailsContext {
  const ctx = useContext(DetailsCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <FileDetails>.`);
  return ctx;
}

/** A file's or a folder's details: access, properties, versions and activity. */
export function FileDetails({ children, className, ...props }: FileDetailsProps) {
  const { name, versions, activity, tab, defaultTab = "details", onTabChange } = props;
  const k = props.kind ?? fileKindOf(name);
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
  return (
    <DetailsCtx.Provider value={{ ...props, kind: k, tabs, shown, setCurrent }}>
      <aside
        data-slot="file-details"
        className={cx("fg-fdet", className)}
        aria-label={`Details of ${name}`}
      >
        {children ?? (
          <>
            <FileDetailsHeader />
            <FileDetailsBody />
          </>
        )}
      </aside>
    </DetailsCtx.Provider>
  );
}

/** The mark, the name, the kind and size, and the × that closes the panel. */
export function FileDetailsHeader({ className, children, ...rest }: ComponentProps<"header">) {
  const { name, kind: k, icon, size, onClose } = useFileDetails("FileDetailsHeader");
  const info = FILE_KINDS[k];
  return (
    <header data-slot="file-details-header" {...rest} className={cx("fg-fdet-head", className)}>
      {children ?? (
        <>
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
        </>
      )}
    </header>
  );
}

/** The tabs and the panel of the one open: details, versions or activity. Children replace the panel. */
export function FileDetailsBody({ className, children, ...rest }: ComponentProps<"div">) {
  const {
    tabs,
    shown,
    setCurrent,
    versions,
    onRestoreVersion,
    onDownloadVersion,
    onUploadVersion,
    retention,
    activity,
  } = useFileDetails("FileDetailsBody");
  const sections = <FileDetailsSections />;
  const panel =
    children ??
    (shown === "versions" && versions ? (
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
      sections
    ));
  return tabs.length > 1 ? (
    <Tabs
      label="Details"
      tabs={tabs}
      value={shown}
      onChange={(id) => setCurrent(id as FileDetailsTab)}
      className="fg-fdet-tabs"
    >
      <div data-slot="file-details-body" {...rest} className={cx("fg-fdet-body", className)}>
        {panel}
      </div>
    </Tabs>
  ) : (
    <div data-slot="file-details-body" {...rest} className={cx("fg-fdet-body", className)}>
      {children ?? sections}
    </div>
  );
}

/** The two sections of the Details tab: who has access, then the properties. */
export function FileDetailsSections({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="file-details-sections" {...rest} className={cx("fg-fdet-sections", className)}>
      {children ?? (
        <>
          <FileDetailsAccess />
          <FileDetailsProperties />
        </>
      )}
    </div>
  );
}

/** Who has access and how far it is open; nothing is drawn without `access`. */
export function FileDetailsAccess({ className, ...rest }: ComponentProps<"section">) {
  const { access } = useFileDetails("FileDetailsAccess");
  if (!access) return null;
  return (
    <section
      data-slot="file-details-access"
      aria-label="Who has access"
      {...rest}
      className={cx("fg-fdet-section", className)}
    >
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
  );
}

/** The properties: type, size, location, owner, dates, then your own `fields`. */
export function FileDetailsProperties({ className, ...rest }: ComponentProps<"section">) {
  const {
    kind: k,
    size,
    contents,
    owner,
    location,
    modified,
    created,
    fields = [],
  } = useFileDetails("FileDetailsProperties");
  const info = FILE_KINDS[k];
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
  const title = k === "folder" ? "Folder details" : "File details";
  return (
    <section
      data-slot="file-details-properties"
      aria-label={title}
      {...rest}
      className={cx("fg-fdet-section", className)}
    >
      <div className="fg-fdet-eyebrow">
        <span>{title}</span>
      </div>
      <DetailList items={rows} className="fg-fdet-list" />
    </section>
  );
}
