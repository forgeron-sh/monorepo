// What a list and a board of records share: the current record or the selection, the folded groups,
// the properties shown, and editing in place (a field's mark becomes its picker, S P A L D open
// one, a row has a menu). The views (records-list, records-board) only lay it out.

import { createContext, useContext, type HTMLAttributes, type ReactNode } from "react";
import type { ActionMenuEntry } from "../action-menu";
import { cx } from "../cx";
import { useCollection, type Collection } from "../hooks/use-collection";
import { useControllableState } from "../hooks/use-controllable";
import {
  useOpenField,
  useFocusWithin,
  useFieldShortcuts,
  Stop,
  type RowMenuProps,
} from "./lists-editing";
import {
  defaultProperties,
  RecordFieldPicker,
  hasPicker,
  recordEditor,
  type RecordEditors,
} from "./records-fields";
import type { RecordContext, RecordFields } from "./records-model";

/** The editing props of a list or a board. */
export interface RecordEditingProps<R> {
  /**
   * Turns editing on: every shown property becomes the trigger of its picker, and this hears the
   * change, e.g. `(id, patch) => setRecords(…)`. Absent, the rows are read-only.
   */
  onRecordChange?: (id: string, patch: Partial<R>) => void;
  /** Per field: `false` for read-only, options to restrict the choices, `render` for your own. */
  editors?: RecordEditors<R>;
  /** The `shortcut` key of each field opens its picker on the current row; on by default. */
  shortcuts?: boolean;
  /** The actions of a record: a right click, Shift+F10, or the ⋯ shown on hover open them. */
  rowMenu?: (record: R) => ReadonlyArray<ActionMenuEntry>;
  /** The action chosen in `rowMenu`, with the record's id. */
  onRowAction?: (id: string, actionId: string) => void;
}

/** The props a list and a board have in common. */
export interface RecordSurfaceProps<R> extends RecordEditingProps<R> {
  fields: RecordFields<R>;
  /** The people and labels the fields choose from, and `today`. */
  context?: RecordContext;
  /** The fields each record shows, by key; every one not `hidden` by default. */
  properties?: ReadonlyArray<string>;
  /** The field written as the title of a row or a card; `title`. */
  titleField?: string;
  /** The attribute that carries a record's id on its row or card; `data-record`. */
  itemAttr?: string;
  /** The current record, marked; the arrows move it. Controlled or not. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string) => void;
  /**
   * `single` (default): one current record. `multiple`: a selection (⌘ or Ctrl click, Shift click
   * and arrows, ⌘A, Escape), told by `selection`, `defaultSelection` and `onSelectionChange`.
   */
  selectionMode?: "single" | "multiple";
  selection?: ReadonlyArray<string>;
  defaultSelection?: ReadonlyArray<string>;
  onSelectionChange?: (ids: string[]) => void;
  /** A click or Enter on a record. */
  onOpen?: (id: string) => void;
  /** The keys of the folded groups. */
  collapsed?: ReadonlyArray<string>;
  defaultCollapsed?: ReadonlyArray<string>;
  onCollapsedChange?: (keys: string[]) => void;
  /** Writes the number of records next to a group's name; off by default (no counters as chrome). */
  showCounts?: boolean;
  /** Names the block for assistive technology. */
  label?: string;
  className?: string;
}

export type RecordItem = { id: string };

interface Edit<R> {
  editors: RecordEditors<R> | undefined;
  change: (id: string, patch: Partial<R>) => void;
  /** The `open` / `onOpenChange` of a field's picker. */
  openProps: (id: string, field: string) => { open: boolean; onOpenChange: (o: boolean) => void };
}

export interface Surface<R extends RecordItem> {
  fields: RecordFields<R>;
  context: RecordContext;
  /** Whether a field is shown. */
  shows: (field: string) => boolean;
  titleField: string;
  attr: string;
  collection: Collection;
  multiple: boolean;
  folded: ReadonlySet<string>;
  toggle: (groupKey: string) => void;
  edit: Edit<R> | null;
  /** Rows hold controls: a focusable group rather than one button. */
  interactive: boolean;
  menu: (record: R) => RowMenuProps;
  menuOpen: (id: string) => { open: boolean; onOpenChange: (open: boolean) => void };
  openMenu: (id: string) => void;
  /** The props of the block's root: the keyboard, the focus, the root of the open picker. */
  rootProps: (extra: HTMLAttributes<HTMLElement>) => HTMLAttributes<HTMLElement>;
  /** The props of a row or a card, but for its class and content. */
  itemProps: (record: R) => Record<string, unknown>;
}

/** What the parts of a list or a board read: the surface of the root that holds them. */
export const RecordSurfaceContext = createContext<Surface<RecordItem> | null>(null);

/** The surface (current record, selection, folded groups, editing) of the enclosing list or board. */
export function useRecordSurfaceContext<R extends RecordItem = RecordItem>(
  part = "a record part",
): Surface<R> {
  const surface = useContext(RecordSurfaceContext);
  if (!surface) throw new Error(`<${part}> goes inside a <RecordList> or a <RecordBoard>.`);
  return surface as unknown as Surface<R>;
}

const SURFACE_KEYS = [
  "fields",
  "context",
  "properties",
  "titleField",
  "itemAttr",
  "selected",
  "defaultSelected",
  "onSelectedChange",
  "selectionMode",
  "selection",
  "defaultSelection",
  "onSelectionChange",
  "onOpen",
  "collapsed",
  "defaultCollapsed",
  "onCollapsedChange",
  "onRecordChange",
  "editors",
  "shortcuts",
  "rowMenu",
  "onRowAction",
] as const;
type SurfaceKey = (typeof SURFACE_KEYS)[number];

/**
 * Splits the props of a list or a board: the ones `useRecordSurface` reads, and the rest (the
 * view's own props and the element's attributes).
 */
export function splitSurface<R, P extends RecordSurfaceProps<R>>(
  props: P,
): [RecordSurfaceProps<R>, Omit<P, SurfaceKey>] {
  const surface: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    ((SURFACE_KEYS as ReadonlyArray<string>).includes(key) ? surface : rest)[key] = value;
  }
  return [surface as unknown as RecordSurfaceProps<R>, rest as never];
}

const escapeId = (id: string) => id.replace(/["\\]/g, "\\$&");

/** The state of a list or a board, from its props and the records it shows (folded ones left out). */
export function useRecordSurface<R extends RecordItem>(
  {
    fields,
    context = {},
    properties,
    titleField = "title",
    itemAttr = "data-record",
    selected,
    defaultSelected = null,
    onSelectedChange,
    selectionMode = "single",
    selection,
    defaultSelection = [],
    onSelectionChange,
    onOpen,
    collapsed,
    defaultCollapsed = [],
    onCollapsedChange,
    onRecordChange,
    editors,
    shortcuts = true,
    rowMenu,
    onRowAction,
  }: RecordSurfaceProps<R>,
  groups: ReadonlyArray<{ key: string; records: ReadonlyArray<R> }>,
): Surface<R> {
  const multiple = selectionMode === "multiple";
  const [foldedKeys, setFolded] = useControllableState<ReadonlyArray<string>>({
    value: collapsed,
    defaultValue: defaultCollapsed,
    onChange: (keys) => onCollapsedChange?.([...keys]),
  });
  const folded = new Set(foldedKeys);
  const shown = new Set(properties ?? defaultProperties(fields));
  const visible = groups.flatMap((g) => (folded.has(g.key) ? [] : g.records));

  const collection = useCollection<R>({
    items: visible,
    getId: (r) => r.id,
    selectionMode: multiple ? "multiple" : "single",
    ...(multiple
      ? {
          ...(selection ? { selected: selection } : {}),
          defaultSelected: defaultSelection,
          onSelectedChange: (ids: string[]) => onSelectionChange?.(ids),
        }
      : {
          ...(selected !== undefined ? { selected: selected === null ? [] : [selected] } : {}),
          defaultSelected: defaultSelected === null ? [] : [defaultSelected],
          onSelectedChange: (ids: string[]) => {
            const id = ids[0];
            if (id !== undefined && id !== current) onSelectedChange?.(id);
          },
        }),
    onAction: onOpen,
    actOnDoubleClick: false,
    clearOnEscape: multiple,
  });
  const current: string | null = collection.selected[0] ?? null;

  const openField = useOpenField((id) => `[${itemAttr}="${escapeId(id)}"]`);
  const focus = useFocusWithin();
  const [menuFor, setMenuFor] = useControllableState<string | null>({ defaultValue: null });
  const edit: Edit<R> | null = onRecordChange
    ? { editors, change: onRecordChange, openProps: openField.props }
    : null;

  const keys = Object.fromEntries(
    fields.keys.flatMap((k) => {
      const key = fields.def(k).shortcut;
      return key ? [[key, k]] : [];
    }),
  );
  const keyable = (field: string) => {
    const o = edit ? recordEditor(fields, edit.editors, field) : null;
    return o !== null && !o.render && hasPicker(fields.def(field).kind) && shown.has(field);
  };
  useFieldShortcuts(
    edit !== null &&
      shortcuts &&
      focus.inside &&
      current !== null &&
      visible.some((r) => r.id === current),
    (field) => {
      if (current !== null) openField.show(current, field);
    },
    keyable,
    keys,
  );

  const menu = (record: R): RowMenuProps => ({
    items: rowMenu?.(record),
    onSelect: (actionId) => onRowAction?.(record.id, actionId),
    label: `Actions on ${record.id}`,
  });
  const toggle = (key: string) =>
    setFolded(folded.has(key) ? [...folded].filter((k) => k !== key) : [...folded, key]);
  const open = (id: string) => onOpen?.(id);

  return {
    fields,
    context,
    shows: (field) => shown.has(field),
    titleField,
    attr: itemAttr,
    collection,
    multiple,
    folded,
    toggle,
    edit,
    interactive: edit !== null || rowMenu !== undefined,
    menu,
    menuOpen: (id) => ({
      open: menuFor === id,
      onOpenChange: (o) => setMenuFor(o ? id : null),
    }),
    openMenu: (id) => {
      if (rowMenu) setMenuFor(id);
    },
    rootProps: (extra) =>
      collection.getContainerProps({
        ...extra,
        ref: openField.root as never,
        onFocus: focus.props.onFocus,
        onBlur: focus.props.onBlur,
      }),
    itemProps: (record) => {
      const { "aria-selected": selectedState, ...props } = collection.getItemProps(record.id, {
        // A click opens; with a modifier in a selection it only picks.
        onClick: (event) => {
          if (!(multiple && (event.shiftKey || event.metaKey || event.ctrlKey))) open(record.id);
        },
        // Space opens a record as a click does; in a selection it toggles, as the collection does.
        onKeyDown: (event) => {
          if (event.key !== " " || multiple || event.target !== event.currentTarget) return;
          event.preventDefault();
          collection.select(record.id);
          open(record.id);
        },
      }) as HTMLAttributes<HTMLElement> & { "aria-selected"?: boolean };
      const on = collection.isSelected(record.id);
      return {
        ...props,
        [itemAttr]: record.id,
        ...(on && !multiple ? { "aria-current": true } : {}),
        ...(multiple ? { "data-selected": selectedState ? "true" : undefined } : {}),
      };
    },
  };
}

/**
 * A field of a record inside a row or a card: `children` (its mark) alone when read-only, else the
 * trigger of its picker. `unset` draws it as a hidden anchor, for an empty field a shortcut can
 * still open.
 */
export function RecordFieldSlot<R extends RecordItem>({
  surface,
  record,
  name,
  className,
  unset,
  children,
}: {
  surface: Surface<R>;
  record: R;
  name: string;
  className?: string;
  unset?: boolean;
  children: ReactNode;
}) {
  const { edit, fields, context } = surface;
  const editor = edit ? recordEditor(fields, edit.editors, name) : null;
  if (!edit || !editor) return unset ? null : children;
  const change = (patch: Partial<R>) => edit.change(record.id, patch);
  if (editor.render) {
    return unset ? null : <Stop className="fg-issue-custom">{editor.render(record, change)}</Stop>;
  }
  if (!hasPicker(fields.def(name).kind)) return unset ? null : children;
  return (
    <Stop className={unset ? "fg-issue-anchor" : undefined}>
      <RecordFieldPicker
        fields={fields}
        name={name}
        record={record}
        onChange={change}
        context={context}
        editor={editor}
        className={cx("fg-issue-edit", unset ? "fg-issue-unset" : className)}
        {...edit.openProps(record.id, name)}
      >
        {children}
      </RecordFieldPicker>
    </Stop>
  );
}
