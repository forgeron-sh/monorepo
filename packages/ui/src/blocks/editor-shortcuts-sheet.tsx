// The sheet of keyboard shortcuts of an app: a dialog, grouped by section, searchable. It reads the
// same `Action[]` as `useActions`, so what is listed is what is bound; keys that are not
// combinations (hold Space and drag) are added as entries. ⌘ reads Ctrl off a Mac.
//
// `ShortcutsSheet` with no children builds the usual sheet. With children it is the root of the
// parts, on the `Dialog` parts:
//
//   <ShortcutsSheet actions={actions} open={open} onOpenChange={setOpen}>
//     <ShortcutsSheetContent title="Keys">
//       <ShortcutsSheetSearch />
//       <ShortcutsSheetSections />
//     </ShortcutsSheetContent>
//   </ShortcutsSheet>

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { cx } from "../cx";
import { Dialog, DialogContent, DialogTitle } from "../dialog";
import { useControllableState } from "../hooks/use-controllable";
import type { Action } from "../hooks/use-actions";
import { useShortcuts } from "../hooks/use-shortcuts";
import { SearchBox } from "../identity";
import { Kbd } from "../marks";
import type { Part } from "../part";
import {
  editorGroupShortcuts,
  editorShortcutEntries,
  type EditorShortcutEntry,
  type EditorShortcutSection,
} from "./editor-model";

interface SheetContext {
  query: string;
  setQuery: (query: string) => void;
  sections: ReadonlyArray<EditorShortcutSection>;
  count: number;
  footer?: ReactNode;
  title: ReactNode;
}

const Ctx = createContext<SheetContext | null>(null);

function useSheet(part: string): SheetContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> goes inside a <ShortcutsSheet>.`);
  return ctx;
}

export interface ShortcutsSheetProps {
  /** The actions of the screen, as given to `useActions`: those with a `shortcut` are listed. */
  actions?: ReadonlyArray<Action>;
  /** Extra entries: keys written out (`keys`) or combinations (`shortcut`), under a `group`. */
  entries?: ReadonlyArray<EditorShortcutEntry>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The key that opens the sheet from anywhere. Default `"shift+?"`; `false` for none. */
  hotkey?: string | false;
  /** Title of the dialog. Default "Keyboard shortcuts". */
  title?: ReactNode;
  /** Reads ⌘ (`true`) or Ctrl (`false`). Default: from the platform. */
  mac?: boolean;
  /** The section of entries that have no group. Default "General". */
  fallbackGroup?: string;
  /** The order of the sections; the others follow in the order they appear. */
  sectionOrder?: ReadonlyArray<string>;
  /** Under the list: a link to the docs, a note. */
  footer?: ReactNode;
  /** The parts of the sheet. Without them, the usual sheet is built from the props. */
  children?: ReactNode;
}

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

/** The shortcuts of the app, grouped and searchable, in a dialog. Opens on `?` (⇧ /). */
export function ShortcutsSheet({
  actions = [],
  entries = [],
  open,
  defaultOpen = false,
  onOpenChange,
  hotkey = "shift+?",
  title = "Keyboard shortcuts",
  mac = isMac(),
  fallbackGroup = "General",
  sectionOrder,
  footer,
  children,
}: ShortcutsSheetProps) {
  const [shown, setShown] = useControllableState<boolean>({
    ...(open !== undefined ? { value: open } : {}),
    defaultValue: defaultOpen,
    ...(onOpenChange ? { onChange: onOpenChange } : {}),
  });
  const [query, setQuery] = useState("");
  useShortcuts(hotkey ? { [hotkey]: () => setShown(!shown) } : {}, { enabled: hotkey !== false });

  const all = useMemo(() => [...editorShortcutEntries(actions), ...entries], [actions, entries]);
  const sections = useMemo(() => {
    const grouped = editorGroupShortcuts(all, query, { mac, fallback: fallbackGroup });
    if (!sectionOrder) return grouped;
    const rank = (name: string) => {
      const i = sectionOrder.indexOf(name);
      return i < 0 ? sectionOrder.length : i;
    };
    return [...grouped].sort((a, b) => rank(a.name) - rank(b.name));
  }, [all, query, mac, fallbackGroup, sectionOrder]);
  const count = sections.reduce((n, s) => n + s.items.length, 0);

  const ctx: SheetContext = {
    query,
    setQuery,
    sections,
    count,
    title,
    ...(footer ? { footer } : {}),
  };

  return (
    <Ctx.Provider value={ctx}>
      <Dialog
        open={shown}
        onOpenChange={(next) => {
          if (!next) setQuery("");
          setShown(next);
        }}
      >
        {children ?? (
          <ShortcutsSheetContent>
            <ShortcutsSheetSearch />
            <ShortcutsSheetSections />
            <ShortcutsSheetFooter />
          </ShortcutsSheetContent>
        )}
      </Dialog>
    </Ctx.Provider>
  );
}

export type ShortcutsSheetContentProps = Part<ComponentProps<typeof DialogContent>> & {
  /** Replaces the title given to the root. */
  title?: ReactNode;
};

/** The dialog itself, with its title. */
export function ShortcutsSheetContent({
  title,
  className,
  children,
  ...rest
}: ShortcutsSheetContentProps) {
  const ctx = useSheet("ShortcutsSheetContent");
  return (
    <DialogContent
      data-slot="shortcuts-sheet-content"
      showCloseButton={false}
      {...rest}
      className={cx("fg-edt-sheet", className)}
    >
      <DialogTitle>{title ?? ctx.title}</DialogTitle>
      {children}
    </DialogContent>
  );
}

/** The search field; typing narrows the sections. */
export function ShortcutsSheetSearch({
  className,
  ...rest
}: Omit<ComponentProps<typeof SearchBox>, "value" | "onChange">) {
  const { query, setQuery } = useSheet("ShortcutsSheetSearch");
  return (
    <SearchBox
      data-autofocus
      data-slot="shortcuts-sheet-search"
      placeholder="Search shortcuts"
      aria-label="Search shortcuts"
      {...rest}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      {...(className ? { className } : {})}
    />
  );
}

/** The sections and their rows, or a note when nothing matches. */
export function ShortcutsSheetSections({
  className,
  ...rest
}: Part<Omit<ComponentProps<"div">, "children">>) {
  const { sections, query, count } = useSheet("ShortcutsSheetSections");
  return (
    <>
      <p className="fg-visually-hidden" role="status">
        {count === 0 ? "No shortcut matches." : `${count} shortcut${count === 1 ? "" : "s"}.`}
      </p>
      {sections.length === 0 ? (
        <p className="fg-edt-sheet-empty">No shortcut matches “{query}”.</p>
      ) : (
        <div
          data-slot="shortcuts-sheet-sections"
          {...rest}
          className={cx("fg-edt-sheet-cols", className)}
        >
          {sections.map((section) => (
            <ShortcutsSheetSection key={section.name} section={section} />
          ))}
        </div>
      )}
    </>
  );
}

/** One section: its name and its rows. */
export function ShortcutsSheetSection({
  section,
  className,
  ...rest
}: Part<Omit<ComponentProps<"section">, "children">> & { section: EditorShortcutSection }) {
  return (
    <section
      aria-label={section.name}
      data-slot="shortcuts-sheet-section"
      {...rest}
      className={cx("fg-edt-sheet-sec", className)}
    >
      <h3 className="fg-edt-sheet-head">{section.name}</h3>
      <dl className="fg-edt-sheet-list">
        {section.items.map((item) => (
          <ShortcutsSheetRow key={item.id} item={item} />
        ))}
      </dl>
    </section>
  );
}

/** One shortcut: what it does, and its keys. */
export function ShortcutsSheetRow({
  item,
  className,
  ...rest
}: Part<Omit<ComponentProps<"div">, "children">> & {
  item: { label: string; keys: ReadonlyArray<string> };
}) {
  return (
    <div data-slot="shortcuts-sheet-row" {...rest} className={cx("fg-edt-sheet-row", className)}>
      <dt>{item.label}</dt>
      <dd>
        <Kbd keys={item.keys} />
      </dd>
    </div>
  );
}

/** The note under the list (the root's `footer`, or your children). */
export function ShortcutsSheetFooter({
  className,
  children,
  ...rest
}: Part<ComponentProps<"div">>) {
  const { footer } = useSheet("ShortcutsSheetFooter");
  const content = children ?? footer;
  if (!content) return null;
  return (
    <div
      data-slot="shortcuts-sheet-footer"
      {...rest}
      className={cx("fg-edt-sheet-foot", className)}
    >
      {content}
    </div>
  );
}
