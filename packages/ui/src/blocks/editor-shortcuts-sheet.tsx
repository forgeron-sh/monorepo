// The sheet of keyboard shortcuts of an app: a dialog, grouped by section, searchable. It reads the
// same `Action[]` as `useActions`, so what is listed is what is bound; keys that are not
// combinations (hold Space and drag) are added as entries. ⌘ reads Ctrl off a Mac.

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Dialog } from "../dialog";
import { useControllableState } from "../hooks/use-controllable";
import type { Action } from "../hooks/use-actions";
import { useShortcuts } from "../hooks/use-shortcuts";
import { SearchBox } from "../identity";
import { Kbd } from "../marks";
import {
  editorGroupShortcuts,
  editorShortcutEntries,
  type EditorShortcutEntry,
} from "./editor-model";

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

  if (!shown) return null;
  const close = () => {
    setQuery("");
    setShown(false);
  };

  return (
    <Dialog title={title} onClose={close} className="fg-edt-sheet">
      <SearchBox
        data-autofocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search shortcuts"
        aria-label="Search shortcuts"
      />
      <p className="fg-visually-hidden" role="status">
        {count === 0 ? "No shortcut matches." : `${count} shortcut${count === 1 ? "" : "s"}.`}
      </p>
      {sections.length === 0 ? (
        <p className="fg-edt-sheet-empty">No shortcut matches “{query}”.</p>
      ) : (
        <div className="fg-edt-sheet-cols">
          {sections.map((section) => (
            <section key={section.name} className="fg-edt-sheet-sec" aria-label={section.name}>
              <h3 className="fg-edt-sheet-head">{section.name}</h3>
              <dl className="fg-edt-sheet-list">
                {section.items.map((item) => (
                  <div key={item.id} className="fg-edt-sheet-row">
                    <dt>{item.label}</dt>
                    <dd>
                      <Kbd keys={item.keys} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
      {footer ? <div className="fg-edt-sheet-foot">{footer}</div> : null}
    </Dialog>
  );
}
