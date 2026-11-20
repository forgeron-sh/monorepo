import { textSvg } from "@forgeron/font";

export interface PixelTextProps {
  /** Written in the pixel face (Forge Sans), capitals unless `keepCase`. */
  text: string;
  /** Said to assistive technology; without it the drawing is decorative (`aria-hidden`). */
  label?: string;
  bold?: boolean;
  keepCase?: boolean;
  className?: string;
}

/** The viewBox and path of `textSvg`, the pixel face's own output, so both never drift apart. */
export function pixelShape(
  text: string,
  options: { bold?: boolean; keepCase?: boolean } = {},
): { viewBox: string; d: string } {
  const svg = textSvg(text, options);
  return {
    viewBox: /viewBox="([^"]*)"/.exec(svg)?.[1] ?? "0 0 1 7",
    d: /\sd="([^"]*)"/.exec(svg)?.[1] ?? "",
  };
}

/**
 * Text drawn in the pixel face as an inline SVG, square pixels in `currentColor`: indices, figures,
 * the wordmark. It scales with its box (set a height); no font is loaded.
 */
export function PixelText({ text, label, bold, keepCase, className }: PixelTextProps) {
  const { viewBox, d } = pixelShape(text, { bold, keepCase });
  return (
    <svg
      viewBox={viewBox}
      fill="currentColor"
      shapeRendering="crispEdges"
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <path d={d} />
    </svg>
  );
}
