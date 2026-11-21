// The steps of a story (Pick, Shape, Ship).
//
// Roots with parts. `StoryStep` takes `n`, `title`, `text` and `points` as shorthand, or the
// parts: `StoryStepCopy` (`StoryStepNumber`, `StoryStepTitle`, `StoryStepText`, `StoryStepPoints`)
// and `StoryStepArt`.

import type { IconDefinition } from "@forgeron/icons";
import type { ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { PixelFigure } from "../pixel-figure";
import { part, type PartProps } from "../part";

export interface StoryListProps extends PartProps<"ol"> {
  children: ReactNode;
}

/** The steps of a story (Pick, Shape, Ship), glued edge to edge in one column. */
export function StoryList(props: StoryListProps) {
  return part("ol", "story-list", "fg-story", props);
}

export interface StoryStepProps extends Omit<PartProps<"li">, "title"> {
  /** Its number in the pixel face, `01`. */
  n?: string;
  /** Said for the number, "Step 1". */
  label?: string;
  title?: ReactNode;
  text?: ReactNode;
  /** Three short points at the foot of the copy, each with its icon. */
  points?: ReadonlyArray<{ icon: IconDefinition; text: string }>;
  /** The dotted field behind the drawing; on by default. */
  dots?: boolean;
  /** Classes on the drawing's box, to lay out what goes in it. */
  artClassName?: string;
  /** The drawing on the right: a mock of the product, a scene. With no `n`, the parts. */
  children?: ReactNode;
}

/**
 * One step of the story: its number, title, copy and points on the left, a drawing on the right
 * (under the copy below 1000px).
 */
export function StoryStep({
  n,
  label,
  title,
  text,
  points = [],
  dots = true,
  artClassName,
  children,
  ...rest
}: StoryStepProps) {
  return part("li", "story-step", "fg-story-step fg-ticks", {
    ...rest,
    children:
      n !== undefined ? (
        <>
          <StoryStepCopy>
            <StoryStepNumber text={n} label={label ?? n} />
            <StoryStepTitle>{title}</StoryStepTitle>
            <StoryStepText>{text}</StoryStepText>
            {points.length > 0 ? (
              <StoryStepPoints>
                {points.map((p) => (
                  <li key={p.text}>
                    <Icon icon={p.icon} />
                    <span>{p.text}</span>
                  </li>
                ))}
              </StoryStepPoints>
            ) : null}
          </StoryStepCopy>
          <StoryStepArt dots={dots} {...(artClassName ? { className: artClassName } : {})}>
            {children}
          </StoryStepArt>
        </>
      ) : (
        children
      ),
  } as never);
}

/** The left column: number, title, text and points. */
export function StoryStepCopy(props: PartProps<"div">) {
  return part("div", "story-step-copy", "fg-story-copy", props);
}

/** The step's number in the pixel face. */
export function StoryStepNumber({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  return (
    <PixelFigure
      data-slot="story-step-number"
      text={text}
      label={label ?? text}
      size="xl"
      className={cx("fg-story-num", className)}
    />
  );
}

/** The title of the step. */
export function StoryStepTitle(props: PartProps<"h3">) {
  return part("h3", "story-step-title", "text-title-1", props);
}

/** The copy under the title. */
export function StoryStepText(props: PartProps<"p">) {
  return part("p", "story-step-text", "text-small fg-story-text", props);
}

/** The short points at the foot of the copy. */
export function StoryStepPoints(props: PartProps<"ul">) {
  return part("ul", "story-step-points", "fg-story-points", props);
}

/** The drawing on the right, over a dotted field unless `dots` is off. */
export function StoryStepArt({
  dots = true,
  className,
  ...rest
}: PartProps<"div"> & { dots?: boolean }) {
  return part("div", "story-step-art", cx("fg-story-art", dots && "fg-dots"), {
    ...rest,
    className,
  } as never);
}
