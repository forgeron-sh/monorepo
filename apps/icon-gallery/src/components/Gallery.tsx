import type { IconVariant, PixelIcon } from "@forgeron/icons";
import { Icon } from "@forgeron/icons/react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createLoader, type Catalog, type GalleryEntry, type Loader } from "../lib/loader";
import {
  countByCategory,
  EMPTY_QUERY,
  filterEntries,
  queryFromSearch,
  searchFromQuery,
  type GalleryQuery,
} from "../lib/search";
import { IconDetail } from "./IconDetail";
import { fig } from "./parts";

const PAGE = 240;

function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string; disabled?: boolean }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Tile({
  entry,
  loader,
  variant,
  onOpen,
}: {
  entry: GalleryEntry;
  loader: Loader;
  variant: IconVariant;
  onOpen: (name: string) => void;
}) {
  const data = loader.get(entry.name);
  return (
    <li>
      <button
        type="button"
        className="tile"
        onClick={() => onOpen(entry.name)}
        title={data?.description ?? entry.name}
      >
        <span className="tile-fig t-mono">{fig(entry.index).slice(4)}</span>
        <span className="tile-art">
          {data ? (
            <Icon icon={data.icon} variant={entry.duo ? variant : "mono"} size={36} />
          ) : (
            <span className="tile-wait" aria-hidden="true" />
          )}
        </span>
        <span className="tile-name">{entry.name}</span>
      </button>
    </li>
  );
}

/** The query in the address bar when the page opens (the island renders on the client only). */
const initial = () => queryFromSearch(window.location.search);

export default function Gallery({
  version,
  searchIcon,
}: {
  version: string;
  /** Given by the page, so the island never imports the package entry and its every icon. */
  searchIcon: PixelIcon;
}) {
  const loader = useMemo(() => createLoader(version), [version]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loader.catalog().then(setCatalog, () => setFailed(true));
  }, [loader]);
  // Renders again whenever a batch of drawings arrives.
  useSyncExternalStore(loader.subscribe, loader.size);
  const entries = useMemo(() => catalog?.entries ?? [], [catalog]);
  const totals = useMemo(
    () => (catalog ? countByCategory(catalog.entries, catalog.categories) : []),
    [catalog],
  );
  const byName = useMemo(() => new Map(entries.map((e) => [e.name, e])), [entries]);

  const [query, setQuery] = useState<GalleryQuery>(() => {
    const { icon: _icon, ...q } = initial();
    return q;
  });
  const [variant, setVariant] = useState<IconVariant>("duo");
  const [open, setOpen] = useState<string | null>(() => initial().icon);
  const search = useRef<HTMLInputElement>(null);
  const sentinel = useRef<HTMLLIElement>(null);
  const deferredText = useDeferredValue(query.text);
  // How many tiles are shown, for this query only: a new query starts again from one page.
  const key = JSON.stringify({ ...query, text: deferredText });
  const [page, setPage] = useState({ key, limit: PAGE });
  const limit = page.key === key ? page.limit : PAGE;

  // The address bar holds the query, so a category or an icon can be linked.
  useEffect(() => {
    const next = `${window.location.pathname}${searchFromQuery({ ...query, icon: open })}`;
    window.history.replaceState(null, "", next);
  }, [query, open]);

  const results = useMemo(
    () => filterEntries(entries, { ...query, text: deferredText }),
    [entries, query, deferredText],
  );

  // The sentinel exists only once the index is in and while tiles remain: observe it again then.
  const more = results.length > limit;
  useEffect(() => {
    const el = sentinel.current;
    if (!more || !el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setPage({ key, limit: limit + PAGE });
      },
      { rootMargin: "800px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [key, limit, more]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest("input, textarea, select");
      if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const update = useCallback(
    (patch: Partial<GalleryQuery>) => setQuery((q) => ({ ...q, ...patch })),
    [],
  );
  const shown = useMemo(() => results.slice(0, limit), [results, limit]);
  const openEntry = open ? byName.get(open) : undefined;
  // The batches of the tiles on screen and of the open icon, each asked once.
  useEffect(() => loader.need(shown), [loader, shown]);
  useEffect(() => {
    if (openEntry) loader.need([openEntry]);
  }, [loader, openEntry]);
  const category = totals.find((c) => c.id === query.category);
  const move = (step: number) => {
    const i = results.findIndex((e) => e.name === open);
    const next = results[(i + step + results.length) % results.length];
    if (next) setOpen(next.name);
  };

  return (
    <div className="gallery">
      <aside className="side" aria-label="Filters">
        <div className="side-block">
          <span className="side-label t-mono dim">Variant</span>
          <Seg<IconVariant>
            label="Variant"
            value={variant}
            onChange={setVariant}
            options={[
              { value: "mono", label: "Mono" },
              { value: "duo", label: "Duo" },
            ]}
          />
        </div>
        <nav className="side-block side-cats" aria-label="Categories">
          <span className="side-label t-mono dim">Categories</span>
          <ul>
            <li>
              <button
                type="button"
                className="cat"
                aria-current={query.category === null ? "true" : undefined}
                onClick={() => update({ category: null })}
              >
                <span className="cat-name">All icons</span>
                <span className="cat-count t-mono">{entries.length}</span>
              </button>
            </li>
            {totals.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="cat"
                  aria-current={query.category === c.id ? "true" : undefined}
                  onClick={() => update({ category: query.category === c.id ? null : c.id })}
                >
                  <span className="cat-name">{c.label}</span>
                  <span className="cat-count t-mono">{c.total}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <p className="side-note t-small">
          Categories and labels are our own taxonomy, derived from the names.
        </p>
      </aside>

      <section className="results" aria-label="Icons">
        <div className="bar">
          <label className="search">
            <span className="search-icon" aria-hidden="true">
              <Icon icon={searchIcon} size={18} />
            </span>
            <span className="sr-only">Search icons by name or label</span>
            <input
              ref={search}
              type="search"
              placeholder={`Search ${entries.length.toLocaleString("en")} names, labels, aliases…`}
              value={query.text}
              onChange={(e) => update({ text: e.target.value })}
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="t-mono dim">/</kbd>
          </label>
          <div className="bar-meta t-mono">
            {category ? (
              <button type="button" className="chip on" onClick={() => update({ category: null })}>
                {category.label} ×
              </button>
            ) : null}
            <span className="dim">
              <span className="muted">{results.length.toLocaleString("en")}</span> results
            </span>
          </div>
        </div>

        {!catalog ? (
          <div className="empty dots-bg">
            <p className="f-title f-h4">
              {failed ? "The catalog did not load." : "Loading the catalog…"}
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="empty dots-bg">
            <p className="f-title f-h4">No icon matches.</p>
            <p className="t-small">Try another word, or clear the filters.</p>
            <button type="button" className="btn btn-sm" onClick={() => setQuery(EMPTY_QUERY)}>
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="grid">
            {shown.map((entry) => (
              <Tile
                key={entry.name}
                entry={entry}
                loader={loader}
                variant={variant}
                onOpen={setOpen}
              />
            ))}
            {shown.length < results.length ? (
              <li ref={sentinel} className="grid-more" aria-hidden="true" />
            ) : null}
          </ul>
        )}
      </section>

      {openEntry && catalog ? (
        <IconDetail
          entry={openEntry}
          data={loader.get(openEntry.name)}
          categories={catalog.categories}
          variant={variant}
          onVariant={setVariant}
          onClose={() => setOpen(null)}
          onMove={move}
          onCategory={(id) => {
            setOpen(null);
            update({ category: id });
          }}
        />
      ) : null}
    </div>
  );
}
