// The fields of a table, as a list: the type glyph, the name in mono, the type in words, the
// rules as chips. Rows reorder by dragging their handle or with Alt + arrows; a click or Enter
// opens the field, the ⋯ holds its actions.

import { GripIcon, Key01Icon, MoreHorizontalIcon, PlusSignIcon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useState } from "react";
import { Button } from "../button";
import { cx } from "../cx";
import { ConstraintChip } from "../data-grid";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import { useControllableState } from "../hooks/use-controllable";
import { useSortable } from "../sortable";
import { ActionMenu, type ActionMenuEntry } from "../action-menu";
import { FieldTypeGlyph } from "./datahub-field-type";
import { fieldTypeInfo, type DataField } from "./datahub-model";

export interface SchemaFieldsProps {
  /** The fields in order. Controlled or not. */
  fields?: ReadonlyArray<DataField>;
  defaultFields?: ReadonlyArray<DataField>;
  /** The fields in their new order, after a drag or Alt + arrow. Absent: no reordering. */
  onReorder?: (fields: DataField[]) => void;
  /** A click or Enter on a field. */
  onOpen?: (id: string) => void;
  /** The field shown as open. */
  selected?: string | null;
  /** Adds an "Add a field" row at the end. */
  onAdd?: () => void;
  /** The actions of a field: the ⋯ shown on hover, or Shift+F10. */
  fieldMenu?: (field: DataField) => ReadonlyArray<ActionMenuEntry>;
  onFieldAction?: (id: string, actionId: string) => void;
  /** Writes each field's description under its name. */
  showDescriptions?: boolean;
  /** Names the list for assistive technology. */
  label?: string;
  empty?: ReactNode;
  className?: string;
}

const typeWords = (field: DataField) =>
  field.type === "relation" && field.relation
    ? `${field.relation.multiple ? "relations" : "relation"} → ${field.relation.table}`
    : fieldTypeInfo(field.type).label;

/** The fields of a table: glyph, name, type, rules; drag or Alt + arrows to reorder. */
export function SchemaFields({
  fields: fieldsProp,
  defaultFields = [],
  onReorder,
  onOpen,
  selected,
  onAdd,
  fieldMenu,
  onFieldAction,
  showDescriptions = false,
  label = "Fields",
  empty = "No field yet",
  className,
}: SchemaFieldsProps) {
  const [fields, setFields] = useControllableState<ReadonlyArray<DataField>>({
    value: fieldsProp,
    defaultValue: defaultFields,
    onChange: onReorder ? (next) => onReorder([...next]) : undefined,
  });
  const [menuFor, setMenuFor] = useState<string | null>(null);
  // The primary key stays first: it is where tables keep it and what every other row points at.
  const movable = (field: DataField) => Boolean(onReorder) && !field.primary;
  const firstMovable = fields.findIndex((f) => !f.primary);
  const sortable = useSortable({
    items: fields,
    getId: (f) => f.id,
    getLabel: (f) => f.name,
    onReorder: (next) => setFields(next),
    announce: (move, field, count) => `${field.name}, position ${move.to + 1} of ${count}`,
    label,
    handle: true,
    navigate: true,
    focusSelector: ".fg-dh-sf-main",
    range: [Math.max(firstMovable, 0), fields.length - 1],
    disabled: (id) => !movable(fields.find((f) => f.id === id)!),
    canDrop: (_dragged, overId) => movable(fields.find((f) => f.id === overId)!),
  });

  const onKeyDown = (field: DataField, event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "F10" && event.shiftKey && fieldMenu) {
      event.preventDefault();
      setMenuFor(field.id);
    }
  };

  return (
    <div className={cx("fg-dh-sf", className)}>
      {fields.length === 0 ? <p className="fg-dh-sf-empty">{empty}</p> : null}
      <ul {...sortable.getListProps({ className: "fg-dh-sf-list" })}>
        {fields.map((field) => {
          const menu = fieldMenu?.(field);
          return (
            <li
              key={field.id}
              data-field={field.id}
              {...sortable.getItemProps(field.id, {
                className: cx(
                  "fg-dh-sf-row",
                  selected === field.id && "fg-dh-sf-current",
                  sortable.getItemState(field.id).dragging && "fg-dh-sf-dragging",
                  sortable.getItemState(field.id).over && "fg-dh-sf-over",
                ),
              })}
            >
              {onReorder ? (
                <span
                  {...sortable.getHandleProps(field.id)}
                  className={cx("fg-dh-sf-grip", !movable(field) && "fg-dh-sf-fixed")}
                  title={movable(field) ? "Drag to reorder, or Alt + arrows" : undefined}
                >
                  {movable(field) ? <Icon icon={GripIcon} size={12} variant="mono" /> : null}
                </span>
              ) : null}
              <button
                type="button"
                className="fg-dh-sf-main"
                aria-current={selected === field.id ? "true" : undefined}
                aria-keyshortcuts={movable(field) ? "Alt+ArrowUp Alt+ArrowDown" : undefined}
                onClick={onOpen ? () => onOpen(field.id) : undefined}
                onKeyDown={(event) => onKeyDown(field, event)}
                onContextMenu={
                  menu
                    ? (event) => {
                        event.preventDefault();
                        setMenuFor(field.id);
                      }
                    : undefined
                }
              >
                <span className="fg-dh-sf-glyph">
                  {field.primary ? (
                    <Icon icon={Key01Icon} size={12} variant="mono" title="Primary key" />
                  ) : (
                    <FieldTypeGlyph type={field.type} />
                  )}
                </span>
                <span className="fg-dh-sf-text">
                  <span className="fg-dh-sf-name">{field.name}</span>
                  {showDescriptions && field.description ? (
                    <span className="fg-dh-sf-desc">{field.description}</span>
                  ) : null}
                </span>
                <span className="fg-dh-sf-type">{typeWords(field)}</span>
                <span className="fg-dh-sf-chips">
                  {field.primary ? <ConstraintChip kind="primary" /> : null}
                  {field.required && !field.primary ? <ConstraintChip kind="notNull" /> : null}
                  {field.unique && !field.primary ? <ConstraintChip kind="unique" /> : null}
                  {field.type === "relation" && field.relation ? (
                    <ConstraintChip kind="foreignKey" title={field.relation.table} />
                  ) : null}
                </span>
              </button>
              {menu && menu.length ? (
                <ActionMenu
                  label={`Actions of ${field.name}`}
                  items={menu}
                  open={menuFor === field.id}
                  onOpenChange={(open) => setMenuFor(open ? field.id : null)}
                  onSelect={(actionId) => onFieldAction?.(field.id, actionId)}
                  align="end"
                  trigger={
                    <IconButton
                      icon={MoreHorizontalIcon}
                      size="sm"
                      label={`Actions of ${field.name}`}
                      className="fg-dh-sf-more"
                    />
                  }
                />
              ) : null}
            </li>
          );
        })}
      </ul>
      {onAdd ? (
        <Button variant="ghost" size="sm" className="fg-dh-sf-add" onClick={onAdd}>
          <Icon icon={PlusSignIcon} size={12} variant="mono" />
          Add a field
        </Button>
      ) : null}
      <span className="fg-sr" aria-live="polite">
        {sortable.status}
      </span>
    </div>
  );
}
