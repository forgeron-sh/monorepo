import type { IconRenderOptions, IconVariant } from "@forgeron/icons";
// The renderer alone: the package entry re-exports every icon, which a page should not load.
import { toSvg } from "@forgeron/icons/render";
import { Icon } from "@forgeron/icons/react";
import { useEffect, useRef, useState } from "react";
import {
  copyText,
  download,
  importSnippet,
  rasterize,
  reactSnippet,
  type RasterFormat,
} from "../lib/export";
import type { GalleryEntry, IconData } from "../lib/loader";
import { fig } from "./parts";

type Backdrop = "dark" | "light" | "checker";

interface Settings {
  size: number;
  color: string;
  secondaryColor: string;
  secondaryOpacity: number;
  backdrop: Backdrop;
  grid: boolean;
}

const DEFAULTS: Settings = {
  size: 96,
  color: "#ededed",
  secondaryColor: "#ff4f1f",
  secondaryOpacity: 1,
  backdrop: "dark",
  grid: false,
};

/** A button that says what it did for a moment. */
function Action({
  label,
  run,
  disabled,
  primary,
}: {
  label: string;
  run: () => Promise<void> | void;
  disabled?: boolean;
  primary?: boolean;
}) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 1400);
    return () => clearTimeout(t);
  }, [state]);
  return (
    <button
      type="button"
      className={primary ? "btn btn-sm btn-primary" : "btn btn-sm"}
      disabled={disabled}
      onClick={async () => {
        try {
          await run();
          setState("done");
        } catch {
          setState("failed");
        }
      }}
    >
      <span className="sq" aria-hidden="true" />
      {state === "done" ? "Done" : state === "failed" ? "Failed" : label}
    </button>
  );
}

export function IconDetail({
  entry,
  data,
  categories,
  variant,
  onVariant,
  onClose,
  onMove,
  onCategory,
}: {
  entry: GalleryEntry;
  /** Undefined while the batch of the icon is on its way. */
  data: IconData | undefined;
  categories: readonly { id: string; label: string }[];
  variant: IconVariant;
  onVariant: (v: IconVariant) => void;
  onClose: () => void;
  onMove: (step: number) => void;
  onCategory: (id: string) => void;
}) {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const panel = useRef<HTMLDivElement>(null);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setS((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      const typing = (e.target as HTMLElement | null)?.closest("input, select, textarea");
      if (!typing && e.key === "ArrowRight") onMove(1);
      if (!typing && e.key === "ArrowLeft") onMove(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("is-locked");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("is-locked");
      previous?.focus();
    };
  }, [onClose, onMove]);

  const drawn = data?.icon;
  const duo = entry.duo && variant === "duo";
  const options: IconRenderOptions = {
    variant: duo ? "duo" : "mono",
    size: s.size,
    color: s.color,
    ...(duo ? { secondaryColor: s.secondaryColor, secondaryOpacity: s.secondaryOpacity } : {}),
  };
  const svg = drawn ? toSvg(drawn, options) : null;
  const file = (ext: string) => `${entry.name}${duo ? "-duo" : ""}-${s.size}.${ext}`;
  const raster = (format: RasterFormat) => async () => {
    if (!svg) throw new Error("Not loaded yet");
    const bg = s.backdrop === "light" ? "#ededed" : s.backdrop === "dark" ? "#0a0a0a" : null;
    download(
      await rasterize(svg, s.size, format, format === "jpg" ? (bg ?? "#0a0a0a") : null),
      file(format),
    );
  };
  const category = categories.find((c) => c.id === entry.category);
  const previewSize = Math.min(s.size, 320);
  const cell = drawn ? previewSize / drawn.grid : 0;

  return (
    <div className="detail-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        className="detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        tabIndex={-1}
      >
        <header className="detail-head">
          <div className="detail-id">
            <span className="t-mono dim">{fig(entry.index)}</span>
            <h2 id="detail-title" className="f-title f-h3">
              {entry.name}
            </h2>
            <code className="t-code muted">{data?.export ?? "…"}</code>
          </div>
          <div className="detail-nav">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onMove(-1)}
              aria-label="Previous icon"
            >
              ←
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onMove(1)}
              aria-label="Next icon"
            >
              →
            </button>
            <button type="button" className="btn btn-sm" onClick={onClose} aria-label="Close">
              Esc
            </button>
          </div>
        </header>

        <div className={`stage ticks backdrop-${s.backdrop}`}>
          <span className="stage-fig t-mono dim">
            {drawn ? `${drawn.style} · ${drawn.grid}×${drawn.grid}` : "…"} · {s.size}px
          </span>
          {drawn ? (
            <div
              className={s.grid ? "stage-art has-grid" : "stage-art"}
              style={{ width: previewSize, height: previewSize, ["--cell" as string]: `${cell}px` }}
            >
              <Icon icon={drawn} {...options} size={previewSize} />
            </div>
          ) : (
            <div className="stage-art" style={{ width: previewSize, height: previewSize }} />
          )}
          {drawn ? (
            <div className="stage-sizes" aria-label="At small sizes">
              {[16, 24, 48].map((px) => (
                <span key={px} className="stage-size">
                  <Icon icon={drawn} {...options} size={px} />
                  <span className="t-mono dim">{px}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="detail-body">
          <div className="controls">
            <div className="control">
              <span className="t-mono dim">Variant</span>
              <div className="seg" role="group" aria-label="Variant">
                {(["mono", "duo"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={(v === "duo") === duo}
                    disabled={!drawn || (v === "duo" && !entry.duo)}
                    onClick={() => onVariant(v)}
                  >
                    {v === "mono" ? "Monotone" : "Duotone"}
                  </button>
                ))}
              </div>
            </div>
            <div className="control">
              <span className="t-mono dim">Backdrop</span>
              <div className="seg" role="group" aria-label="Backdrop">
                {(["dark", "light", "checker"] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    aria-pressed={s.backdrop === b}
                    onClick={() => set("backdrop", b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <label className="control">
              <span className="t-mono dim">
                Size <span className="muted">{s.size}px</span>
              </span>
              <input
                type="range"
                min={12}
                max={512}
                step={drawn ? drawn.grid : 4}
                value={s.size}
                onChange={(e) => set("size", Number(e.target.value))}
              />
            </label>
            <div className="control control-row">
              <label className="swatch">
                <input
                  type="color"
                  value={s.color}
                  onChange={(e) => set("color", e.target.value)}
                />
                <span className="t-mono">
                  Primary <span className="muted">{s.color}</span>
                </span>
              </label>
              <label className={duo ? "swatch" : "swatch is-off"}>
                <input
                  type="color"
                  value={s.secondaryColor}
                  disabled={!duo}
                  onChange={(e) => set("secondaryColor", e.target.value)}
                />
                <span className="t-mono">
                  Secondary <span className="muted">{s.secondaryColor}</span>
                </span>
              </label>
            </div>
            {duo ? (
              <label className="control">
                <span className="t-mono dim">
                  Secondary opacity{" "}
                  <span className="muted">{Math.round(s.secondaryOpacity * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={s.secondaryOpacity}
                  onChange={(e) => set("secondaryOpacity", Number(e.target.value))}
                />
              </label>
            ) : null}
            {drawn ? (
              <label className="control control-check">
                <input
                  type="checkbox"
                  checked={s.grid}
                  onChange={(e) => set("grid", e.target.checked)}
                />
                <span className="t-mono">Show the pixel grid</span>
              </label>
            ) : null}
          </div>

          <div className="actions">
            <span className="t-mono dim">Copy</span>
            <div className="actions-row">
              <Action label="SVG" primary disabled={!svg} run={() => copyText(svg ?? "")} />
              <Action
                label="React"
                disabled={!data}
                run={() => copyText(data ? reactSnippet(data, options) : "")}
              />
              <Action
                label="Import"
                disabled={!data}
                run={() => copyText(data ? importSnippet(data) : "")}
              />
              <Action label="Name" run={() => copyText(entry.name)} />
            </div>
            <span className="t-mono dim">Download</span>
            <div className="actions-row">
              <Action
                label="SVG"
                disabled={!svg}
                run={() => download(new Blob([svg ?? ""], { type: "image/svg+xml" }), file("svg"))}
              />
              <Action label="PNG" disabled={!svg} run={raster("png")} />
              <Action label="JPG" disabled={!svg} run={raster("jpg")} />
              <Action label="WEBP" disabled={!svg} run={raster("webp")} />
            </div>
          </div>

          <pre className="snippet t-code">{data ? reactSnippet(data, options) : "…"}</pre>

          <dl className="spec">
            <dt className="t-mono">Category</dt>
            <dd>
              <button type="button" className="link-btn" onClick={() => onCategory(entry.category)}>
                {category?.label ?? entry.category} →
              </button>
            </dd>
            <dt className="t-mono">Description</dt>
            <dd>{data?.description ?? "…"}</dd>
            <dt className="t-mono">Variants</dt>
            <dd className="t-mono">
              mono · {entry.duo ? "duo" : <span className="dim">duo</span>}
            </dd>
            {entry.aliases.length > 0 ? (
              <>
                <dt className="t-mono">Aliases</dt>
                <dd className="t-code">{entry.aliases.join(", ")}</dd>
              </>
            ) : null}
            {data?.reference ? (
              <>
                <dt className="t-mono">Reference</dt>
                <dd>{data.reference}</dd>
              </>
            ) : null}
            {data?.trademark ? (
              <>
                <dt className="t-mono">Trademark</dt>
                <dd>
                  <span className="chip on">Third-party brand</span> {data.trademark}
                </dd>
              </>
            ) : null}
            <dt className="t-mono">Labels</dt>
            <dd className="labels">
              {[...entry.name.split("-"), ...entry.labels].map((l) => (
                <span key={l} className="chip">
                  {l}
                </span>
              ))}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
