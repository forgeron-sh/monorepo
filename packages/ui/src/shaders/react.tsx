import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "../cx";
import { PixelText } from "../pixel-text";
import { type FieldMode, REVEAL_MARGIN } from "@forgeron/shaders";
import {
  type DitheredImageOptions,
  type DitherFieldOptions,
  mountDitheredImage,
  mountDitherField,
  mountReveal,
} from "@forgeron/shaders/dom";
import { type HearthOptions, mountFieldShader, mountHearth } from "./mounts";
import { textRows } from "./text-rows";

// Thin React wrappers over @forgeron/shaders: each renders a plain element on the server (a canvas
// is decoration, the page reads without it) and mounts its shader after hydration. Size the
// canvas with CSS.

interface CanvasProps {
  className?: string;
  style?: CSSProperties;
}

export interface DitherFieldProps extends CanvasProps, DitherFieldOptions {}

/** The ember dither field of the sub-sites' heroes, on a 2D canvas. */
export function DitherField({ pixel, tones, fps, still, className, style }: DitherFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [bg, low, high] = tones ?? [];
  useEffect(() => {
    if (!ref.current) return;
    const t = bg && low && high ? ([bg, low, high] as const) : undefined;
    const handle = mountDitherField(ref.current, { pixel, fps, still, ...(t ? { tones: t } : {}) });
    return () => handle?.destroy();
  }, [pixel, bg, low, high, fps, still]);
  return (
    <canvas ref={ref} className={cx("fg-shader", className)} style={style} aria-hidden="true" />
  );
}

export interface FieldShaderProps extends CanvasProps {
  mode: FieldMode;
  pixel?: number;
  accent?: boolean;
  /** Tokens or colours of the background, the ink and the ember. */
  bg?: string;
  ink?: string;
  ember?: string;
  pointer?: boolean;
  still?: boolean;
}

/** A generator field of forgeron.sh (ember, globe, dissolve, field), in WebGL. */
export function FieldShader(props: FieldShaderProps) {
  const { mode, pixel, accent, bg, ink, ember, pointer, still, className, style } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const colors = {
      ...(bg ? { bg } : {}),
      ...(ink ? { ink } : {}),
      ...(ember ? { accent: ember } : {}),
    };
    const handle = mountFieldShader(ref.current, { mode, pixel, accent, colors, pointer, still });
    return () => handle?.destroy();
  }, [mode, pixel, accent, bg, ink, ember, pointer, still]);
  return (
    <canvas ref={ref} className={cx("fg-shader", className)} style={style} aria-hidden="true" />
  );
}

export interface DitheredImageProps
  extends CanvasProps, Pick<DitheredImageOptions, "pixel" | "gain"> {
  src: string;
}

/** A picture redrawn in the palette through the 4×4 Bayer matrix. Decorative. */
export function DitheredImage({ src, pixel, gain, className, style }: DitheredImageProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const handle = mountDitheredImage(ref.current, src, { pixel, gain });
    return () => handle?.destroy();
  }, [src, pixel, gain]);
  return (
    <canvas ref={ref} className={cx("fg-shader", className)} style={style} aria-hidden="true" />
  );
}

export interface HearthProps extends HearthOptions {
  /** Content laid over the embers, above the wordmark (a footer's links). */
  children?: ReactNode;
  className?: string;
}

/**
 * The hearth: the wordmark as iron out of the forge on a bed of embers. Without JavaScript, the
 * static wordmark in cold iron stands at the same place.
 */
export function Hearth({ text = "Forgeron", cell, still, children, className }: HearthProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const handle = mountHearth(ref.current, { text, cell, still });
    return () => handle?.destroy();
  }, [text, cell, still]);
  return (
    <div ref={ref} className={cx("fg-hearth", className)}>
      <canvas aria-hidden="true" />
      {children}
      <div className="fg-hearth-word" data-hearth-word>
        <PixelText text={text} label={text} />
      </div>
    </div>
  );
}

export interface PixelRevealProps {
  /** One line, drawn in the pixel face's capitals. */
  text: string;
  /** CSS pixels per font pixel (8 by default). */
  pixel?: number;
  /** Milliseconds (1500 by default). */
  duration?: number;
  /** Shows the final text at once; the reader's preference otherwise. */
  still?: boolean;
  /** Changing it plays the reveal again. */
  replay?: number;
  className?: string;
}

/**
 * A pixel title that resolves out of a dithered glitch. The text is in the page from the start
 * (and to screen readers); the canvas only covers it while the reveal runs.
 */
export function PixelReveal({
  text,
  pixel = 8,
  duration,
  still,
  replay = 0,
  className,
}: PixelRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current;
    const canvas = root?.querySelector("canvas");
    if (!root || !canvas) return;
    root.dataset.revealing = "";
    const handle = mountReveal(canvas, [textRows(text)], {
      pixel,
      duration,
      still,
      onDone: () => delete root.dataset.revealing,
    });
    return () => {
      handle?.destroy();
      delete root.dataset.revealing;
    };
  }, [text, pixel, duration, still, replay]);
  const offset = `${-REVEAL_MARGIN * pixel}px`;
  return (
    <span
      ref={ref}
      className={cx("fg-reveal", className)}
      style={{ "--fg-reveal-px": `${pixel}px` } as CSSProperties}
    >
      <PixelText text={text} label={text} />
      <canvas aria-hidden="true" style={{ left: offset, top: offset }} />
    </span>
  );
}
