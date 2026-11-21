// The command palette (⌘K): a search field over grouped results, arrows to move, Enter to run.
// Built from the Command parts in a CommandDialog (command.tsx): the dialog gives the focus trap,
// Escape, outside press and the focus returned to the trigger; the list is a listbox driven from
// the field with `aria-activedescendant`, so the focus never leaves the query.

import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import type { CommandDialogProps } from "./command";
import { Icon } from "./icon";
import { Kbd } from "./marks";

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

/** `groups` stays undefined: with groups, `CommandPalette` is the props-driven one. */
export type CommandPaletteRootProps = CommandDialogProps & { groups?: undefined };

/**
 * With `groups`: search and run anything, pages, records, actions; controlled, the caller opens it
 * on ⌘K. Without `groups`: the root of the Command parts in a dialog (`CommandInput`,
 * `CommandList`, `CommandGroup`, `CommandItem`…), as shadcn composes it (D-156).
 */
export function CommandPalette(props: CommandPaletteProps | CommandPaletteRootProps) {
  if (props.groups !== undefined) return <PalettePreset {...(props as CommandPaletteProps)} />;
  const { groups: _groups, ...root } = props as CommandPaletteRootProps;
  return <CommandDialog {...root} />;
}

function PalettePreset({
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
    <CommandDialog
      open={open}
      onOpenChange={(next) => onOpenChange(next)}
      title={label}
      shouldFilter={false}
      {...(className ? { className } : {})}
    >
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
    </CommandDialog>
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
  const [query, setQuery] = useState("");
  const shown = filterCommands(groups, query);
  return (
    <>
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
        end={<Kbd keys={shortcut} />}
      />
      <CommandList>
        <CommandEmpty>
          {emptyText ? emptyText(query) : `No results for “${query.trim()}”`}
        </CommandEmpty>
        {shown.map((g, gi) => (
          <CommandGroup key={`${g.label}-${gi}`} heading={g.label}>
            {g.items.map((item) => (
              <CommandItem key={item.id} value={item.id} onSelect={run}>
                {item.glyph ??
                  (item.icon ? <Icon icon={item.icon} size={12} variant="mono" /> : null)}
                <span className="fg-pop-label">{item.label}</span>
                {item.hint ? <span className="fg-pop-hint">{item.hint}</span> : null}
                {item.kbd ? <Kbd keys={item.kbd} /> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </>
  );
}
