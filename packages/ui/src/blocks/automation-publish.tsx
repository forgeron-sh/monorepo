// Drafts and versions of an automation, after the Flows prototype: edits make a draft, a publish
// makes an immutable version that the triggers run, an old version comes back as a draft.
// `PublishBar` says where the draft stands next to the active switch and the Publish button;
// `PublishDialog` asks what changed, lists the changes and the checks that block it;
// `VersionHistory` lists the versions with their changes and restores one.
//
// Each draws itself from its props and takes parts:
//
//   <PublishBar version={3} changes={2} onPublish={open}>
//     <PublishBarState /><PublishBarSwitch /><PublishBarPublish />
//   </PublishBar>
//
//   <PublishDialog version={4} changes={changes} checks={checks} onPublish={go} onClose={close}>
//     <PublishDialogContent>
//       <PublishDialogMessage /><PublishDialogChanges /><PublishDialogChecks />
//       <PublishDialogFooter />
//     </PublishDialogContent>
//   </PublishDialog>
//
//   <VersionHistory versions={versions} draft={draft} live={3}>
//     <VersionHistoryList /><VersionHistoryDetail />
//   </VersionHistory>

import { DeployIcon, InformationCircleIcon, RollbackIcon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useRef,
  type RefObject,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Badge } from "../badge";
import { Button } from "../button";
import { Switch } from "../controls";
import { cx } from "../cx";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../dialog";
import { Field, Input } from "../form";
import { useCollection } from "../hooks/use-collection";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { Led } from "../led";
import { hasPart, renderPart } from "../part";
import { Status, StatusIndicator, StatusLabel } from "../status";
import type { VersionChange } from "./automation-model";

/* ---------------------------------------------------------------- ChangeList */

export interface ChangeListProps extends Omit<ComponentProps<"ul">, "className" | "children"> {
  changes: ReadonlyArray<VersionChange>;
  empty?: ReactNode;
  className?: string;
}

/** The parts form: `changes` stays undefined, the items are `ChangeListItem`s. */
export interface ChangeListRootProps extends Omit<ComponentProps<"ul">, "className"> {
  changes?: undefined;
  className?: string;
  asChild?: boolean;
}

const MARK = { add: "+", remove: "−", change: "~" } as const;
const WORD = { add: "Added", remove: "Removed", change: "Changed" } as const;

/** Changes, one line each, marked + added, − removed, ~ changed. */
export function ChangeList(props: ChangeListProps | ChangeListRootProps) {
  if (props.changes === undefined) {
    const { changes: _changes, className, asChild, ...rest } = props as ChangeListRootProps;
    return renderPart("ul", cx("fg-changes", className), asChild, {
      "data-slot": "change-list",
      ...rest,
    });
  }
  const { changes, empty = "No change", className, ...rest } = props as ChangeListProps;
  if (changes.length === 0)
    return (
      <p data-slot="change-list-empty" className={cx("fg-changes-empty", className)}>
        {empty}
      </p>
    );
  return (
    <ChangeList className={className} {...rest}>
      {changes.map((c, i) => (
        <ChangeListItem key={i} kind={c.kind}>
          {c.text}
        </ChangeListItem>
      ))}
    </ChangeList>
  );
}

export interface ChangeListItemProps extends Omit<ComponentProps<"li">, "className"> {
  kind: VersionChange["kind"];
  className?: string;
}

/** One change: its mark, its word for screen readers, its text. */
export function ChangeListItem({ kind, className, children, ...rest }: ChangeListItemProps) {
  return (
    <li data-slot="change-list-item" {...rest} className={cx(`fg-changes-${kind}`, className)}>
      <span className="fg-changes-mark" aria-hidden="true">
        {MARK[kind]}
      </span>
      <span className="fg-sr">{WORD[kind]}: </span>
      <span>{children}</span>
    </li>
  );
}

/* ---------------------------------------------------------------- PublishBar */

interface PublishBarContext {
  version: number | undefined;
  changes: number;
  active: boolean | undefined;
  onActiveChange: ((active: boolean) => void) | undefined;
  onPublish: (() => void) | undefined;
}

const BarCtx = createContext<PublishBarContext | null>(null);

function useBar(part: string): PublishBarContext {
  const ctx = useContext(BarCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <PublishBar>.`);
  return ctx;
}

export interface PublishBarProps extends Omit<ComponentProps<"div">, "className"> {
  /** The last published version; none: never published. */
  version?: number;
  /** Changes in the draft since it. */
  changes: number;
  /** Listens to its trigger. Without `onActiveChange` the switch is not shown. */
  active?: boolean;
  onActiveChange?: (active: boolean) => void;
  onPublish?: () => void;
  /** More buttons after Publish: the menu of the automation. Or the parts, which replace the bar. */
  children?: ReactNode;
  className?: string;
  asChild?: boolean;
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
  asChild,
  ...rest
}: PublishBarProps) {
  const composed = hasPart(children, [PublishBarState, PublishBarSwitch, PublishBarPublish]);
  return (
    <BarCtx.Provider value={{ version, changes, active, onActiveChange, onPublish }}>
      {renderPart("div", cx("fg-pubbar", className), asChild, {
        "data-slot": "publish-bar",
        ...rest,
        children: composed ? (
          children
        ) : (
          <>
            <PublishBarState />
            <PublishBarSwitch />
            <PublishBarPublish />
            {children}
          </>
        ),
      })}
    </BarCtx.Provider>
  );
}

/** Where the draft stands: never published, a draft with its changes, or published. */
export function PublishBarState({ className, children, ...rest }: ComponentProps<typeof Status>) {
  const { version, changes } = useBar("PublishBarState");
  const state =
    version === undefined
      ? { tone: "neutral" as const, text: "Never published" }
      : changes > 0
        ? { tone: "warning" as const, text: `Draft · ${changes} change${changes === 1 ? "" : "s"}` }
        : { tone: "success" as const, text: `v${version} published` };
  return (
    <Status
      tone={state.tone}
      data-slot="publish-bar-state"
      aria-live="polite"
      {...(rest as object)}
      className={cx("fg-pubbar-state", className)}
    >
      {children ?? (
        <>
          <StatusIndicator />
          <StatusLabel>{state.text}</StatusLabel>
        </>
      )}
    </Status>
  );
}

/** The switch that makes the automation listen to its trigger. Nothing without `onActiveChange`. */
export function PublishBarSwitch({ className }: { className?: string }) {
  const { version, active, onActiveChange } = useBar("PublishBarSwitch");
  if (!onActiveChange) return null;
  return (
    <Switch
      data-slot="publish-bar-switch"
      className={className}
      label={active ? "Active" : "Inactive"}
      checked={active ?? false}
      disabled={version === undefined}
      onChange={(e) => onActiveChange(e.target.checked)}
    />
  );
}

/** Publish: off while there is nothing to publish. Nothing without `onPublish`. */
export function PublishBarPublish({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { version, changes, onPublish } = useBar("PublishBarPublish");
  if (!onPublish) return null;
  return (
    <Button
      size="sm"
      variant={changes > 0 || version === undefined ? "primary" : "secondary"}
      disabled={version !== undefined && changes === 0}
      data-slot="publish-bar-publish"
      className={className}
      onClick={onPublish}
    >
      {children ?? (
        <>
          <Icon icon={DeployIcon} size={12} variant="mono" />
          Publish
        </>
      )}
    </Button>
  );
}

/* ---------------------------------------------------------------- PublishDialog */

export interface PublishCheck {
  /** `blocking` keeps Publish off: no trigger, a step not deployed. */
  level: "warning" | "blocking";
  text: string;
}

interface PublishDialogContext {
  version: number;
  changes: ReadonlyArray<VersionChange>;
  checks: ReadonlyArray<PublishCheck>;
  active: boolean | undefined;
  note: ReactNode;
  message: string;
  setMessage: (message: string) => void;
  blocked: boolean;
  /** Publishes with the message typed, or the first change. Does nothing while a check blocks. */
  go: () => void;
  onClose: () => void;
  /** The field of the message: the dialog opens on it. */
  messageRef: RefObject<HTMLInputElement | null>;
}

const DialogCtx = createContext<PublishDialogContext | null>(null);

/** The dialog a part is in: the changes, the checks and what is typed. */
export function usePublishDialog(part = "usePublishDialog"): PublishDialogContext {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <PublishDialog>.`);
  return ctx;
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
  /** The parts: a `PublishDialogContent`. Without them the dialog is drawn whole. */
  children?: ReactNode;
}

/** What changed and what blocks, before a version is made. Render it while it is open. */
export function PublishDialog({
  version,
  changes,
  checks = [],
  active,
  onPublish,
  onClose,
  note,
  children,
}: PublishDialogProps) {
  const [message, setMessage] = useState("");
  const messageRef = useRef<HTMLInputElement | null>(null);
  const blocked = checks.some((c) => c.level === "blocking");
  const ctx: PublishDialogContext = {
    version,
    changes,
    checks,
    active,
    note,
    message,
    setMessage,
    blocked,
    go: () => {
      if (blocked) return;
      onPublish(message.trim() || changes[0]?.text || "Update");
    },
    onClose,
    messageRef,
  };
  return (
    <DialogCtx.Provider value={ctx}>
      <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
        {children ?? (
          <PublishDialogContent>
            <PublishDialogMessage />
            <PublishDialogChanges />
            <PublishDialogChecks />
            <PublishDialogNote />
            <PublishDialogFooter />
          </PublishDialogContent>
        )}
      </Dialog>
    </DialogCtx.Provider>
  );
}

/** The box, with its title `Publish v4`, then the parts below as a column. */
export function PublishDialogContent({
  className,
  children,
  ...rest
}: Omit<ComponentProps<typeof DialogContent>, "title">) {
  const { version, messageRef } = usePublishDialog("PublishDialogContent");
  return (
    <DialogContent
      data-slot="publish-dialog-content"
      showCloseButton={false}
      initialFocus={messageRef}
      {...rest}
      className={cx("fg-pubdlg", className)}
    >
      <DialogHeader>
        <DialogTitle>{`Publish v${version}`}</DialogTitle>
      </DialogHeader>
      {children}
    </DialogContent>
  );
}

/** What the version is about, in a field: Enter publishes. */
export function PublishDialogMessage({ label = "What changed" }: { label?: ReactNode }) {
  const { message, setMessage, go, messageRef } = usePublishDialog("PublishDialogMessage");
  return (
    <Field data-slot="publish-dialog-message" label={label}>
      {(control) => (
        <Input
          {...control}
          {...({ ref: messageRef } as object)}
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
  );
}

/** `3 changes since v3` and the list of them. */
export function PublishDialogChanges({
  className,
  ...rest
}: Omit<ComponentProps<"div">, "children">) {
  const { changes, version } = usePublishDialog("PublishDialogChanges");
  return (
    <div data-slot="publish-dialog-changes" {...rest} className={className}>
      <div className="fg-pubdlg-eyebrow">
        {`${changes.length} change${changes.length === 1 ? "" : "s"} ${version > 1 ? `since v${version - 1}` : "in this first version"}`}
      </div>
      <ChangeList changes={changes} />
    </div>
  );
}

/** What blocks the publish, and what only warns. Nothing without checks. */
export function PublishDialogChecks({
  className,
  ...rest
}: Omit<ComponentProps<"div">, "children">) {
  const { checks } = usePublishDialog("PublishDialogChecks");
  if (checks.length === 0) return null;
  return (
    <div data-slot="publish-dialog-checks" {...rest} className={className}>
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
    </div>
  );
}

/** Under the checks: what runs the steps. Nothing without the root's `note`. */
export function PublishDialogNote({ className, children, ...rest }: ComponentProps<"p">) {
  const { note } = usePublishDialog("PublishDialogNote");
  const content = children ?? note;
  if (!content) return null;
  return (
    <p data-slot="publish-dialog-note" {...rest} className={cx("fg-pubdlg-note", className)}>
      {content}
    </p>
  );
}

/** When it takes effect, Cancel and `Publish v4` (off while a check blocks). */
export function PublishDialogFooter({ className, children, ...rest }: ComponentProps<"div">) {
  const { version, active, blocked, go, onClose } = usePublishDialog("PublishDialogFooter");
  return (
    <DialogFooter data-slot="publish-dialog-footer" {...rest} className={className}>
      {children ?? (
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
      )}
    </DialogFooter>
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

type Chosen = number | "draft";

interface VersionHistoryContext {
  versions: ReadonlyArray<AutomationVersion>;
  draft: ReadonlyArray<VersionChange> | undefined;
  live: number | undefined;
  chosen: Chosen;
  choose: (chosen: Chosen) => void;
  collection: ReturnType<typeof useCollection>;
  onRestore: ((version: number) => void) | undefined;
  onPublish: (() => void) | undefined;
  onDiscard: (() => void) | undefined;
}

const HistoryCtx = createContext<VersionHistoryContext | null>(null);

/** The history a part is in: the versions, the one chosen, what can be done to it. */
export function useVersionHistory(part = "useVersionHistory"): VersionHistoryContext {
  const ctx = useContext(HistoryCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <VersionHistory>.`);
  return ctx;
}

export interface VersionHistoryProps extends Omit<ComponentProps<"div">, "className" | "onSelect"> {
  /** Newest first. */
  versions: ReadonlyArray<AutomationVersion>;
  /** The changes not published yet: a Draft entry on top. */
  draft?: ReadonlyArray<VersionChange>;
  /** The version the triggers run. */
  live?: number;
  /** `draft` or a version number. */
  selected?: Chosen;
  defaultSelected?: Chosen;
  onSelect?: (selected: Chosen) => void;
  /** Restore as draft: the version's steps replace the draft. */
  onRestore?: (version: number) => void;
  /** Publish, on the draft. */
  onPublish?: () => void;
  /** Discard the draft. */
  onDiscard?: () => void;
  className?: string;
  asChild?: boolean;
  /** The parts. Without them: the list and the detail. */
  children?: ReactNode;
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
  asChild,
  children,
  ...rest
}: VersionHistoryProps) {
  const first: Chosen = draft?.length ? "draft" : (versions[0]?.version ?? "draft");
  const [chosen, choose] = useControllableState<Chosen>({
    value: selected,
    defaultValue: defaultSelected ?? first,
    onChange: onSelect,
  });
  const rows = [...(draft?.length ? ["draft"] : []), ...versions.map((v) => String(v.version))];
  // The rows are one list for the keyboard: the arrows move the choice.
  const collection = useCollection({
    items: rows,
    getId: (id) => id,
    selected: [String(chosen)],
    onSelectedChange: ([id]) => id !== undefined && choose(id === "draft" ? "draft" : Number(id)),
    clearOnEscape: false,
  });
  const ctx: VersionHistoryContext = {
    versions,
    draft,
    live,
    chosen,
    choose,
    collection,
    onRestore,
    onPublish,
    onDiscard,
  };
  return (
    <HistoryCtx.Provider value={ctx}>
      {renderPart("div", cx("fg-versions", className), asChild, {
        "data-slot": "version-history",
        ...rest,
        children: children ?? (
          <>
            <VersionHistoryList />
            <VersionHistoryDetail />
          </>
        ),
      })}
    </HistoryCtx.Provider>
  );
}

/** The versions, the draft on top. It holds the keyboard of the list. */
export function VersionHistoryList({ className, children, ...rest }: ComponentProps<"ol">) {
  const { versions, draft, collection } = useVersionHistory("VersionHistoryList");
  return (
    <ol
      data-slot="version-history-list"
      aria-label="Versions"
      {...rest}
      {...collection.getContainerProps()}
      className={cx("fg-versions-list", className)}
    >
      {children ?? (
        <>
          {draft?.length ? <VersionHistoryRow value="draft" /> : null}
          {versions.map((v) => (
            <VersionHistoryRow key={v.version} value={v.version} />
          ))}
        </>
      )}
    </ol>
  );
}

export interface VersionHistoryRowProps extends Omit<ComponentProps<"button">, "value"> {
  /** `draft` or a version number. */
  value: Chosen;
}

/** One entry: a button of the list that chooses it. */
export function VersionHistoryRow({
  value,
  className,
  children,
  onClick,
  ...rest
}: VersionHistoryRowProps) {
  const { versions, draft, live, chosen, choose, collection } =
    useVersionHistory("VersionHistoryRow");
  const version = value === "draft" ? undefined : versions.find((v) => v.version === value);
  return (
    <li>
      <button
        type="button"
        data-slot="version-history-row"
        {...rest}
        {...collection.getItemProps(String(value))}
        className={cx("fg-versions-row", className)}
        aria-current={chosen === value ? "true" : undefined}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) choose(value);
        }}
      >
        {children ??
          (value === "draft" ? (
            <>
              <span className="fg-versions-num">Draft</span>
              <span className="fg-versions-msg">{`${draft?.length ?? 0} change${draft?.length === 1 ? "" : "s"}`}</span>
              <Led tone="warning" />
            </>
          ) : version ? (
            <>
              <span className="fg-versions-num">v{version.version}</span>
              <span className="fg-versions-msg">{version.message}</span>
              {live === version.version ? <Badge tone="success">Live</Badge> : null}
              <span className="fg-versions-at">{version.at.slice(0, 10)}</span>
            </>
          ) : null)}
      </button>
    </li>
  );
}

/** What the version chosen says: its changes, who published it, and what can be done with it. */
export function VersionHistoryDetail({ className, children, ...rest }: ComponentProps<"div">) {
  const { versions, draft, live, chosen, onRestore, onPublish, onDiscard } =
    useVersionHistory("VersionHistoryDetail");
  const version = chosen === "draft" ? undefined : versions.find((v) => v.version === chosen);
  return (
    <div
      data-slot="version-history-detail"
      {...rest}
      className={cx("fg-versions-detail", className)}
    >
      {children ??
        (chosen === "draft" ? (
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
        ))}
    </div>
  );
}
