import { MinusSignIcon, PlusSignIcon } from "@forgeron/icons";
import { cx } from "../cx";
import { Icon } from "../icon";

export interface FaqProps {
  /** The questions and their answers, numbered `Q.01`… in order. */
  items: ReadonlyArray<{ q: string; a: string }>;
  /** The first answer open on arrival; on by default. */
  openFirst?: boolean;
  className?: string;
}

/**
 * Questions as native disclosures: the number in ember, the question, and a pixel plus that
 * becomes a minus in ember when open (the two swap whole, no rotation).
 */
export function Faq({ items, openFirst = true, className }: FaqProps) {
  return (
    <div className={cx("fg-faq", className)}>
      {items.map((f, i) => (
        <details key={f.q} open={openFirst && i === 0}>
          <summary>
            <span className="text-eyebrow fg-faq-n">{`Q.${String(i + 1).padStart(2, "0")}`}</span>
            <span className="text-title-3">{f.q}</span>
            <span className="fg-faq-mark" aria-hidden="true">
              <Icon icon={PlusSignIcon} variant="mono" className="fg-faq-closed" />
              <Icon icon={MinusSignIcon} variant="mono" className="fg-faq-opened" />
            </span>
          </summary>
          <p className="text-small fg-faq-a">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
