// A document as pages: images or a render callback, a column of thumbnails, zoom from fit-width to
// 300 %, page navigation and keyboard, an optional text search through a callback, and an overlay
// drawn over each page (the fields of a signature, the stamps of an approval). It knows nothing of
// what the pages show, so Drive previews and invoices use it as well.
//
// With `pages` alone it is the usual viewer. With children it is a frame, and the parts compose it:
//
//   <DocumentViewer label="Contract" pages={pages} overlay={stamps} onSearch={search}>
//     <DocumentViewerToolbar>
//       <DocumentViewerThumbsToggle /><DocumentViewerSeparator />
//       <DocumentViewerPager /><DocumentViewerSeparator />
//       <DocumentViewerZoom /><DocumentViewerSearch />
//     </DocumentViewerToolbar>
//     <DocumentViewerMain><DocumentViewerThumbs /><DocumentViewerPages /></DocumentViewerMain>
//   </DocumentViewer>

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Search01Icon,
  SidebarLeft01Icon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@forgeron/icons";
import type { KeyboardEvent, ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Input } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { IconButton } from "../identity";
import { Select } from "../select";
import { part, type PartProps } from "../part";

export interface DocumentPage {
  /** A key; the page number by default. */
  id?: string;
  /** The picture of the page. */
  src?: string;
  /** What the page says, for those who do not see it. */
  alt?: string;
  /** The page's size at 100 %, in px. Only the ratio matters to fit the width. */
  width: number;
  height: number;
  /** Draws the page when there is no `src`: a rendered invoice, a PDF canvas. */
  render?: (info: PageInfo) => ReactNode;
}

/** What a page is shown at; given to `render` and to `overlay`. */
export interface PageInfo {
  page: DocumentPage;
  /** From 1. */
  number: number;
  /** The zoom as a factor: 1 is 100 %. */
  scale: number;
  /** The page's size on screen, in px. */
  width: number;
  height: number;
}

/** A place where the search found something. */
export interface SearchHit {
  /** The page, from 1. */
  page: number;
  /** A few words around it. */
  text?: string;
}

/** `"fit"` fills the width; a number is a percentage, 50 to 300. */
export type ZoomValue = "fit" | number;

export const ZOOM_MIN = 50;
export const ZOOM_MAX = 300;
export const ZOOM_STEPS: ReadonlyArray<number> = [50, 75, 100, 125, 150, 200, 250, 300];

/** A zoom kept between 50 and 300 (whole percent). */
export const clampZoom = (zoom: number): number =>
  Math.min(Math.max(Math.round(zoom), ZOOM_MIN), ZOOM_MAX);

/** The factor that makes a page of `pageWidth` fill `containerWidth` less its margins. */
export function fitScale(containerWidth: number, pageWidth: number, margin = 32): number {
  if (pageWidth <= 0 || containerWidth <= 0) return 1;
  return Math.max((containerWidth - margin * 2) / pageWidth, 0.1);
}

/** The next step up or down from a zoom, as a percentage; `fit` counts as `current`. */
export function stepZoom(current: number, direction: 1 | -1): number {
  const now = clampZoom(current);
  if (direction > 0) return ZOOM_STEPS.find((s) => s > now) ?? ZOOM_MAX;
  return [...ZOOM_STEPS].reverse().find((s) => s < now) ?? ZOOM_MIN;
}

/** A page number kept between 1 and the last. */
export const clampPage = (page: number, total: number): number =>
  Math.min(Math.max(Math.round(page) || 1, 1), Math.max(total, 1));

export interface DocumentViewerProps extends Omit<PartProps<"section">, "children"> {
  /** Names the viewer: "Contract 2026-114". */
  label: string;
  pages: ReadonlyArray<DocumentPage>;
  /** The page in view, from 1. */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  zoom?: ZoomValue;
  defaultZoom?: ZoomValue;
  onZoomChange?: (zoom: ZoomValue) => void;
  /** The column of thumbnails; shown by default, with a button to hide it. */
  thumbnails?: boolean;
  /** Drawn over each page, in its box: fields, stamps, highlights. */
  overlay?: (info: PageInfo) => ReactNode;
  /** Looks for text: gives where it was found. Absent, there is no search box. */
  onSearch?: (query: string) => ReadonlyArray<SearchHit> | Promise<ReadonlyArray<SearchHit>>;
  /** More in the toolbar, at the end: a download, a print. */
  toolbar?: ReactNode;
  /** The height of the viewer: a number of px or any CSS length. 560 by default. */
  height?: number | string;
  /** The parts (`DocumentViewerToolbar`, `DocumentViewerMain`). Without them, the viewer is built from the props. */
  children?: ReactNode;
}

const THUMB = 76;

interface ViewerContext {
  label: string;
  pages: ReadonlyArray<DocumentPage>;
  total: number;
  current: number;
  goTo: (page: number) => void;
  zoom: ZoomValue;
  setZoom: (zoom: ZoomValue) => void;
  zoomBy: (direction: 1 | -1) => void;
  percent: number;
  scale: number;
  showThumbs: boolean;
  setShowThumbs: (show: boolean | ((show: boolean) => boolean)) => void;
  onSearch: DocumentViewerProps["onSearch"];
  query: string;
  setQuery: (query: string) => void;
  hits: ReadonlyArray<SearchHit>;
  hit: number;
  searched: boolean;
  search: (event?: { preventDefault: () => void }) => void;
  stepHit: (direction: 1 | -1) => void;
  clearSearch: () => void;
  scroller: { current: HTMLDivElement | null };
  onScroll: () => void;
  onKey: (event: KeyboardEvent<HTMLDivElement>) => void;
  overlay: DocumentViewerProps["overlay"];
  toolbar: ReactNode;
  info: (page: DocumentPage, index: number, scale: number) => PageInfo;
}
const ViewerCtx = createContext<ViewerContext | null>(null);

function useViewer(name: string): ViewerContext {
  const ctx = useContext(ViewerCtx);
  if (!ctx) throw new Error(`<${name}> goes inside a <DocumentViewer>.`);
  return ctx;
}

/* ---------------------------------------------------------------- parts */

/** The toolbar: thumbnails, pages, zoom, search, and your `toolbar`. */
export function DocumentViewerToolbar({ children, ...rest }: PartProps<"div">) {
  const { label, onSearch, toolbar } = useViewer("DocumentViewerToolbar");
  return part(
    "div",
    "document-viewer-toolbar",
    "fg-doc-bar",
    {
      ...rest,
      children: children ?? (
        <>
          <DocumentViewerThumbsToggle />
          <DocumentViewerSeparator />
          <DocumentViewerPager />
          <DocumentViewerSeparator />
          <DocumentViewerZoom />
          {onSearch ? (
            <>
              <DocumentViewerSeparator />
              <DocumentViewerSearch />
            </>
          ) : null}
          {toolbar ? <span className="fg-doc-extra">{toolbar}</span> : null}
        </>
      ),
    },
    { role: "toolbar", "aria-label": `${label}: view` },
  );
}

/** A thin line between groups of the toolbar. */
export function DocumentViewerSeparator(props: PartProps<"span">) {
  return part("span", "document-viewer-separator", "fg-doc-sep", props, { "aria-hidden": "true" });
}

/** Shows and hides the column of thumbnails. */
export function DocumentViewerThumbsToggle() {
  const { showThumbs, setShowThumbs } = useViewer("DocumentViewerThumbsToggle");
  return (
    <IconButton
      data-slot="document-viewer-thumbs-toggle"
      icon={SidebarLeft01Icon}
      size="sm"
      label={showThumbs ? "Hide thumbnails" : "Show thumbnails"}
      aria-pressed={showThumbs}
      onClick={() => setShowThumbs((v) => !v)}
    />
  );
}

/** Previous page, the page number to type in, next page. */
export function DocumentViewerPager({ children, ...rest }: PartProps<"span">) {
  const { current, total, goTo } = useViewer("DocumentViewerPager");
  return part("span", "document-viewer-pager", "fg-doc-pager", {
    ...rest,
    children: children ?? (
      <>
        <IconButton
          icon={ArrowLeft01Icon}
          size="sm"
          label="Previous page"
          disabled={current <= 1}
          onClick={() => goTo(current - 1)}
        />
        <label className="fg-doc-page">
          <span className="fg-sr">Page</span>
          <input
            className="fg-doc-pageinput"
            inputMode="numeric"
            aria-label="Page"
            value={String(current)}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/\D/g, ""));
              if (n) goTo(n);
            }}
            onFocus={(e) => e.currentTarget.select()}
          />
          <span aria-hidden="true">/ {total}</span>
          <span className="fg-sr">of {total}</span>
        </label>
        <IconButton
          icon={ArrowRight01Icon}
          size="sm"
          label="Next page"
          disabled={current >= total}
          onClick={() => goTo(current + 1)}
        />
      </>
    ),
  });
}

/** Zoom out, the zoom to choose, zoom in. */
export function DocumentViewerZoom({ children, ...rest }: PartProps<"span">) {
  const { zoom, setZoom, zoomBy, percent } = useViewer("DocumentViewerZoom");
  return part("span", "document-viewer-zoom", "fg-doc-zoombar", {
    ...rest,
    children: children ?? (
      <>
        <IconButton
          icon={ZoomOutIcon}
          size="sm"
          label="Zoom out"
          disabled={percent <= ZOOM_MIN}
          onClick={() => zoomBy(-1)}
        />
        <Select
          className="fg-doc-zoom"
          aria-label="Zoom"
          value={zoom === "fit" ? "fit" : String(clampZoom(zoom))}
          onChange={(e) => setZoom(e.target.value === "fit" ? "fit" : Number(e.target.value))}
          options={[
            { value: "fit", label: zoom === "fit" ? `Fit width · ${percent}%` : "Fit width" },
            ...ZOOM_STEPS.map((z) => ({ value: String(z), label: `${z}%` })),
            ...(zoom !== "fit" && !ZOOM_STEPS.includes(clampZoom(zoom))
              ? [{ value: String(clampZoom(zoom)), label: `${clampZoom(zoom)}%` }]
              : []),
          ]}
        />
        <IconButton
          icon={ZoomInIcon}
          size="sm"
          label="Zoom in"
          disabled={percent >= ZOOM_MAX}
          onClick={() => zoomBy(1)}
        />
      </>
    ),
  });
}

/** The search box, the count of matches, and previous and next match; only with `onSearch`. */
export function DocumentViewerSearch({ children, ...rest }: PartProps<"form">) {
  const { onSearch, query, setQuery, hits, hit, searched, search, stepHit, clearSearch } =
    useViewer("DocumentViewerSearch");
  if (!onSearch) return null;
  return part(
    "form",
    "document-viewer-search",
    "fg-doc-search",
    {
      ...rest,
      children: children ?? (
        <>
          <Input
            aria-label="Search the document"
            placeholder="Search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value) clearSearch();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                stepHit(-1);
              }
            }}
          />
          <IconButton icon={Search01Icon} size="sm" label="Search" type="submit" />
          {searched ? (
            <span className="fg-doc-hits" role="status">
              {hits.length === 0 ? "No match" : `${hit + 1} of ${hits.length}`}
            </span>
          ) : null}
          {hits.length > 1 ? (
            <>
              <IconButton
                icon={ArrowLeft01Icon}
                size="sm"
                label="Previous match"
                onClick={() => stepHit(-1)}
              />
              <IconButton
                icon={ArrowRight01Icon}
                size="sm"
                label="Next match"
                onClick={() => stepHit(1)}
              />
            </>
          ) : null}
        </>
      ),
    },
    { role: "search", onSubmit: search },
  );
}

/** The area under the toolbar: thumbnails and pages. */
export function DocumentViewerMain({ children, ...rest }: PartProps<"div">) {
  return part("div", "document-viewer-main", "fg-doc-main", {
    ...rest,
    children: children ?? (
      <>
        <DocumentViewerThumbs />
        <DocumentViewerPages />
      </>
    ),
  });
}

/** The column of thumbnails; not shown when hidden. */
export function DocumentViewerThumbs({ children, ...rest }: PartProps<"nav">) {
  const { label, pages, current, goTo, showThumbs, info } = useViewer("DocumentViewerThumbs");
  if (!showThumbs) return null;
  return part(
    "nav",
    "document-viewer-thumbs",
    "fg-doc-thumbs",
    {
      ...rest,
      children:
        children ??
        pages.map((p, i) => {
          const box = info(p, i, THUMB / p.width);
          return (
            <button
              key={p.id ?? i}
              type="button"
              className="fg-doc-thumb"
              data-slot="document-viewer-thumb"
              aria-label={`Page ${i + 1}`}
              aria-current={i + 1 === current ? "page" : undefined}
              onClick={() => goTo(i + 1)}
            >
              <span className="fg-doc-thumbpage" style={{ width: box.width, height: box.height }}>
                {p.src ? (
                  <img src={p.src} alt="" loading="lazy" width={box.width} height={box.height} />
                ) : (
                  p.render?.(box)
                )}
              </span>
              <span className="fg-doc-thumbno">{i + 1}</span>
            </button>
          );
        }),
    },
    { "aria-label": `${label}: pages` },
  );
}

/** One page, with the viewer's overlay over it. */
export function DocumentViewerPage({
  page,
  index,
  ...rest
}: Omit<PartProps<"div">, "children"> & { page: DocumentPage; index: number }) {
  const { total, scale, overlay, info } = useViewer("DocumentViewerPage");
  const box = info(page, index, scale);
  return part(
    "div",
    "document-viewer-page",
    "fg-doc-pagewrap",
    {
      ...rest,
      children: (
        <div className="fg-doc-page-sheet" style={{ width: box.width, height: box.height }}>
          {page.src ? (
            <img
              src={page.src}
              alt={page.alt ?? ""}
              loading={index < 2 ? "eager" : "lazy"}
              draggable={false}
              width={box.width}
              height={box.height}
            />
          ) : (
            page.render?.(box)
          )}
          {overlay ? <div className="fg-doc-overlay">{overlay(box)}</div> : null}
        </div>
      ),
    },
    { "data-page": index + 1, role: "group", "aria-label": `Page ${index + 1} of ${total}` },
  );
}

/** The scrolling region with every page; the keys change page and zoom. */
export function DocumentViewerPages({ children, ...rest }: Omit<PartProps<"div">, "onScroll">) {
  const { label, pages, scroller, onScroll, onKey } = useViewer("DocumentViewerPages");
  return part(
    "div",
    "document-viewer-pages",
    "fg-doc-scroll",
    {
      ...rest,
      children:
        children ?? pages.map((p, i) => <DocumentViewerPage key={p.id ?? i} page={p} index={i} />),
    },
    {
      ref: scroller,
      tabIndex: 0,
      role: "region",
      "aria-label": `${label}: pages. Page keys change page, plus and minus zoom, 0 fits the width.`,
      onScroll,
      onKeyDown: onKey,
    },
  );
}

/* ---------------------------------------------------------------- the viewer */

/** Pages with thumbnails, zoom, navigation, keyboard, search and an overlay per page. */
export function DocumentViewer({
  label,
  pages,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  zoom: zoomProp,
  defaultZoom = "fit",
  onZoomChange,
  thumbnails = true,
  overlay,
  onSearch,
  toolbar,
  height = 560,
  children,
  className,
  asChild,
  style,
  ...rest
}: DocumentViewerProps) {
  const total = pages.length;
  const [page, setPage] = useControllableState<number>({
    value: pageProp,
    defaultValue: defaultPage,
    onChange: onPageChange,
  });
  const [zoom, setZoom] = useControllableState<ZoomValue>({
    value: zoomProp,
    defaultValue: defaultZoom,
    onChange: onZoomChange,
  });
  const [showThumbs, setShowThumbs] = useState(thumbnails);
  const [width, setWidth] = useState(0);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ReadonlyArray<SearchHit>>([]);
  const [hit, setHit] = useState(-1);
  const [searched, setSearched] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);
  const scrolledTo = useRef<number>(0);
  const ticket = useRef(0);
  const current = clampPage(page, total);

  // The width of the scrolling area, for "fit width".
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [total]);

  const first = pages[0];
  const scale = zoom === "fit" ? fitScale(width, first?.width ?? 1) : clampZoom(zoom) / 100;
  const percent = Math.round(scale * 100);

  const goTo = (n: number) => {
    const next = clampPage(n, total);
    scrolledTo.current = next;
    setPage(next);
    const el = scroller.current?.querySelector<HTMLElement>(`[data-page="${next}"]`);
    if (el && scroller.current) {
      scroller.current.scrollTo?.({ top: el.offsetTop - 16 });
      if (!scroller.current.scrollTo) scroller.current.scrollTop = el.offsetTop - 16;
    }
  };

  // A page set from outside is scrolled to.
  useEffect(() => {
    if (scrolledTo.current !== current) {
      scrolledTo.current = current;
      const el = scroller.current?.querySelector<HTMLElement>(`[data-page="${current}"]`);
      if (el && scroller.current) scroller.current.scrollTop = el.offsetTop - 16;
    }
  }, [current]);

  // Scrolling by hand changes the page in view: the last page whose top is above a third down.
  const onScroll = () => {
    const box = scroller.current;
    if (!box) return;
    const line = box.scrollTop + box.clientHeight / 3;
    let seen = 1;
    box.querySelectorAll<HTMLElement>("[data-page]").forEach((el) => {
      if (el.offsetTop - 16 <= line) seen = Number(el.dataset.page);
    });
    if (seen !== current) {
      scrolledTo.current = seen;
      setPage(seen);
    }
  };

  const zoomBy = (direction: 1 | -1) => setZoom(stepZoom(percent, direction));

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const { key } = event;
    if (key === "PageDown" || (key === "ArrowRight" && !event.shiftKey)) {
      event.preventDefault();
      goTo(current + 1);
    } else if (key === "PageUp" || (key === "ArrowLeft" && !event.shiftKey)) {
      event.preventDefault();
      goTo(current - 1);
    } else if (key === "Home") {
      event.preventDefault();
      goTo(1);
    } else if (key === "End") {
      event.preventDefault();
      goTo(total);
    } else if (key === "+" || key === "=") {
      event.preventDefault();
      zoomBy(1);
    } else if (key === "-" || key === "_") {
      event.preventDefault();
      zoomBy(-1);
    } else if (key === "0") {
      event.preventDefault();
      setZoom("fit");
    }
  };

  const clearSearch = () => {
    setHits([]);
    setHit(-1);
    setSearched(false);
  };
  const search = async (event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    if (!onSearch) return;
    const q = query.trim();
    const mine = ++ticket.current;
    if (!q) {
      clearSearch();
      return;
    }
    const found = await onSearch(q);
    if (mine !== ticket.current) return;
    setHits(found);
    setSearched(true);
    setHit(found.length ? 0 : -1);
    if (found[0]) goTo(found[0].page);
  };
  const stepHit = (direction: 1 | -1) => {
    if (hits.length === 0) return;
    const next = (hit + direction + hits.length) % hits.length;
    setHit(next);
    goTo(hits[next]!.page);
  };

  const info = (p: DocumentPage, i: number, s: number): PageInfo => ({
    page: p,
    number: i + 1,
    scale: s,
    width: Math.round(p.width * s),
    height: Math.round(p.height * s),
  });

  const ctx: ViewerContext = {
    label,
    pages,
    total,
    current,
    goTo,
    zoom,
    setZoom,
    zoomBy,
    percent,
    scale,
    showThumbs,
    setShowThumbs,
    onSearch,
    query,
    setQuery,
    hits,
    hit,
    searched,
    search,
    stepHit,
    clearSearch,
    scroller,
    onScroll,
    onKey,
    overlay,
    toolbar,
    info,
  };

  return (
    <ViewerCtx.Provider value={ctx}>
      {part(
        "section",
        "document-viewer",
        "fg-doc",
        {
          className,
          asChild,
          ...rest,
          style: { height: typeof height === "number" ? `${height}px` : height, ...style },
          children: children ?? (
            <>
              <DocumentViewerToolbar />
              <DocumentViewerMain />
            </>
          ),
        },
        { "aria-label": label },
      )}
    </ViewerCtx.Provider>
  );
}
