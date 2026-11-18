import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { PixelFigure } from "../pixel-figure";

export interface StoryListProps {
  className?: string;
  children: ReactNode;
}

/** The steps of a story (Pick, Shape, Ship), glued edge to edge in one column. */
export function StoryList({ className, children }: StoryListProps) {
  return <ol className={cx("fg-story", className)}>{children}</ol>;
}

export interface StoryStepProps {
  /** The anchor of the step. */
  id?: string;
  /** Its number in the pixel face, `01`. */
  n: string;
  /** Said for the number, "Step 1". */
  label?: string;
  title: ReactNode;
  text: ReactNode;
  /** Three short points at the foot of the copy, each with its icon. */
  points?: ReadonlyArray<{ icon: IconDefinition; text: string }>;
  /** The dotted field behind the drawing; on by default. */
  dots?: boolean;
  /** Classes on the drawing's box, to lay out what goes in it. */
  artClassName?: string;
  className?: string;
  /** The drawing on the right: a mock of the product, a scene. */
  children?: ReactNode;
}

/**
 * One step of the story: its number, title, copy and points on the left, a drawing on the right
 * (under the copy below 1000px).
 */
export function StoryStep({
  id,
  n,
  label,
  title,
  text,
  points = [],
  dots = true,
  artClassName,
  className,
  children,
}: StoryStepProps) {
  return (
    <li id={id} className={cx("fg-story-step fg-ticks", className)}>
      <div className="fg-story-copy">
        <PixelFigure text={n} label={label ?? n} size="xl" className="fg-story-num" />
        <h3 className="text-title-1">{title}</h3>
        <p className="text-small fg-story-text">{text}</p>
        {points.length > 0 ? (
          <ul className="fg-story-points">
            {points.map((p) => (
              <li key={p.text}>
                <Icon icon={p.icon} />
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className={cx("fg-story-art", dots && "fg-dots", artClassName)}>{children}</div>
    </li>
  );
}
