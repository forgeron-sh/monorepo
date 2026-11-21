import type { ComponentProps } from "react";
import { cx } from "./cx";
import { PixelText } from "./pixel-text";

export interface PixelTitleProps extends Omit<ComponentProps<"h2">, "children"> {
  /** The title; `\n` starts a new line. Words wrap on narrow screens. */
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /** `hero`, `h2`, `h3`: the height of a line (1em = 7 pixels). */
  size?: "hero" | "h2" | "h3";
}

/**
 * A heading drawn word by word in the pixel face (SVG, no font). The text is in the heading for
 * assistive technology and search; the drawing is hidden from them.
 */
export function PixelTitle({
  text,
  as: Tag = "h2",
  size = "h2",
  className,
  ...rest
}: PixelTitleProps) {
  const lines = text.split("\n").map((line) => line.split(" ").filter(Boolean));
  return (
    <Tag
      data-slot="pixel-title"
      {...rest}
      className={cx("fg-pixel-title", `fg-pixel-title-${size}`, className)}
    >
      <span className="fg-sr">{text.replace(/\n/g, " ")}</span>
      {lines.map((words, i) => (
        <span className="fg-pixel-title-line" aria-hidden="true" key={i}>
          {words.map((word, j) => (
            <PixelText key={j} text={word} />
          ))}
        </span>
      ))}
    </Tag>
  );
}
