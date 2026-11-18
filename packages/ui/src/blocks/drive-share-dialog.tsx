// Sharing a file or a folder: people and teams added from a list with their role, the access
// they inherit from a parent, how far it is open in general (restricted, the organisation, anyone
// with the link) and the link's settings (expiry, password, download). `SharePanel` is the
// content, to place in a drawer or a page; `ShareDialog` puts it in a modal.

import type { IconDefinition } from "@forgeron/icons";
import { Building01Icon, Copy01Icon, GlobeIcon, Link01Icon, LockIcon } from "@forgeron/icons";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Avatar } from "../avatar";
import { Button } from "../button";
import { Switch } from "../controls";
import { cx } from "../cx";
import { Dialog } from "../dialog";
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

const REMOVE = "\u0000remove";
const SCOPE_ICON: Record<AccessScope, IconDefinition> = {
  restricted: LockIcon,
  organization: Building01Icon,
  link: GlobeIcon,
};

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
  className,
}: SharePanelProps) {
  const [settings, setSettings] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [newRole, setNewRole] = useState(defaultRole ?? roles[roles.length - 1]?.value ?? "viewer");
  const id = useId();
  const byId = new Map(directory.map((p) => [p.id, p]));
  const roleLabel = (r: string) => roles.find((o) => o.value === r)?.label ?? r;

  const taken = new Set([
    ...settings.people.map((g) => g.id),
    ...inherited.map((g) => g.person.id),
  ]);
  const q = query.trim().toLowerCase();
  const matches = directory.filter(
    (p) =>
      !taken.has(p.id) &&
      (!q || p.name.toLowerCase().includes(q) || (p.hint ?? "").toLowerCase().includes(q)),
  );
  const at = Math.min(active, Math.max(matches.length - 1, 0));

  const update = (patch: Partial<ShareSettings>) => setSettings({ ...settings, ...patch });
  const add = (person: SharePerson) => {
    update({ people: [...settings.people, { id: person.id, role: newRole }] });
    setQuery("");
    setActive(0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      setListOpen(true);
      setActive(Math.min(at + 1, matches.length - 1));
    } else if (event.key === "ArrowUp") setActive(Math.max(at - 1, 0));
    else if (event.key === "Enter" && listOpen && matches[at]) add(matches[at]);
    else if (event.key === "Escape" && listOpen) {
      event.stopPropagation();
      setListOpen(false);
    } else return;
    event.preventDefault();
  };

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
    <div className={cx("fg-share", className)}>
      <div className="fg-share-add">
        <div className="fg-share-combo">
          <Input
            role="combobox"
            aria-label="Add people or teams"
            aria-expanded={listOpen}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            {...(listOpen && matches[at]
              ? { "aria-activedescendant": `${id}-${matches[at].id}` }
              : {})}
            placeholder="Add people or teams"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setListOpen(true);
            }}
            onFocus={() => setListOpen(true)}
            onBlur={() => setListOpen(false)}
            onKeyDown={onKeyDown}
          />
          {listOpen ? (
            <ul
              className="fg-share-list fg-pop"
              id={`${id}-list`}
              role="listbox"
              aria-label="People and teams"
            >
              {matches.length === 0 ? (
                <li className="fg-share-none" role="presentation">
                  No match
                </li>
              ) : (
                matches.map((p, i) => (
                  <li
                    key={p.id}
                    id={`${id}-${p.id}`}
                    role="option"
                    aria-selected={i === at}
                    className="fg-pop-row fg-share-option"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      add(p);
                    }}
                    onMouseEnter={() => setActive(i)}
                  >
                    <Avatar name={p.name} size={20} />
                    <span className="fg-pop-label">{p.name}</span>
                    {p.hint ? <span className="fg-pop-hint">{p.hint}</span> : null}
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
        <SelectMenu
          label="Role for the people added"
          options={roles}
          value={newRole}
          onChange={(v) => v && setNewRole(v)}
          className="fg-share-role"
        />
      </div>

      <section className="fg-share-section" aria-labelledby={`${id}-people`}>
        <h3 className="fg-share-eyebrow" id={`${id}-people`}>
          People with access
        </h3>
        <ul className="fg-share-people">
          {inherited.map((g) => (
            <li key={`i-${g.person.id}`} className="fg-share-person">
              <Avatar name={g.person.name} size={28} />
              <div className="fg-share-who">
                <b>{g.person.name}</b>
                {g.person.hint ? <span>{g.person.hint}</span> : null}
              </div>
              <span className="fg-share-fixed">
                {g.role}
                {g.from ? ` · ${g.from}` : ""}
              </span>
            </li>
          ))}
          {settings.people.map((g, i) => {
            const p = byId.get(g.id) ?? { id: g.id, name: g.id };
            return (
              <li key={g.id} className="fg-share-person">
                <Avatar name={p.name} size={28} />
                <div className="fg-share-who">
                  <b>{p.name}</b>
                  {p.hint ? <span>{p.hint}</span> : null}
                </div>
                <SelectMenu
                  label={`Role of ${p.name}`}
                  size="sm"
                  options={[...roles, { value: REMOVE, label: "Remove access" }]}
                  value={g.role}
                  onChange={(v) => {
                    if (!v) return;
                    update({
                      people:
                        v === REMOVE
                          ? settings.people.filter((_, j) => j !== i)
                          : settings.people.map((x, j) => (j === i ? { ...x, role: v } : x)),
                    });
                  }}
                />
              </li>
            );
          })}
          {inherited.length === 0 && settings.people.length === 0 ? (
            <li className="fg-share-empty">Only you</li>
          ) : null}
        </ul>
      </section>

      <section className="fg-share-section" aria-labelledby={`${id}-general`}>
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
        {settings.general === "link" ? (
          <dl className="fg-share-link">
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
        ) : null}
      </section>
      <span className="fg-sr" aria-live="polite">
        {settings.people.length > 0
          ? `${settings.people.length} ${settings.people.length === 1 ? "person" : "people"} added, ${roleLabel(newRole)} by default`
          : ""}
      </span>
    </div>
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

/** Sharing in a modal: the panel, a "Copy link" at the foot left and Done. Render it only while open. */
export function ShareDialog({
  itemName,
  onClose,
  onDone,
  description,
  value,
  defaultValue = DEFAULT_SHARE,
  onChange,
  onCopyLink,
  ...panel
}: ShareDialogProps) {
  const [settings, setSettings] = useControllableState({ value, defaultValue, onChange });
  return (
    <Dialog
      title={`Share “${itemName}”`}
      description={description}
      onClose={onClose}
      className="fg-share-dialog"
      footer={
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
      }
    >
      <PortalEscape>
        <SharePanel
          {...panel}
          value={settings}
          onChange={setSettings}
          {...(onCopyLink ? { onCopyLink } : {})}
        />
      </PortalEscape>
    </Dialog>
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
