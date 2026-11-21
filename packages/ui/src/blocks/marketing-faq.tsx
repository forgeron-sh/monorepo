// Questions as native disclosures.
//
// A root with parts. `Faq` takes `items` as shorthand, or `FaqItem`s (`FaqQuestion`, `FaqAnswer`).

import { MinusSignIcon, PlusSignIcon } from "@forgeron/icons";
import type { ReactNode } from "react";
import { Icon } from "../icon";
import { part, type PartProps } from "../part";

export interface FaqProps extends Omit<PartProps<"div">, "children"> {
  /** The questions and their answers, numbered `Q.01`… in order. */
  items?: ReadonlyArray<{ q: string; a: string }>;
  /** The first answer open on arrival; on by default. */
  openFirst?: boolean;
  /** `FaqItem`s, when there are no `items`. */
  children?: ReactNode;
}

/**
 * Questions as native disclosures: the number in ember, the question, and a pixel plus that
 * becomes a minus in ember when open (the two swap whole, no rotation).
 */
export function Faq({ items, openFirst = true, children, ...rest }: FaqProps) {
  return part("div", "faq", "fg-faq", {
    ...rest,
    children:
      items?.map((f, i) => (
        <FaqItem key={f.q} open={openFirst && i === 0}>
          <FaqQuestion n={i + 1}>{f.q}</FaqQuestion>
          <FaqAnswer>{f.a}</FaqAnswer>
        </FaqItem>
      )) ?? children,
  } as never);
}

/** One disclosure: a native `details`; `open` opens it on arrival. */
export function FaqItem(props: PartProps<"details">) {
  return part("details", "faq-item", undefined, props);
}

/** The line that opens the item: its number, the question and the plus. */
export function FaqQuestion({
  n,
  children,
  ...rest
}: Omit<PartProps<"summary">, "children"> & {
  /** Its number, written `Q.01`; without it no number is drawn. */
  n?: number;
  children?: ReactNode;
}) {
  return part("summary", "faq-question", undefined, {
    ...rest,
    children: (
      <>
        {n !== undefined ? (
          <span className="text-eyebrow fg-faq-n">{`Q.${String(n).padStart(2, "0")}`}</span>
        ) : null}
        <span className="text-title-3">{children}</span>
        <span className="fg-faq-mark" aria-hidden="true">
          <Icon icon={PlusSignIcon} variant="mono" className="fg-faq-closed" />
          <Icon icon={MinusSignIcon} variant="mono" className="fg-faq-opened" />
        </span>
      </>
    ),
  } as never);
}

/** The answer. */
export function FaqAnswer(props: PartProps<"p">) {
  return part("p", "faq-answer", "text-small fg-faq-a", props);
}
