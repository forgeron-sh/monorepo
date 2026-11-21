// Sharing a file or a folder: people and teams added from a list with their role, the access
// they inherit from a parent, how far it is open in general (restricted, the organisation, anyone
// with the link) and the link's settings (expiry, password, download). `SharePanel` is the
// content, to place in a drawer or a page; `ShareDialog` puts it in a modal.
//
// Roots with parts. `SharePanel` (`SharePanelAdd`, `SharePanelPeople`, `SharePanelGeneral`,
// `SharePanelLink`) and `ShareDialog` (`ShareDialogHeader`, `ShareDialogPanel`,
// `ShareDialogFooter`). Without children each draws all its regions; with children they are yours.

import type { IconDefinition } from "@forgeron/icons";
import { Building01Icon, Copy01Icon, GlobeIcon, Link01Icon, LockIcon } from "@forgeron/icons";
import {
  createContext,
  useContext,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  AccessList,
  AccessListEmpty,
  AccessListFixed,
  AccessListItem,
  AccessListRole,
  PeopleCombobox,
} from "../access-list";
import { Button } from "../button";
import { Switch } from "../controls";
import { cx } from "../cx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { Input } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { SelectMenu, type SelectMenuOption } from "../overlays";
import type { AccessScope } from "./drive-file-details";

export interface SharePerson {
  id: string;
  name: string;
  /** A line under the name: a team, an email, the members of a team. */
  hint?: string;
}

export interface ShareGrant {
  /** The id of a `SharePerson`. */
  id: string;
  role: string;
}

/** Access a person has from a parent folder or a team: shown, not changed here. */
export interface InheritedGrant {
  person: SharePerson;
  /** The role's label, or "Owner". */
  role: string;
  /** Where it comes from: "Sales team drive". */
  from?: string;
}

export interface LinkSettings {
  /** A value of `expiryOptions`. */
  expires: string;
  password: boolean;
  /** Off: preview only. */
  download: boolean;
}

export interface ShareSettings {
  people: ReadonlyArray<ShareGrant>;
  general: AccessScope;
  /** The role of the organisation or of the link. */
  generalRole: string;
  link: LinkSettings;
}

export interface SharePanelProps {
  /** Who can be added: the people and teams of the organisation. */
  directory: ReadonlyArray<SharePerson>;
  value?: ShareSettings;
  defaultValue?: ShareSettings;
  onChange?: (settings: ShareSettings) => void;
  /** The roles, least first; viewer, commenter, editor by default. */
  roles?: ReadonlyArray<SelectMenuOption>;
  /** The role a person gets when added; the last role by default. */
  defaultRole?: string;
  /** Fixed rows above the people added: the owner, the access from a parent. */
  inherited?: ReadonlyArray<InheritedGrant>;
  /** The name of the organisation, for "Anyone at …"; without it, that choice is not offered. */
  organization?: string;
  /** Offers "Anyone with the link"; true by default. */
  allowLink?: boolean;
  /** The address of the share link, shown with a copy button when the link is open. */
  linkUrl?: string;
  onCopyLink?: () => void;
  /** The choices of expiry; never, 1, 7, 30 days by default. */
  expiryOptions?: ReadonlyArray<SelectMenuOption>;
  /** The password typed when the link asks for one; it is not kept in the settings. */
  onPasswordChange?: (password: string) => void;
  /** The regions of the panel; without them, the four sections. */
  children?: ReactNode;
  className?: string;
}

export const SHARE_ROLES: ReadonlyArray<SelectMenuOption> = [
  { value: "viewer", label: "Viewer" },
  { value: "commenter", label: "Commenter" },
  { value: "editor", label: "Editor" },
];

const EXPIRY: ReadonlyArray<SelectMenuOption> = [
  { value: "never", label: "Never" },
  { value: "1", label: "In 1 day" },
  { value: "7", label: "In 7 days" },
  { value: "30", label: "In 30 days" },
];

export const DEFAULT_SHARE: ShareSettings = {
  people: [],
  general: "restricted",
  generalRole: "viewer",
  link: { expires: "never", password: false, download: true },
};

const SCOPE_ICON: Record<AccessScope, IconDefinition> = {
  restricted: LockIcon,
  organization: Building01Icon,
  link: GlobeIcon,
};

interface PanelContext {
  directory: ReadonlyArray<SharePerson>;
  settings: ShareSettings;
  update: (patch: Partial<ShareSettings>) => void;
  roles: ReadonlyArray<SelectMenuOption>;
  newRole: string;
  setNewRole: (role: string) => void;
  inherited: ReadonlyArray<InheritedGrant>;
  organization: string | undefined;
  allowLink: boolean;
  linkUrl: string | undefined;
  onCopyLink: (() => void) | undefined;
  expiryOptions: ReadonlyArray<SelectMenuOption>;
  onPasswordChange: ((password: string) => void) | undefined;
  id: string;
}

const PanelCtx = createContext<PanelContext | null>(null);

/** The settings and the directory of the enclosing `SharePanel`. */
export function useSharePanel(part = "useSharePanel"): PanelContext {
  const ctx = useContext(PanelCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <SharePanel>.`);
  return ctx;
}

/** Who has access and how far it is open, for one file or folder. */
export function SharePanel({
  directory,
  value,
  defaultValue = DEFAULT_SHARE,
  onChange,
  roles = SHARE_ROLES,
  defaultRole,
  inherited = [],
  organization,
  allowLink = true,
  linkUrl,
  onCopyLink,
  expiryOptions = EXPIRY,
  onPasswordChange,
  children,
  className,
}: SharePanelProps) {
  const [settings, setSettings] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const [newRole, setNewRole] = useState(defaultRole ?? roles[roles.length - 1]?.value ?? "viewer");
  const id = useId();
  const update = (patch: Partial<ShareSettings>) => setSettings({ ...settings, ...patch });
  const roleLabel = (r: string) => roles.find((o) => o.value === r)?.label ?? r;
  return (
    <PanelCtx.Provider
      value={{
        directory,
        settings,
        update,
        roles,
        newRole,
        setNewRole,
        inherited,
        organization,
        allowLink,
        linkUrl,
        onCopyLink,
        expiryOptions,
        onPasswordChange,
        id,
      }}
    >
      <div data-slot="share-panel" className={cx("fg-share", className)}>
        {children ?? (
          <>
            <SharePanelAdd />
            <SharePanelPeople />
            <SharePanelGeneral>
              <SharePanelLink />
            </SharePanelGeneral>
          </>
        )}
        <span className="fg-sr" aria-live="polite">
          {settings.people.length > 0
            ? `${settings.people.length} ${settings.people.length === 1 ? "person" : "people"} added, ${roleLabel(newRole)} by default`
            : ""}
        </span>
      </div>
    </PanelCtx.Provider>
  );
}

/** The field that adds people or teams from the directory, and the role they get. */
export function SharePanelAdd({ className, ...rest }: ComponentProps<"div">) {
  const { directory, settings, inherited, roles, newRole, setNewRole, update } =
    useSharePanel("SharePanelAdd");
  const taken = new Set([
    ...settings.people.map((g) => g.id),
    ...inherited.map((g) => g.person.id),
  ]);
  const candidates = directory.filter((p) => !taken.has(p.id));
  return (
    <div data-slot="share-panel-add" {...rest} className={cx("fg-share-add", className)}>
      <PeopleCombobox
        label="Add people or teams"
        placeholder="Add people or teams"
        people={candidates}
        onAdd={(person) =>
          update({ people: [...settings.people, { id: person.id, role: newRole }] })
        }
        className="fg-share-combo"
      />
      <SelectMenu
        label="Role for the people added"
        options={roles}
        value={newRole}
        onChange={(v) => v && setNewRole(v)}
        className="fg-share-role"
      />
    </div>
  );
}

/** The people with access: the inherited rows, then the ones added, each with a role. */
export function SharePanelPeople({ className, ...rest }: ComponentProps<"section">) {
  const { id, directory, settings, inherited, roles, update } = useSharePanel("SharePanelPeople");
  const byId = new Map(directory.map((p) => [p.id, p]));
  return (
    <section
      data-slot="share-panel-people"
      aria-labelledby={`${id}-people`}
      {...rest}
      className={cx("fg-share-section", className)}
    >
      <h3 className="fg-share-eyebrow" id={`${id}-people`}>
        People with access
      </h3>
      <AccessList aria-label="People with access">
        {inherited.map((g) => (
          <AccessListItem key={`i-${g.person.id}`} name={g.person.name} secondary={g.person.hint}>
            <AccessListFixed>
              {g.role}
              {g.from ? ` · ${g.from}` : ""}
            </AccessListFixed>
          </AccessListItem>
        ))}
        {settings.people.map((g, i) => {
          const p = byId.get(g.id) ?? { id: g.id, name: g.id };
          return (
            <AccessListItem key={g.id} name={p.name} secondary={p.hint}>
              <AccessListRole
                label={`Role of ${p.name}`}
                roles={roles}
                value={g.role}
                onValueChange={(role) =>
                  update({
                    people: settings.people.map((x, j) => (j === i ? { ...x, role } : x)),
                  })
                }
                onRemove={() => update({ people: settings.people.filter((_, j) => j !== i) })}
              />
            </AccessListItem>
          );
        })}
        {inherited.length === 0 && settings.people.length === 0 ? (
          <AccessListEmpty>Only you</AccessListEmpty>
        ) : null}
      </AccessList>
    </section>
  );
}

/** How far it is open: restricted, the organisation or anyone with the link; children come after. */
export function SharePanelGeneral({ className, children, ...rest }: ComponentProps<"section">) {
  const { id, settings, update, roles, organization, allowLink } =
    useSharePanel("SharePanelGeneral");
  const scopes: SelectMenuOption[] = [
    { value: "restricted", label: "Restricted", icon: LockIcon },
    ...(organization
      ? [{ value: "organization", label: `Anyone at ${organization}`, icon: Building01Icon }]
      : []),
    ...(allowLink ? [{ value: "link", label: "Anyone with the link", icon: GlobeIcon }] : []),
  ];
  const scopeText =
    settings.general === "restricted"
      ? "Only the people with access can open it"
      : settings.general === "organization"
        ? `Anyone signed in to ${organization ?? "the organisation"} can find and open it`
        : "Anyone with the link, no sign-in";
  const open = settings.general !== "restricted";
  return (
    <section
      data-slot="share-panel-general"
      aria-labelledby={`${id}-general`}
      {...rest}
      className={cx("fg-share-section", className)}
    >
      <h3 className="fg-share-eyebrow" id={`${id}-general`}>
        General access
      </h3>
      <div className={cx("fg-share-general", open && "fg-share-open")}>
        <span className="fg-share-scope" aria-hidden="true">
          <Icon icon={SCOPE_ICON[settings.general]} size={12} variant="mono" />
        </span>
        <div className="fg-share-general-main">
          <SelectMenu
            label="General access"
            size="sm"
            options={scopes}
            value={settings.general}
            onChange={(v) => v && update({ general: v as AccessScope })}
          />
          <span className="fg-share-hint">{scopeText}</span>
        </div>
        {open ? (
          <SelectMenu
            label="Role of everyone with access"
            size="sm"
            options={roles}
            value={settings.generalRole}
            onChange={(v) => v && update({ generalRole: v })}
          />
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** The link's address, expiry, password and download; nothing is drawn unless anyone with it can open. */
export function SharePanelLink({ className, ...rest }: ComponentProps<"dl">) {
  const { settings, update, linkUrl, onCopyLink, expiryOptions, onPasswordChange } =
    useSharePanel("SharePanelLink");
  if (settings.general !== "link") return null;
  return (
    <dl data-slot="share-panel-link" {...rest} className={cx("fg-share-link", className)}>
      {linkUrl ? (
        <>
          <dt>Link</dt>
          <dd className="fg-share-url">
            <Input
              mono
              readOnly
              value={linkUrl}
              aria-label="Share link"
              onFocus={(e) => e.currentTarget.select()}
            />
            {onCopyLink ? (
              <IconButton
                icon={Copy01Icon}
                label="Copy link"
                size="sm"
                variant="boxed"
                onClick={onCopyLink}
              />
            ) : null}
          </dd>
        </>
      ) : null}
      <dt>Expires</dt>
      <dd>
        <SelectMenu
          label="Link expiry"
          size="sm"
          options={expiryOptions}
          value={settings.link.expires}
          onChange={(v) => v && update({ link: { ...settings.link, expires: v } })}
        />
      </dd>
      <dt>Password</dt>
      <dd className="fg-share-pw">
        <Switch
          label={settings.link.password ? "On" : "Off"}
          checked={settings.link.password}
          onChange={(e) => update({ link: { ...settings.link, password: e.target.checked } })}
        />
        {settings.link.password ? (
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Set a password"
            aria-label="Link password"
            onChange={(e) => onPasswordChange?.(e.target.value)}
          />
        ) : null}
      </dd>
      <dt>Download</dt>
      <dd>
        <Switch
          label={settings.link.download ? "Allowed" : "Preview only"}
          checked={settings.link.download}
          onChange={(e) => update({ link: { ...settings.link, download: e.target.checked } })}
        />
      </dd>
    </dl>
  );
}

export interface ShareDialogProps extends SharePanelProps {
  /** The name of what is shared, written in the title. */
  itemName: string;
  /** Escape, a click outside, Done. */
  onClose: () => void;
  /** Done: the settings are final. Closes too. */
  onDone?: (settings: ShareSettings) => void;
  /** Written under the title: a note for an app's file. */
  description?: ReactNode;
}

interface DialogContext {
  itemName: string;
  description: ReactNode;
  settings: ShareSettings;
  setSettings: (settings: ShareSettings) => void;
  panel: Omit<SharePanelProps, "value" | "defaultValue" | "onChange" | "children" | "className">;
  onCopyLink: (() => void) | undefined;
  onClose: () => void;
  onDone: ((settings: ShareSettings) => void) | undefined;
}

const DialogCtx = createContext<DialogContext | null>(null);

/** The settings and handlers of the enclosing `ShareDialog`. */
export function useShareDialog(part = "useShareDialog"): DialogContext {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <ShareDialog>.`);
  return ctx;
}

/**
 * Sharing in a modal: the panel, a "Copy link" at the foot left and Done. Render it only while open.
 * With children, a shadcn dialog whose content is `ShareDialogHeader`, `ShareDialogPanel` and
 * `ShareDialogFooter`.
 */
export function ShareDialog({
  itemName,
  onClose,
  onDone,
  description,
  value,
  defaultValue = DEFAULT_SHARE,
  onChange,
  onCopyLink,
  children,
  className,
  ...panel
}: ShareDialogProps) {
  const [settings, setSettings] = useControllableState({ value, defaultValue, onChange });
  const ctx: DialogContext = {
    itemName,
    description,
    settings,
    setSettings,
    panel,
    onCopyLink,
    onClose,
    onDone,
  };
  return (
    <DialogCtx.Provider value={ctx}>
      {children !== undefined ? (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
          <DialogContent className={cx("fg-share-dialog", className)}>{children}</DialogContent>
        </Dialog>
      ) : (
        <Dialog
          title={`Share “${itemName}”`}
          description={description}
          onClose={onClose}
          className={cx("fg-share-dialog", className)}
          footer={<ShareDialogActions />}
        >
          <ShareDialogPanel />
        </Dialog>
      )}
    </DialogCtx.Provider>
  );
}

/** The title and the note under it. */
export function ShareDialogHeader({ children, ...rest }: ComponentProps<"div">) {
  const { itemName, description } = useShareDialog("ShareDialogHeader");
  return (
    <DialogHeader data-slot="share-dialog-header" {...rest}>
      {children ?? (
        <>
          <DialogTitle>{`Share “${itemName}”`}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </>
      )}
    </DialogHeader>
  );
}

/** The panel, with the dialog's settings. Children are the panel's own parts. */
export function ShareDialogPanel({ children, ...rest }: Omit<SharePanelProps, "directory">) {
  const { settings, setSettings, panel, onCopyLink } = useShareDialog("ShareDialogPanel");
  return (
    <PortalEscape>
      <SharePanel
        {...panel}
        {...rest}
        value={settings}
        onChange={setSettings}
        {...(onCopyLink ? { onCopyLink } : {})}
      >
        {children}
      </SharePanel>
    </PortalEscape>
  );
}

/** "Copy link" and Done. */
export function ShareDialogActions() {
  const { onCopyLink, onDone, onClose, settings } = useShareDialog("ShareDialogActions");
  return (
    <>
      {onCopyLink ? (
        <Button onClick={onCopyLink} className="fg-share-copy">
          <Icon icon={Link01Icon} size={12} variant="mono" />
          Copy link
        </Button>
      ) : null}
      <Button
        variant="primary"
        onClick={() => {
          onDone?.(settings);
          onClose();
        }}
      >
        Done
      </Button>
    </>
  );
}

/** The bottom row; its children replace the default buttons. */
export function ShareDialogFooter({ children, ...rest }: ComponentProps<"div">) {
  return (
    <DialogFooter data-slot="share-dialog-footer" {...rest}>
      {children ?? <ShareDialogActions />}
    </DialogFooter>
  );
}

/**
 * Escape in a popup of the panel (a role menu, in a portal) closes the popup only: React carries
 * the key up to the dialog through the portal, so it stops here.
 */
function PortalEscape({ children }: { children: ReactNode }) {
  return (
    <div
      className="fg-portal-escape"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !e.currentTarget.contains(e.target as Node)) e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}
