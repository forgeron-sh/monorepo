// A signature taken three ways: drawn with a pointer (smoothed strokes, undo, clear), typed in a
// choice of fonts, or uploaded as an image. It gives back a PNG data URL (an SVG one where a canvas
// is missing). From the keyboard, the Type and Upload tabs stand in for drawing, and the drawing
// area itself takes a pen: Space puts it down or lifts it, the arrows move it.
// With children, `SignaturePad` is the root of its parts (`SignaturePadModes`, `SignaturePadDraw`,
// `SignaturePadType`, `SignaturePadUpload`, `SignaturePadPreview`); without, the props-driven pad
// built from them (D-157).

import { Delete02Icon, Undo02Icon } from "@forgeron/icons";
import type {
  ComponentProps,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from "react";
import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { Button } from "./button";
import { Segmented } from "./controls";
import { cx } from "./cx";
import { FileInput } from "./file-input";
import { Input } from "./form";
import { useControllableState } from "./hooks/use-controllable";
import { Icon } from "./icon";

export type SignatureMode = "draw" | "type" | "upload";

export interface SignatureValue {
  /** `data:image/png;base64,…` (SVG when the browser has no canvas). */
  dataUrl: string;
  method: SignatureMode;
  /** The name typed, for `type`. */
  text?: string;
  /** The font id chosen, for `type`. */
  font?: string;
}

export interface SignatureFont {
  id: string;
  label: string;
  /** A CSS `font-family` list; system fonts, since the image is drawn on a canvas. */
  family: string;
  italic?: boolean;
}

export const SIGNATURE_FONTS: ReadonlyArray<SignatureFont> = [
  {
    id: "script",
    label: "Script",
    family: '"Snell Roundhand", "Segoe Script", "Brush Script MT", cursive',
  },
  {
    id: "hand",
    label: "Handwriting",
    family: '"Bradley Hand", "Marker Felt", "Comic Sans MS", cursive',
  },
  { id: "serif", label: "Serif italic", family: 'Georgia, "Times New Roman", serif', italic: true },
  { id: "type", label: "Typewriter", family: '"Courier New", ui-monospace, monospace' },
];

/* ---------------------------------------------------------------- pure helpers */

export interface Point {
  x: number;
  y: number;
}
export type Stroke = ReadonlyArray<Point>;

/** The stroke with `point` added, unless it is closer than `minDistance` to the last one. */
export function addPoint(stroke: Stroke, point: Point, minDistance = 1.5): Point[] {
  const last = stroke[stroke.length - 1];
  if (last && Math.hypot(point.x - last.x, point.y - last.y) < minDistance) return [...stroke];
  return [...stroke, point];
}

export interface Curve {
  /** The control point: a point of the stroke. */
  cx: number;
  cy: number;
  /** Where the curve ends: halfway to the next point. */
  x: number;
  y: number;
}

/** The smoothing: quadratic curves through the middles of the points, the points as controls. */
export function smoothStroke(stroke: Stroke): Curve[] {
  const out: Curve[] = [];
  for (let i = 1; i < stroke.length - 1; i++) {
    const a = stroke[i]!;
    const b = stroke[i + 1]!;
    out.push({ cx: a.x, cy: a.y, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  }
  return out;
}

const r = (n: number) => Math.round(n * 100) / 100;

/** An SVG path of the strokes, smoothed. A single point is a dot. */
export function strokesPath(strokes: ReadonlyArray<Stroke>): string {
  return strokes
    .filter((s) => s.length > 0)
    .map((s) => {
      const first = s[0]!;
      if (s.length === 1)
        return `M${r(first.x - 0.1)} ${r(first.y)}L${r(first.x + 0.1)} ${r(first.y)}`;
      let d = `M${r(first.x)} ${r(first.y)}`;
      if (s.length === 2) return `${d}L${r(s[1]!.x)} ${r(s[1]!.y)}`;
      const mid = { x: (first.x + s[1]!.x) / 2, y: (first.y + s[1]!.y) / 2 };
      d += `L${r(mid.x)} ${r(mid.y)}`;
      for (const c of smoothStroke(s)) d += `Q${r(c.cx)} ${r(c.cy)} ${r(c.x)} ${r(c.y)}`;
      const last = s[s.length - 1]!;
      return `${d}L${r(last.x)} ${r(last.y)}`;
    })
    .join("");
}

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The box around all the strokes, or null when there are none. */
export function strokesBounds(strokes: ReadonlyArray<Stroke>): Bounds | null {
  const pts = strokes.flat();
  if (pts.length === 0) return null;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** True when nothing is drawn. */
export const isBlankSignature = (strokes: ReadonlyArray<Stroke>): boolean =>
  strokes.every((s) => s.length === 0);

const PAD = 8;
const LINE = 3;

/** The strokes as an SVG image, cropped to the drawing, in a data URL. */
export function strokesSvgDataUrl(strokes: ReadonlyArray<Stroke>, ink: string): string {
  const b = strokesBounds(strokes);
  if (!b) return "";
  const w = Math.ceil(b.w + PAD * 2);
  const h = Math.ceil(b.h + PAD * 2);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<path transform="translate(${r(PAD - b.x)} ${r(PAD - b.y)})" d="${strokesPath(strokes)}" ` +
    `fill="none" stroke="${ink}" stroke-width="${LINE}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** A name typed, as an SVG image in a data URL. */
export function textSvgDataUrl(text: string, font: SignatureFont, ink: string): string {
  const clean = text.trim();
  if (!clean) return "";
  const size = 64;
  const w = Math.ceil(clean.length * size * 0.6 + PAD * 2);
  const h = size + PAD * 2;
  const esc = clean.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const family = font.family.replace(/"/g, "'");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<text x="${PAD}" y="${size}" fill="${ink}" font-size="${size}" font-family="${family}"` +
    `${font.italic ? ' font-style="italic"' : ""}>${esc}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** A data URL as a Blob, to upload or to keep. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const head = dataUrl.slice(5, comma);
  const type = head.split(";")[0] || "application/octet-stream";
  const body = dataUrl.slice(comma + 1);
  if (head.includes(";base64")) {
    const bin = atob(body);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type });
  }
  return new Blob([decodeURIComponent(body)], { type });
}

/** The image of a signature, as a Blob (PNG when drawn on a canvas). */
export const signatureBlob = (value: SignatureValue): Blob => dataUrlToBlob(value.dataUrl);

/* ---------------------------------------------------------------- canvas */

const CW = 900;
const CH = 300;

function paint(canvas: HTMLCanvasElement, strokes: ReadonlyArray<Stroke>, ink: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = LINE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of strokes) {
    if (s.length === 0) continue;
    const first = s[0]!;
    if (s.length === 1) {
      ctx.beginPath();
      ctx.arc(first.x, first.y, LINE / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    if (s.length === 2) ctx.lineTo(s[1]!.x, s[1]!.y);
    else {
      ctx.lineTo((first.x + s[1]!.x) / 2, (first.y + s[1]!.y) / 2);
      for (const c of smoothStroke(s)) ctx.quadraticCurveTo(c.cx, c.cy, c.x, c.y);
      const last = s[s.length - 1]!;
      ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
  }
}

/** A PNG of the strokes cropped to the drawing, or an SVG when no canvas exists. */
function exportStrokes(strokes: ReadonlyArray<Stroke>, ink: string): string {
  const b = strokesBounds(strokes);
  if (!b) return "";
  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(b.w + PAD * 2);
    canvas.height = Math.ceil(b.h + PAD * 2);
    if (!canvas.getContext("2d")) throw new Error("no canvas");
    const moved = strokes.map((s) => s.map((p) => ({ x: p.x - b.x + PAD, y: p.y - b.y + PAD })));
    paint(canvas, moved, ink);
    const url = canvas.toDataURL("image/png");
    if (url.startsWith("data:image/png")) return url;
  } catch {
    // No canvas: fall through.
  }
  return strokesSvgDataUrl(strokes, ink);
}

function exportText(text: string, font: SignatureFont, ink: string): string {
  const clean = text.trim();
  if (!clean) return "";
  try {
    const size = 96;
    const spec = `${font.italic ? "italic " : ""}${size}px ${font.family}`;
    const probe = document.createElement("canvas").getContext("2d");
    if (!probe) throw new Error("no canvas");
    probe.font = spec;
    const width = Math.ceil(probe.measureText(clean).width);
    const canvas = document.createElement("canvas");
    canvas.width = width + PAD * 2;
    canvas.height = Math.ceil(size * 1.5) + PAD * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.font = spec;
    ctx.fillStyle = ink;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(clean, PAD, PAD + size);
    const url = canvas.toDataURL("image/png");
    if (url.startsWith("data:image/png")) return url;
  } catch {
    // No canvas: fall through.
  }
  return textSvgDataUrl(clean, font, ink);
}

/* ---------------------------------------------------------------- component */

export interface SignaturePadProps extends Omit<
  ComponentProps<"div">,
  "onChange" | "defaultValue" | "children" | "className"
> {
  /** Names the pad: "Your signature". */
  label?: string;
  value?: SignatureValue | null;
  defaultValue?: SignatureValue | null;
  /** Hears each finished stroke, each change of the typed name, each file; null when cleared. */
  onChange?: (value: SignatureValue | null) => void;
  /** Which ways to sign, in order. All three by default. */
  modes?: ReadonlyArray<SignatureMode>;
  mode?: SignatureMode;
  defaultMode?: SignatureMode;
  onModeChange?: (mode: SignatureMode) => void;
  /** The fonts of the Type tab. Default `SIGNATURE_FONTS`. */
  fonts?: ReadonlyArray<SignatureFont>;
  /** The colour of the exported image; the page's dark ink by default, whatever the theme. */
  ink?: string;
  /** The name to start the Type tab with. */
  defaultText?: string;
  /** Biggest image accepted on the Upload tab, in bytes; 2 MB by default. */
  maxUploadSize?: number;
  disabled?: boolean;
  /** The parts of a composed pad. Without them, the pad draws all of its parts. */
  children?: ReactNode;
  className?: string;
}

const MODE_LABELS: Record<SignatureMode, string> = { draw: "Draw", type: "Type", upload: "Upload" };

const inkOf = (el: Element | null, fallback: string) => {
  if (!el || typeof getComputedStyle === "undefined") return fallback;
  return getComputedStyle(el).getPropertyValue("--accent-ink").trim() || fallback;
};

interface PadState {
  label: string;
  modes: ReadonlyArray<SignatureMode>;
  mode: SignatureMode;
  setMode: (mode: SignatureMode) => void;
  fonts: ReadonlyArray<SignatureFont>;
  fontId: string;
  setFontId: (id: string) => void;
  text: string;
  emitText: (text: string, font: SignatureFont | undefined) => void;
  font: SignatureFont | undefined;
  strokes: ReadonlyArray<Stroke>;
  hintId: string;
  onDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onUp: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onKey: (event: KeyboardEvent<HTMLCanvasElement>) => void;
  undo: () => void;
  clear: () => void;
  files: File[];
  upload: (files: File[]) => void;
  problem: string;
  setProblem: (problem: string) => void;
  maxUploadSize: number;
  preview: SignatureValue | null;
  disabled: boolean | undefined;
}

const PadContext = createContext<PadState | null>(null);
/** The drawing canvas, shared with the part that places it. */
const CanvasContext = createContext<RefObject<HTMLCanvasElement | null> | null>(null);

function usePad(): PadState {
  const state = useContext(PadContext);
  if (!state) throw new Error("SignaturePad parts go inside <SignaturePad>.");
  return state;
}

/**
 * Draw, type or upload a signature; keyboard users have the Type and Upload tabs and a pen. With
 * children: the root of the parts; without: all of them, in the usual order.
 */
export function SignaturePad({
  label = "Signature",
  value,
  defaultValue = null,
  onChange,
  modes = ["draw", "type", "upload"],
  mode: modeProp,
  defaultMode,
  onModeChange,
  fonts = SIGNATURE_FONTS,
  ink,
  defaultText = "",
  maxUploadSize = 2 * 1024 * 1024,
  disabled,
  children,
  className,
  ...rest
}: SignaturePadProps) {
  const [current, setCurrent] = useControllableState<SignatureValue | null>({
    value,
    defaultValue,
    onChange,
  });
  const [mode, setMode] = useControllableState<SignatureMode>({
    value: modeProp,
    defaultValue: defaultMode ?? modes[0] ?? "draw",
    onChange: onModeChange,
  });
  const [strokes, setStrokes] = useState<ReadonlyArray<Stroke>>([]);
  const [text, setText] = useState(defaultText);
  const [fontId, setFontId] = useState(fonts[0]?.id ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [problem, setProblem] = useState("");
  const [pen, setPen] = useState<{ x: number; y: number; down: boolean } | null>(null);
  const [said, setSaid] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<number | null>(null);
  const hintId = useId();
  const font = fonts.find((f) => f.id === fontId) ?? fonts[0];

  const exportInk = () => ink ?? inkOf(canvas.current ?? document.body, "#0a0a0a");

  // The drawing on the canvas follows the strokes, in the ink of the theme.
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const shown =
      typeof getComputedStyle === "undefined" ? "#fff" : getComputedStyle(el).color || "#fff";
    paint(el, strokes, shown);
    if (pen && !pen.down) {
      const ctx = el.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = shown;
        ctx.lineWidth = 1;
        ctx.strokeRect(pen.x - 5, pen.y - 5, 10, 10);
      }
    }
  }, [strokes, pen, mode]);

  // A value cleared from outside clears the drawing (state adjusted while rendering).
  const [seen, setSeen] = useState(current);
  if (current !== seen) {
    setSeen(current);
    if (current === null) {
      setStrokes([]);
      setFiles([]);
    }
  }

  const emitStrokes = (next: ReadonlyArray<Stroke>) => {
    setStrokes(next);
    setCurrent(
      isBlankSignature(next) ? null : { dataUrl: exportStrokes(next, exportInk()), method: "draw" },
    );
  };

  const emitText = (nextText: string, nextFont: SignatureFont | undefined) => {
    setText(nextText);
    if (!nextFont || !nextText.trim()) return setCurrent(null);
    setCurrent({
      dataUrl: exportText(nextText, nextFont, exportInk()),
      method: "type",
      text: nextText.trim(),
      font: nextFont.id,
    });
  };

  const at = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / (rect.width || CW)) * CW,
      y: ((event.clientY - rect.top) / (rect.height || CH)) * CH,
    };
  };

  const onDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled || event.button > 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawing.current = event.pointerId;
    setPen(null);
    setStrokes((s) => [...s, [at(event)]]);
  };
  const onMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (drawing.current !== event.pointerId) return;
    const p = at(event);
    setStrokes((s) => {
      const last = s[s.length - 1];
      return last ? [...s.slice(0, -1), addPoint(last, p)] : s;
    });
  };
  const onUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (drawing.current !== event.pointerId) return;
    drawing.current = null;
    emitStrokes(strokes);
  };

  const undo = () => {
    if (strokes.length === 0) return;
    emitStrokes(strokes.slice(0, -1));
    setPen((p) => (p ? { ...p, down: false } : p));
    setSaid("Last stroke removed.");
  };
  const clear = () => {
    setPen(null);
    emitStrokes([]);
    setSaid("Signature cleared.");
  };

  const onKey = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const { key } = event;
    if ((event.metaKey || event.ctrlKey) && key.toLowerCase() === "z") {
      event.preventDefault();
      return undo();
    }
    if (key === "Backspace" || key === "Delete") {
      event.preventDefault();
      return undo();
    }
    if (key === "Escape") return;
    const step = event.shiftKey ? 24 : 6;
    const dx = key === "ArrowRight" ? step : key === "ArrowLeft" ? -step : 0;
    const dy = key === "ArrowDown" ? step : key === "ArrowUp" ? -step : 0;
    const here = pen ?? { x: CW / 2, y: CH / 2, down: false };
    if (key === " " || key === "Enter") {
      event.preventDefault();
      if (here.down) {
        emitStrokes(strokes);
        setPen({ ...here, down: false });
        setSaid("Pen lifted.");
      } else {
        setStrokes((s) => [...s, [{ x: here.x, y: here.y }]]);
        setPen({ ...here, down: true });
        setSaid("Pen down. Use the arrow keys to draw.");
      }
      return;
    }
    if (dx || dy) {
      event.preventDefault();
      const next = {
        x: Math.min(Math.max(here.x + dx, 0), CW),
        y: Math.min(Math.max(here.y + dy, 0), CH),
        down: here.down,
      };
      if (here.down) {
        setStrokes((s) => {
          const last = s[s.length - 1];
          return last ? [...s.slice(0, -1), [...last, { x: next.x, y: next.y }]] : s;
        });
      }
      setPen(next);
    }
  };

  const upload = (picked: File[]) => {
    setFiles(picked);
    setProblem("");
    const file = picked[0];
    if (!file) return setCurrent(null);
    const reader = new FileReader();
    reader.onload = () => setCurrent({ dataUrl: String(reader.result), method: "upload" });
    reader.onerror = () => setProblem("This image could not be read. Try another file.");
    reader.readAsDataURL(file);
  };

  const state: PadState = {
    label,
    modes,
    mode,
    setMode,
    fonts,
    fontId,
    setFontId,
    text,
    emitText,
    font,
    strokes,
    hintId,
    onDown,
    onMove,
    onUp,
    onKey,
    undo,
    clear,
    files,
    upload,
    problem,
    setProblem,
    maxUploadSize,
    preview: current?.method === mode ? current : null,
    disabled,
  };

  return (
    <PadContext.Provider value={state}>
      <CanvasContext.Provider value={canvas}>
        <div
          role="group"
          aria-label={label}
          data-slot="signature-pad"
          {...rest}
          className={cx("fg-sig", disabled && "fg-sig-disabled", className)}
        >
          {children ?? (
            <>
              <SignaturePadModes />
              <SignaturePadDraw />
              <SignaturePadType />
              <SignaturePadUpload />
              <SignaturePadPreview />
            </>
          )}
          <p className="fg-sr" role="status" aria-live="polite">
            {said}
          </p>
        </div>
      </CanvasContext.Provider>
    </PadContext.Provider>
  );
}

/** The tabs that choose how to sign; hidden when only one way is offered. */
export function SignaturePadModes({ className, ...rest }: { className?: string }) {
  const pad = usePad();
  if (pad.modes.length < 2) return null;
  return (
    <Segmented
      data-slot="signature-pad-modes"
      {...rest}
      {...(className ? { className } : {})}
      label={`${pad.label}: how to sign`}
      options={pad.modes.map((m) => ({ value: m, label: MODE_LABELS[m] }))}
      value={pad.mode}
      onChange={(m) => pad.setMode(m as SignatureMode)}
    />
  );
}

/** The drawing area with its hint, Undo and Clear; shown in the draw mode. */
export function SignaturePadDraw({ className, ...rest }: Omit<ComponentProps<"div">, "children">) {
  const pad = usePad();
  const canvas = useContext(CanvasContext);
  if (pad.mode !== "draw") return null;
  const { disabled, strokes } = pad;
  return (
    <div data-slot="signature-pad-draw" {...rest} className={cx("fg-sig-draw", className)}>
      <div className="fg-sig-surface">
        <canvas
          ref={canvas}
          className="fg-sig-canvas"
          width={CW}
          height={CH}
          tabIndex={disabled ? -1 : 0}
          role="img"
          aria-label={`${pad.label} drawing area`}
          aria-describedby={pad.hintId}
          onPointerDown={pad.onDown}
          onPointerMove={pad.onMove}
          onPointerUp={pad.onUp}
          onPointerCancel={pad.onUp}
          onKeyDown={pad.onKey}
        />
        {strokes.length === 0 ? (
          <span className="fg-sig-placeholder" aria-hidden="true">
            Sign here
          </span>
        ) : null}
        <i className="fg-sig-baseline" aria-hidden="true" />
      </div>
      <p id={pad.hintId} className="fg-sig-hint">
        Draw with a pointer. From the keyboard: Space puts the pen down or lifts it, the arrows move
        it, Backspace undoes. Or use the Type or Upload tab.
      </p>
      <div className="fg-sig-actions">
        <Button size="sm" onClick={pad.undo} disabled={disabled || strokes.length === 0}>
          <Icon icon={Undo02Icon} size={12} variant="mono" />
          Undo
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={pad.clear}
          disabled={disabled || strokes.length === 0}
        >
          <Icon icon={Delete02Icon} size={12} variant="mono" />
          Clear
        </Button>
      </div>
    </div>
  );
}

/** The name field and the choice of fonts; shown in the type mode. */
export function SignaturePadType({ className, ...rest }: Omit<ComponentProps<"div">, "children">) {
  const pad = usePad();
  if (pad.mode !== "type") return null;
  const { disabled, label, text, fonts, fontId } = pad;
  return (
    <div data-slot="signature-pad-type" {...rest} className={cx("fg-sig-type", className)}>
      <Input
        aria-label={`${label}: your name`}
        placeholder="Type your name"
        value={text}
        disabled={disabled}
        onChange={(e) => pad.emitText(e.target.value, pad.font)}
      />
      <div className="fg-sig-fonts" role="radiogroup" aria-label={`${label}: style`}>
        {fonts.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={f.id === fontId}
            aria-label={f.label}
            disabled={disabled}
            className="fg-sig-font"
            onClick={() => {
              pad.setFontId(f.id);
              pad.emitText(text, f);
            }}
          >
            <span
              className="fg-sig-sample"
              style={{ fontFamily: f.family, fontStyle: f.italic ? "italic" : "normal" }}
            >
              {text.trim() || "Your name"}
            </span>
            <span className="fg-sig-fontname">{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** The image chooser; shown in the upload mode. */
export function SignaturePadUpload({
  className,
  ...rest
}: Omit<ComponentProps<"div">, "children">) {
  const pad = usePad();
  if (pad.mode !== "upload") return null;
  return (
    <div data-slot="signature-pad-upload" {...rest} className={cx("fg-sig-upload", className)}>
      <FileInput
        label={`${pad.label}: image`}
        accept="image/png,image/jpeg,image/svg+xml"
        maxSize={pad.maxUploadSize}
        value={pad.files}
        disabled={pad.disabled}
        hint="Drop an image of your signature here, or"
        onChange={pad.upload}
        onReject={() => pad.setProblem("Use a PNG, JPEG or SVG image under the size limit.")}
      />
      {pad.problem ? (
        <p className="fg-sig-problem" role="alert">
          {pad.problem}
        </p>
      ) : null}
    </div>
  );
}

/** The image made from a typed name or an uploaded file; nothing while drawing. */
export function SignaturePadPreview({
  className,
  ...rest
}: Omit<ComponentProps<"div">, "children">) {
  const pad = usePad();
  if (!pad.preview || pad.mode === "draw") return null;
  return (
    <div data-slot="signature-pad-preview" {...rest} className={cx("fg-sig-preview", className)}>
      <img src={pad.preview.dataUrl} alt={`${pad.label} preview`} />
    </div>
  );
}
