// People with an access, each with a role (D-157): the list that drive sharing, an invitation or a
// participant panel all draw. Parts in shadcn's shape, on the Select and Combobox parts:
// `AccessList` > `AccessListItem` (avatar, name, a line under it, then your controls) with
// `AccessListRole` (a select of roles, the chip) and `AccessListRemove`; `PeopleCombobox` adds
// someone from a directory. They hold no state: the caller owns who has which role.

import { Cancel01Icon } from "@forgeron/icons";
import type {
  ComponentProps,
  HTMLAttributes,
  LiHTMLAttributes,
  ReactElement,
  ReactNode,
} from "react";
import { cloneElement, isValidElement, useRef, useState } from "react";
import { Avatar } from "./avatar";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./combobox";
import { cx } from "./cx";
import { Icon } from "./icon";
import type { Person } from "./pickers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

type Part<T> = Omit<T, "className"> & { className?: string };

/** The list of people: give it an `aria-label`. */
export function AccessList({ className, ...rest }: HTMLAttributes<HTMLUListElement>) {
  return <ul data-slot="access-list" {...rest} className={cx("fg-access", className)} />;
}

export interface AccessListItemProps extends Omit<LiHTMLAttributes<HTMLLIElement>, "children"> {
  name: string;
  /** A picture, else the initials. */
  src?: string;
  /** A line under the name: a team, an e-mail. */
  secondary?: ReactNode;
  /** The avatar's size. Default 28. */
  size?: number;
  /** The end of the row: `AccessListRole`, `AccessListRemove`, `AccessListFixed`. */
  children?: ReactNode;
}

/** One person: avatar, name, the line under it, then whatever you put at the end. */
export function AccessListItem({
  name,
  src,
  secondary,
  size = 28,
  className,
  children,
  ...rest
}: AccessListItemProps) {
  return (
    <li data-slot="access-list-item" {...rest} className={cx("fg-access-item", className)}>
      <Avatar name={name} size={size} {...(src ? { src } : {})} />
      <div className="fg-access-who">
        <b>{name}</b>
        {secondary ? <span>{secondary}</span> : null}
      </div>
      {children}
    </li>
  );
}

/** A role that cannot be changed here (inherited, the owner): mono text at the end of a row. */
export function AccessListFixed({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span data-slot="access-list-fixed" {...rest} className={cx("fg-access-fixed", className)} />
  );
}

/** Says so when nobody is listed. */
export function AccessListEmpty({ className, ...rest }: LiHTMLAttributes<HTMLLIElement>) {
  return (
    <li data-slot="access-list-empty" {...rest} className={cx("fg-access-empty", className)} />
  );
}

export interface AccessRole {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AccessListRoleProps {
  /** Names the control for assistive technology: "Role of Nadia". */
  label: string;
  roles: ReadonlyArray<AccessRole>;
  value?: string;
  defaultValue?: string;
  onValueChange?: (role: string) => void;
  /** Adds a last choice that removes the person (see `removeLabel`) and calls this. */
  onRemove?: () => void;
  /** The wording of that choice. Default “Remove access”. */
  removeLabel?: string;
  disabled?: boolean;
  variant?: "chip" | "field";
  className?: string;
}

const REMOVE = "\u0000remove";

/** A person's role: a select of `roles`, drawn as a chip; `onRemove` adds “Remove access”. */
export function AccessListRole({
  label,
  roles,
  value,
  defaultValue,
  onValueChange,
  onRemove,
  removeLabel = "Remove access",
  disabled,
  variant = "chip",
  className,
}: AccessListRoleProps) {
  const choices: AccessRole[] = onRemove
    ? [...roles, { value: REMOVE, label: removeLabel }]
    : [...roles];
  const items = choices.map((r) => ({ value: r.value, label: r.label }));
  return (
    <Select
      items={items}
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      disabled={disabled}
      onValueChange={(next) => {
        if (typeof next !== "string") return;
        if (next === REMOVE) onRemove?.();
        else onValueChange?.(next);
      }}
    >
      <SelectTrigger
        variant={variant}
        size="sm"
        aria-label={label}
        className={cx("fg-access-role", className)}
      >
        <SelectValue>
          {(current: string | null) => choices.find((r) => r.value === current)?.label ?? current}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {choices.map((r) => (
          <SelectItem
            key={r.value}
            value={r.value}
            {...(r.disabled ? { disabled: true } : {})}
            className={r.value === REMOVE ? "fg-access-remove-row" : undefined}
          >
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export type AccessListRemoveProps = Part<ComponentProps<"button">> & { asChild?: boolean };

/** The button that takes a person off the list; `aria-label` names it (“Remove Nadia”). */
export function AccessListRemove({ asChild, className, children, ...rest }: AccessListRemoveProps) {
  const classes = cx("fg-access-remove", className);
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      "data-slot": "access-list-remove",
      ...rest,
      ...child.props,
      className: cx(classes, child.props.className),
    } as Record<string, unknown>);
  }
  return (
    <button type="button" data-slot="access-list-remove" {...rest} className={classes}>
      {children ?? <Icon icon={Cancel01Icon} size={12} variant="mono" />}
    </button>
  );
}

export interface PeopleComboboxProps {
  /** Who can be added: leave out those already listed. */
  people: ReadonlyArray<Person>;
  /** Hears the person chosen; the text typed is cleared. */
  onAdd: (person: Person) => void;
  /** Names the field for assistive technology. */
  label?: string;
  placeholder?: string;
  /** Shown when nobody matches. */
  emptyText?: string;
  disabled?: boolean;
  /** On the framed field. */
  className?: string;
  id?: string;
}

const matches = (person: Person, query: string) => {
  const q = query.trim().toLocaleLowerCase();
  return (
    q === "" ||
    person.name.toLocaleLowerCase().includes(q) ||
    (person.hint ?? "").toLocaleLowerCase().includes(q)
  );
};

/** A search box that adds people from a directory, on the Combobox parts. Enter takes the first. */
export function PeopleCombobox({
  people,
  onAdd,
  label = "Add people",
  placeholder,
  emptyText = "No match",
  disabled,
  className,
  id,
}: PeopleComboboxProps) {
  const [query, setQuery] = useState("");
  const picked = useRef(false);
  const root = {
    items: people,
    value: null,
    inputValue: query,
    autoHighlight: true,
    disabled,
    filter: matches,
    itemToStringLabel: (p: Person | null) => p?.name ?? "",
    isItemEqualToValue: (a: Person, b: Person) => a.id === b.id,
    onValueChange: (next: Person | null) => {
      if (!next) return;
      picked.current = true;
      setQuery("");
      onAdd(next);
    },
    onInputValueChange: (text: string) => {
      // Choosing a row writes its name in the box: the box is cleared instead.
      if (picked.current) {
        picked.current = false;
        setQuery("");
      } else setQuery(text);
    },
  } as unknown as ComponentProps<typeof Combobox>;
  return (
    <Combobox {...root}>
      <ComboboxInput
        {...(id ? { id } : {})}
        aria-label={label}
        placeholder={placeholder}
        showTrigger={false}
        autoComplete="off"
        groupClassName={className}
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(person: Person) => (
            <ComboboxItem
              key={person.id}
              value={person}
              indicator={false}
              glyph={
                <Avatar name={person.name} size={20} {...(person.src ? { src: person.src } : {})} />
              }
              hint={person.hint}
            >
              {person.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
