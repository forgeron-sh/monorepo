// The banner of a page: a gallery of generated pixel patterns (drawn from the tokens, in ember, ink
// or grey), a picture uploaded or linked, a position you drag or set with the arrows, and a way to
// remove it. `CoverArt` draws a cover anywhere; `CoverPicker` is the panel that chooses one.

import { Cancel01Icon, Image01Icon } from "@forgeron/icons";
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Button } from "../button";
import { Segmented } from "../controls";
import { cx } from "../cx";
import { FileInput, type FileInputProps } from "../file-input";
import { Field, Input } from "../form";
import { useControllableState } from "../hooks/use-controllable";
import { Icon } from "../icon";
import {
  STRUCTURE_COVER_COLS,
  STRUCTURE_COVER_PATTERNS,
  STRUCTURE_COVER_ROWS,
  structureClampPercent,
  structureCoverCells,
  structureCoverPath,
  structureSafeImageUrl,
  type StructureCoverPattern,
} from "./structure-model";

export type CoverTone = "accent" | "ink" | "muted";

export type CoverValue =
  | {
      type: "pattern";
      pattern: StructureCoverPattern;
      tone: CoverTone;
    }
  | {
      type: "image";
      /** A web address, a path, a `blob:` or a `data:` image. */
      src: string;
      /** What the picture is, for assistive technology. */
      alt?: string;
      /** Where the picture is held in the banner, 0 (top) to 100 (bottom). Default 50. */
      position?: number;
    };

export interface CoverArtProps {
  value: CoverValue;
  /** The height in px. The width is the container's. Default 120. */
  height?: number;
  className?: string;
}

const paths = new Map<StructureCoverPattern, string>();
const pathOf = (pattern: StructureCoverPattern) => {
  let d = paths.get(pattern);
  if (d === undefined) {
    d = structureCoverPath(
      structureCoverCells(pattern, STRUCTURE_COVER_COLS, STRUCTURE_COVER_ROWS),
      STRUCTURE_COVER_COLS,
      STRUCTURE_COVER_ROWS,
    );
    paths.set(pattern, d);
  }
  return d;
};

const TONE: Record<CoverTone, string> = {
  accent: "var(--accent)",
  ink: "var(--ink)",
  muted: "var(--line-strong)",
};

/** A cover: a pixel pattern in a tone of the tokens, or a picture held at its position. */
export function CoverArt({ value, height = 120, className }: CoverArtProps) {
  if (value.type === "image") {
    const src = structureSafeImageUrl(value.src);
    return (
      <div className={cx("fg-cover", className)} style={{ height }}>
        {src ? (
          <img
            src={src}
            alt={value.alt ?? ""}
            className="fg-cover-img"
            style={{ objectPosition: `50% ${value.position ?? 50}%` }}
            draggable={false}
          />
        ) : null}
      </div>
    );
  }
  return (
    <div className={cx("fg-cover", className)} style={{ height }}>
      <svg
        className="fg-cover-art"
        viewBox={`0 0 ${STRUCTURE_COVER_COLS} ${STRUCTURE_COVER_ROWS}`}
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="crispEdges"
        aria-hidden="true"
        focusable="false"
      >
        <path d={pathOf(value.pattern)} fill={TONE[value.tone]} />
      </svg>
    </div>
  );
}

export interface CoverPickerProps {
  /** The cover now; `null` for none. */
  value?: CoverValue | null;
  defaultValue?: CoverValue | null;
  onChange?: (value: CoverValue | null) => void;
  /** The patterns offered. Default all of them. */
  patterns?: ReadonlyArray<StructureCoverPattern>;
  /** The tones offered. Default ember, ink and grey. */
  tones?: ReadonlyArray<CoverTone>;
  /** The upload tab. `false` leaves it out. Default `true`. */
  upload?: boolean;
  /**
   * Stores a file chosen and gives back the address to keep. Without it the picture is kept as a
   * `blob:` address of this page, which is gone after a reload.
   */
  onUpload?: (file: File) => string | Promise<string>;
  /** The link tab. `false` leaves it out. Default `true`. */
  link?: boolean;
  /** Types and size of the upload; see `FileInput`. Default pictures up to 5 MB. */
  uploadOptions?: Pick<FileInputProps, "accept" | "maxSize">;
  /** Names the panel. Default "Cover". */
  label?: string;
  className?: string;
}

const TONES: ReadonlyArray<CoverTone> = ["accent", "ink", "muted"];
const TONE_NAME: Record<CoverTone, string> = { accent: "Ember", ink: "Ink", muted: "Grey" };

type Tab = "gallery" | "upload" | "link";

/** The panel to choose a page's cover: patterns, a picture, a link, its position, and removal. */
export function CoverPicker({
  value,
  defaultValue = null,
  onChange,
  patterns = STRUCTURE_COVER_PATTERNS,
  tones = TONES,
  upload = true,
  onUpload,
  link = true,
  uploadOptions,
  label = "Cover",
  className,
}: CoverPickerProps) {
  const [cover, setCover] = useControllableState<CoverValue | null>({
    value,
    defaultValue,
    onChange,
  });
  const tabs: Array<{ value: Tab; label: string }> = [
    { value: "gallery", label: "Gallery" },
    ...(upload ? [{ value: "upload" as const, label: "Upload" }] : []),
    ...(link ? [{ value: "link" as const, label: "Link" }] : []),
  ];
  const [tab, setTab] = useState<Tab>("gallery");
  const [tone, setTone] = useState<CoverTone>(
    cover?.type === "pattern" ? cover.tone : (tones[0] ?? "accent"),
  );
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const id = useId();
  const drag = useRef<{ y: number; from: number; height: number } | null>(null);

  const position = cover?.type === "image" ? (cover.position ?? 50) : 50;
  const setPosition = (next: number) => {
    if (cover?.type === "image") setCover({ ...cover, position: structureClampPercent(next) });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (cover?.type !== "image") return;
    drag.current = { y: e.clientY, from: position, height: e.currentTarget.clientHeight || 1 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    // Dragging the picture down shows more of its top.
    setPosition(d.from - ((e.clientY - d.y) / d.height) * 100);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const next =
      e.key === "ArrowUp" || e.key === "ArrowLeft"
        ? position - step
        : e.key === "ArrowDown" || e.key === "ArrowRight"
          ? position + step
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? 100
              : null;
    if (next === null) return;
    e.preventDefault();
    setPosition(next);
  };

  const pick = (file: File | undefined) => {
    if (!file) return;
    setError("");
    const done = (src: string) => {
      setCover({ type: "image", src, alt: file.name, position: 50 });
      setBusy(false);
    };
    if (!onUpload) return done(URL.createObjectURL(file));
    setBusy(true);
    Promise.resolve(onUpload(file)).then(
      (src) =>
        structureSafeImageUrl(src)
          ? done(src)
          : (setBusy(false), setError("The upload gave back an address that cannot be shown.")),
      () => {
        setBusy(false);
        setError("The upload failed. Try again.");
      },
    );
  };

  const addLink = () => {
    const src = structureSafeImageUrl(url);
    if (!src) {
      setError("Use a picture address that starts with https://, or a path.");
      return;
    }
    setError("");
    setCover({ type: "image", src, position: 50 });
    setUrl("");
  };

  return (
    <div className={cx("fg-coverpick", className)} role="group" aria-label={label}>
      <div className="fg-coverpick-stage">
        {cover ? (
          <div
            className={cx("fg-coverpick-view", cover.type === "image" && "fg-coverpick-adjust")}
            {...(cover.type === "image"
              ? {
                  role: "slider",
                  tabIndex: 0,
                  "aria-label": "Cover position",
                  "aria-orientation": "vertical" as const,
                  "aria-valuemin": 0,
                  "aria-valuemax": 100,
                  "aria-valuenow": position,
                  "aria-valuetext": `${position}% from the top`,
                  onPointerDown,
                  onPointerMove,
                  onPointerUp: () => (drag.current = null),
                  onPointerCancel: () => (drag.current = null),
                  onKeyDown,
                }
              : {})}
          >
            <CoverArt value={cover} height={96} />
            {cover.type === "image" ? (
              <span className="fg-coverpick-tip" aria-hidden="true">
                Drag to reposition
              </span>
            ) : null}
          </div>
        ) : (
          <div className="fg-coverpick-none">
            <Icon icon={Image01Icon} size={24} variant="mono" />
            No cover
          </div>
        )}
        {cover ? (
          <Button size="sm" onClick={() => setCover(null)}>
            <Icon icon={Cancel01Icon} size={12} variant="mono" />
            Remove
          </Button>
        ) : null}
      </div>

      {tabs.length > 1 ? (
        <Segmented
          label="Source"
          options={tabs}
          value={tab}
          onChange={(v) => {
            setTab(v as Tab);
            setError("");
          }}
        />
      ) : null}

      {tab === "gallery" ? (
        <div className="fg-coverpick-panel">
          {tones.length > 1 ? (
            <div role="group" aria-label="Tone" className="fg-coverpick-tones">
              {tones.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="fg-coverpick-tone"
                  aria-pressed={tone === t}
                  onClick={() => {
                    setTone(t);
                    if (cover?.type === "pattern") setCover({ ...cover, tone: t });
                  }}
                >
                  <i style={{ background: TONE[t] }} aria-hidden="true" />
                  {TONE_NAME[t]}
                </button>
              ))}
            </div>
          ) : null}
          <div role="group" aria-label="Patterns" className="fg-coverpick-grid">
            {patterns.map((p) => {
              const on = cover?.type === "pattern" && cover.pattern === p;
              return (
                <button
                  key={p}
                  type="button"
                  className={cx("fg-coverpick-tile", on && "fg-coverpick-tile-on")}
                  aria-pressed={on}
                  aria-label={p}
                  onClick={() => setCover({ type: "pattern", pattern: p, tone })}
                >
                  <CoverArt value={{ type: "pattern", pattern: p, tone }} height={40} />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === "upload" ? (
        <div className="fg-coverpick-panel">
          <FileInput
            label="Cover picture"
            accept={uploadOptions?.accept ?? "image/*"}
            maxSize={uploadOptions?.maxSize ?? 5 * 1024 * 1024}
            hint="Drop a picture here, or"
            value={[]}
            onChange={(files) => pick(files[0])}
            onReject={() => setError("Choose a picture of 5 MB or less.")}
          />
          {busy ? <p className="fg-coverpick-note">Uploading…</p> : null}
        </div>
      ) : null}

      {tab === "link" ? (
        <form
          className="fg-coverpick-panel fg-coverpick-link"
          onSubmit={(e) => {
            e.preventDefault();
            addLink();
          }}
        >
          <Field label="Picture address">
            {(control) => (
              <Input
                {...control}
                value={url}
                placeholder="https://"
                inputMode="url"
                onChange={(e) => setUrl(e.target.value)}
                aria-describedby={error ? `${id}-error` : control["aria-describedby"]}
              />
            )}
          </Field>
          <Button type="submit" variant="ink">
            Use picture
          </Button>
        </form>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="fg-coverpick-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
