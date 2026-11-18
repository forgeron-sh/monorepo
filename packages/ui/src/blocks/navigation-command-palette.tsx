// The command palette (⌘K): a search field over grouped results, arrows to move, Enter to run.
// The frame is Base UI's Dialog (focus trap, Escape, outside press, focus returned to the
// trigger); the list is a listbox driven from the field with `aria-activedescendant`, so the
// focus never leaves the query.

import { Dialog } from "@base-ui/react/dialog";
import type { IconDefinition } from "@forgeron/icons";
import { Search01Icon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useId, useState } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { Kbd } from "../marks";

export interface CommandPaletteItem {
  /** Passed to `onSelect`. */
  id: string;
  label: string;
  /** A pixel icon before the label. */
  icon?: IconDefinition;
  /** Any mark in place of `icon`: a status glyph, an avatar. */
  glyph?: ReactNode;
  /** Mono text at the end of the row: an issue id, a team. */
  hint?: string;
  /** The shortcut that does the same outside the palette. */
  kbd?: string | ReadonlyArray<string>;
  /** Other words that find the row: `["settings", "preferences"]`. */
  keywords?: ReadonlyArray<string>;
}

export interface CommandPaletteGroup {
  /** The mono heading above the rows: Go to, Projects, Issues. */
  label: string;
  items: ReadonlyArray<CommandPaletteItem>;
}

/**
 * The groups whose rows match `query`, case-insensitively, on the label, the hint and the
 * keywords; empty groups are dropped. An empty query keeps everything.
 */
export function filterCommands(
  groups: ReadonlyArray<CommandPaletteGroup>,
  query: string,
): CommandPaletteGroup[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return groups.filter((g) => g.items.length > 0);
  return groups
    .map((g) => ({
      label: g.label,
      items: g.items.filter((item) => {
        const text = [item.label, item.hint ?? "", ...(item.keywords ?? [])]
          .join(" ")
          .toLowerCase();
        return words.every((w) => text.includes(w));
      }),
    }))
    .filter((g) => g.items.length > 0);
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: ReadonlyArray<CommandPaletteGroup>;
  /** Called with the `id` of the row run (click or Enter); the palette then asks to close. */
  onSelect: (id: string) => void;
  /** Names the dialog for assistive technology. */
  label?: string;
  placeholder?: string;
  /** The shortcut that opens the palette, shown at the end of the field. */
  shortcut?: string | ReadonlyArray<string>;
  /** What to say when nothing matches; `No results for “query”` by default. */
  emptyText?: (query: string) => ReactNode;
  className?: string;
}

/** Search and run anything: pages, records, actions. Controlled: the caller opens it on ⌘K. */
export function CommandPalette({
  open,
  onOpenChange,
  groups,
  onSelect,
  label = "Command palette",
  placeholder = "Search or run a command…",
  shortcut = ["⌘", "K"],
  emptyText,
  className,
}: CommandPaletteProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fg-palette-backdrop" />
        <Dialog.Popup className={cx("fg-pop fg-palette", className)} aria-label={label}>
          <PaletteBody
            groups={groups}
            placeholder={placeholder}
            shortcut={shortcut}
            run={(id) => {
              onSelect(id);
              onOpenChange(false);
            }}
            {...(emptyText ? { emptyText } : {})}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface BodyProps {
  groups: ReadonlyArray<CommandPaletteGroup>;
  placeholder: string;
  shortcut: string | ReadonlyArray<string>;
  run: (id: string) => void;
  emptyText?: (query: string) => ReactNode;
}

/** Mounted on each opening, so the query and the highlight start fresh every time. */
function PaletteBody({ groups, placeholder, shortcut, run, emptyText }: BodyProps) {
  const base = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const shown = filterCommands(groups, query);
  const flat = shown.flatMap((g) => g.items);
  const current = Math.min(active, Math.max(flat.length - 1, 0));
  const optionId = (i: number) => `${base}-o${i}`;
  const listId = `${base}-list`;

  const move = (next: number) => {
    if (flat.length === 0) return;
    const index = (next + flat.length) % flat.length;
    setActive(index);
    document.getElementById(optionId(index))?.scrollIntoView?.({ block: "nearest" });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") move(current + 1);
    else if (event.key === "ArrowUp") move(current - 1);
    else if (event.key === "Home" && event.ctrlKey) move(0);
    else if (event.key === "End" && event.ctrlKey) move(flat.length - 1);
    else if (event.key === "Enter") {
      const item = flat[current];
      if (item) run(item.id);
    } else return;
    event.preventDefault();
  };

  let n = -1;
  return (
    <>
      <div className="fg-palette-head">
        <Icon icon={Search01Icon} size={12} variant="mono" className="fg-palette-glass" />
        <input
          className="fg-palette-input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={placeholder}
          {...(flat.length > 0 ? { "aria-activedescendant": optionId(current) } : {})}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <Kbd keys={shortcut} />
      </div>
      <div className="fg-palette-list" id={listId} role="listbox" aria-label="Results">
        {flat.length === 0 ? (
          <div className="fg-palette-empty" role="presentation">
            {emptyText ? emptyText(query) : `No results for “${query.trim()}”`}
          </div>
        ) : (
          shown.map((g, gi) => (
            <div key={`${g.label}-${gi}`} role="group" aria-labelledby={`${base}-g${gi}`}>
              <div className="fg-palette-group" id={`${base}-g${gi}`} role="presentation">
                {g.label}
              </div>
              {g.items.map((item) => {
                n += 1;
                const index = n;
                const on = index === current;
                return (
                  <div
                    key={item.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={on}
                    className="fg-pop-row fg-palette-row"
                    {...(on ? { "data-highlighted": "" } : {})}
                    onMouseMove={() => (on ? undefined : setActive(index))}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => run(item.id)}
                  >
                    {item.glyph ??
                      (item.icon ? <Icon icon={item.icon} size={12} variant="mono" /> : null)}
                    <span className="fg-pop-label">{item.label}</span>
                    {item.hint ? <span className="fg-pop-hint">{item.hint}</span> : null}
                    {item.kbd ? <Kbd keys={item.kbd} /> : null}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </>
  );
}
