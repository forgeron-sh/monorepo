// Records in groups, folded or open, one dense row each, whatever the records are: the rows draw
// the fields shown (records-model), so an issue, a project and an invoice share this list. The
// arrows move between rows, Enter opens one; with `selectionMode="multiple"` a selection and its bar.

import { ArrowDown01Icon, Calendar03Icon, PlusSignIcon } from "@forgeron/icons";
import { useId, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { IconButton } from "../identity";
import {
  SelectionBar,
  SelectionBarClear,
  SelectionBarCount,
  SelectionBarSeparator,
} from "../selection-bar";
import { isMenuKey, RowMenuArea, RowMore } from "./lists-editing";
import { RecordFieldMark, hasPicker, type RecordGroup } from "./records-fields";
import {
  RecordFieldSlot,
  useRecordSurface,
  type RecordItem,
  type RecordSurfaceProps,
  type Surface,
} from "./records-surface";

/** The kinds whose cell is a list of chips: nothing is drawn when they are empty. */
const HIDE_WHEN_EMPTY: ReadonlySet<string> = new Set(["labels", "people", "relation", "file"]);

export interface RecordListProps<R extends RecordItem> extends RecordSurfaceProps<R> {
  /** The groups in order: `recordGroups(fields, records, "status")`, or `useRecordView().groups`. */
  groups: ReadonlyArray<RecordGroup<R>>;
  /** Shows a group with no record; hidden by default. */
  showEmptyGroups?: boolean;
  /** Adds a + at the end of each group's header. */
  onAdd?: (groupKey: string) => void;
  /** What a record is called, in "New issue in Todo" and in the empty message. */
  noun?: string;
  /** Shown when no group has a record. */
  empty?: ReactNode;
  /** The bar over the list while records are selected: the actions on `ids`. */
  selectionActions?: (ids: string[]) => ReactNode;
  /** Draws a row yourself; it still gets the group, the arrows and the selection. */
  renderRow?: (record: R, surface: Surface<R>) => ReactNode;
}

/** The class of the button a field's mark becomes when it can be edited. */
const slotClass = (kind: string) =>
  kind === "labels" ? "fg-issue-chips" : kind === "date" ? "fg-issue-date" : "fg-issue-hit";

/** Records in groups, one dense row each. */
export function RecordList<R extends RecordItem>({
  groups,
  showEmptyGroups = false,
  onAdd,
  noun = "record",
  empty = `No ${noun}s here yet`,
  selectionActions,
  renderRow,
  label = "Records",
  className,
  showCounts = false,
  ...props
}: RecordListProps<R>) {
  const uid = useId();
  const shown = groups.filter((g) => showEmptyGroups || g.records.length > 0);
  const surface = useRecordSurface(props, shown);
  const { collection, folded, menu, menuOpen, openMenu, attr } = surface;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!isMenuKey(event)) return;
    const row = (event.target as HTMLElement).closest<HTMLElement>(`[${attr}]`);
    if (!row) return;
    event.preventDefault();
    const id = row.getAttribute(attr)!;
    collection.select(id);
    openMenu(id);
  };

  if (!groups.some((g) => g.records.length > 0) && !showEmptyGroups) {
    return <div className={cx("fg-ilist-empty", className)}>{empty}</div>;
  }

  const list = (
    <div
      {...surface.rootProps({
        className: cx("fg-ilist", className),
        role: "region",
        "aria-label": label,
        onKeyDown,
      })}
    >
      {shown.map((group) => {
        const open = !folded.has(group.key);
        const bodyId = `${uid}-${group.key}`;
        return (
          <section key={group.key} className="fg-ilist-group" aria-label={group.name}>
            <div className="fg-ilist-head">
              <button
                type="button"
                className="fg-ilist-toggle"
                aria-expanded={open}
                aria-controls={bodyId}
                onClick={() => surface.toggle(group.key)}
              >
                <Icon
                  icon={ArrowDown01Icon}
                  size={12}
                  variant="mono"
                  className="fg-ilist-chevron"
                />
                {group.glyph}
                <span className="fg-ilist-name">{group.name}</span>
                {showCounts ? <span className="fg-ilist-count">{group.records.length}</span> : null}
              </button>
              {onAdd ? (
                <IconButton
                  icon={PlusSignIcon}
                  size="sm"
                  label={`New ${noun} in ${group.name}`}
                  onClick={() => onAdd(group.key)}
                />
              ) : null}
            </div>
            {open ? (
              <ul className="fg-ilist-rows" id={bodyId}>
                {group.records.map((record) => (
                  <li key={record.id}>
                    <RowMenuArea {...menu(record)}>
                      {renderRow ? (
                        renderRow(record, surface)
                      ) : (
                        <RecordRow
                          record={record}
                          surface={surface}
                          menuOpen={menuOpen(record.id)}
                        />
                      )}
                    </RowMenuArea>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
  if (!selectionActions || !surface.multiple) return list;
  return (
    <>
      <SelectionBar count={collection.selected.length} onClear={collection.clear}>
        <SelectionBarClear />
        <SelectionBarCount />
        <SelectionBarSeparator />
        {selectionActions(collection.selected)}
      </SelectionBar>
      {list}
    </>
  );
}

/** A row: the lead fields, the title, then the trailing fields, each one its own picker. */
export function RecordRow<R extends RecordItem>({
  record,
  surface,
  menuOpen,
}: {
  record: R;
  surface: Surface<R>;
  menuOpen: { open: boolean; onOpenChange: (open: boolean) => void };
}) {
  const { fields, context, edit, menu } = surface;
  const shown = fields.keys.filter((k) => k !== surface.titleField && surface.shows(k));
  const field = (name: string) => {
    const def = fields.def(name);
    const empty = fields.isEmpty(record, name);
    if (HIDE_WHEN_EMPTY.has(def.kind) && empty) return null;
    const mark =
      def.kind === "date" && empty && edit && hasPicker(def.kind) ? (
        <span className="fg-ilist-due fg-issue-ghost">
          <Icon icon={Calendar03Icon} size={12} variant="mono" />
          <span className="fg-sr">No {def.label.toLowerCase()}</span>
        </span>
      ) : (
        <RecordFieldMark fields={fields} name={name} record={record} context={context} view="row" />
      );
    return (
      <RecordFieldSlot
        key={name}
        surface={surface}
        record={record}
        name={name}
        className={slotClass(def.kind)}
      >
        {mark}
      </RecordFieldSlot>
    );
  };
  const place = (name: string) => fields.def(name).place?.row ?? "trail";
  const content = (
    <>
      {shown.filter((k) => place(k) === "lead").map(field)}
      <span className="fg-ilist-title">{fields.text(record, surface.titleField, context)}</span>
      <span className="fg-ilist-trail">
        {shown.filter((k) => place(k) === "trail").map(field)}
        <RowMore {...menu(record)} {...menuOpen} />
      </span>
      {shown
        .filter((k) => HIDE_WHEN_EMPTY.has(fields.def(k).kind) && fields.isEmpty(record, k))
        .map((k) => (
          <RecordFieldSlot key={k} surface={surface} record={record} name={k} unset>
            {null}
          </RecordFieldSlot>
        ))}
    </>
  );
  const props = {
    className: cx("fg-ilist-row", surface.collection.isSelected(record.id) && "fg-ilist-current"),
    ...surface.itemProps(record),
  };
  if (!surface.interactive) {
    return (
      <button type="button" {...props}>
        {content}
      </button>
    );
  }
  // The row holds the pickers' triggers: a focusable group (a button cannot hold buttons).
  return (
    <div
      {...props}
      role="group"
      aria-label={`${record.id} ${fields.text(record, surface.titleField, context)}`}
    >
      {content}
    </div>
  );
}
