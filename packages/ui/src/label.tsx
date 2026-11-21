import type { LabelHTMLAttributes } from "react";
import { cx } from "./cx";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

/**
 * shadcn's Label (D-156): a `<label>` with the look of a field's label. `htmlFor` ties it to a
 * control. The eyebrow of a section is `Eyebrow`.
 */
export function Label({ className, ...rest }: LabelProps) {
  return <label data-slot="label" {...rest} className={cx("fg-field-label", className)} />;
}
