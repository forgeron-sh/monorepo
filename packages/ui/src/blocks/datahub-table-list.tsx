// The left column of the table editor: a search, then the tables (and views, bridged tables…) in
// sections, the current one marked. Arrows move between rows, typing in the box narrows them.

import type { IconDefinition } from "@forgeron/icons";
import { PlusSignIcon, TableIcon } from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { IconButton, SearchBox } from "../identity";

export interface TableListItem {
  id: string;
  /** The table name, in mono: `companies`, `crm.companies`. */
  name: string;
  /** A pixel icon; a table by default. */
  icon?: IconDefinition;
  /** Any mark at the end in place of the count: a status light, an arrow out. */
  trailing?: ReactNode;
  /** Its number of rows, shown with `showCounts`. */
  count?: number;
  /** Makes the row a link. */
  href?: string;
}

export interface TableListSection {
  key: string;
  /** Small mono heading: "Tables", "Views". */
  heading: string;
  items: ReadonlyArray<TableListItem>;
  /** A + next to the heading: "New table". */
  onAdd?: () => void;
  addLabel?: string;
}

export interface TableListProps {
  sections: ReadonlyArray<TableListSection>;
  /** The id of the open table, marked. */
  current?: string | null;
  /** A click or Enter on a row (links still navigate). */
  onSelect?: (id: string) => void;
  /** A search box above the list; on by default. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** The rows' counts at the end. Off: counters are noise in a list. */
  showCounts?: boolean;
  /** Above the search: a database switcher, a title. */
  header?: ReactNode;
  /** When the search leaves nothing. */
  empty?: ReactNode;
  /** Names the navigation for assistive technology. */
  label?: string;
  className?: string;
}

/** The tables of a database in sections, searchable, the current one marked; arrows move. */
export function TableList({
  sections,
  current,
  onSelect,
  searchable = true,
  searchPlaceholder = "Search tables",
  showCounts = false,
  header,
  empty = "No table matches",
  label = "Tables",
  className,
}: TableListProps) {
  const [query, setQuery] = useState("");
  const box = useRef<HTMLElement>(null);
  const q = query.trim().toLowerCase();
  const shown = sections.map((s) => ({
    ...s,
    items: q ? s.items.filter((i) => i.name.toLowerCase().includes(q)) : s.items,
  }));
  const none = q !== "" && shown.every((s) => s.items.length === 0);

  const rows = () => [...(box.current?.querySelectorAll<HTMLElement>(".fg-dh-tl-row") ?? [])];
  const onListKey = (event: KeyboardEvent<HTMLElement>) => {
    const all = rows();
    const at = all.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => all[Math.max(0, Math.min(all.length - 1, i))]?.focus();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      go(at + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (at <= 0 && searchable)
        box.current?.querySelector<HTMLInputElement>(".fg-dh-tl-search input")?.focus();
      else go(at - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      go(0);
    } else if (event.key === "End") {
      event.preventDefault();
      go(all.length - 1);
    }
  };

  return (
    <nav ref={box} aria-label={label} className={cx("fg-dh-tl", className)}>
      {header ? <div className="fg-dh-tl-header">{header}</div> : null}
      {searchable ? (
        <SearchBox
          className="fg-dh-tl-search"
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              rows()[0]?.focus();
            }
            if (event.key === "Escape" && query) {
              event.stopPropagation();
              setQuery("");
            }
          }}
        />
      ) : null}
      <div className="fg-dh-tl-sections" onKeyDown={onListKey}>
        {shown.map((section) =>
          section.items.length === 0 && q ? null : (
            <section key={section.key} className="fg-dh-tl-section">
              <div className="fg-dh-tl-head">
                <h3 className="fg-dh-tl-heading">{section.heading}</h3>
                {section.onAdd ? (
                  <IconButton
                    icon={PlusSignIcon}
                    size="sm"
                    label={section.addLabel ?? `New in ${section.heading.toLowerCase()}`}
                    onClick={section.onAdd}
                  />
                ) : null}
              </div>
              <ul className="fg-dh-tl-items">
                {section.items.map((item) => {
                  const isCurrent = current === item.id;
                  const inner = (
                    <>
                      <Icon icon={item.icon ?? TableIcon} size={12} variant="mono" />
                      <span className="fg-dh-tl-name">{item.name}</span>
                      {item.trailing ? (
                        <span className="fg-dh-tl-end">{item.trailing}</span>
                      ) : showCounts && item.count !== undefined ? (
                        <span className="fg-dh-tl-end fg-dh-tl-count">
                          {item.count.toLocaleString("en-GB")}
                        </span>
                      ) : null}
                    </>
                  );
                  const common = {
                    className: "fg-dh-tl-row",
                    "aria-current": isCurrent ? ("page" as const) : undefined,
                    onClick: onSelect ? () => onSelect(item.id) : undefined,
                  };
                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <a href={item.href} {...common}>
                          {inner}
                        </a>
                      ) : (
                        <button type="button" {...common}>
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
        )}
        {none ? <p className="fg-dh-tl-empty">{empty}</p> : null}
      </div>
    </nav>
  );
}
