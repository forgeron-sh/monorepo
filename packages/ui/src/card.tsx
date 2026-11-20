// shadcn's Card and its parts (D-156): a framed block with a header, a body and a footer.

import type { ComponentProps } from "react";
import { cx } from "./cx";

export interface CardProps extends ComponentProps<"div"> {
  /** shadcn's `sm`: tighter padding. */
  size?: "default" | "sm";
}

export function Card({ size = "default", className, ...rest }: CardProps) {
  return <div data-slot="card" data-size={size} className={cx("fg-card", className)} {...rest} />;
}

export function CardHeader({ className, ...rest }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cx("fg-card-header", className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: ComponentProps<"div">) {
  return <div data-slot="card-title" className={cx("fg-card-title", className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div data-slot="card-description" className={cx("fg-card-description", className)} {...rest} />
  );
}

/** Top right of the header: a button, a menu. */
export function CardAction({ className, ...rest }: ComponentProps<"div">) {
  return <div data-slot="card-action" className={cx("fg-card-action", className)} {...rest} />;
}

export function CardContent({ className, ...rest }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cx("fg-card-content", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cx("fg-card-footer", className)} {...rest} />;
}
