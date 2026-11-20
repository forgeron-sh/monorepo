// shadcn's Alert, AlertTitle, AlertDescription (D-156). `Notice` stays the props-driven one.

import type { ComponentProps } from "react";
import { cx } from "./cx";

export interface AlertProps extends ComponentProps<"div"> {
  variant?: "default" | "destructive";
}

/** A callout in the page; an icon as the first child goes in its own column. */
export function Alert({ variant = "default", className, ...rest }: AlertProps) {
  return (
    <div
      role="alert"
      data-slot="alert"
      data-variant={variant}
      className={cx("fg-alert", variant === "destructive" && "fg-alert-destructive", className)}
      {...rest}
    />
  );
}

export function AlertTitle({ className, ...rest }: ComponentProps<"div">) {
  return <div data-slot="alert-title" className={cx("fg-alert-title", className)} {...rest} />;
}

export function AlertDescription({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cx("fg-alert-description", className)}
      {...rest}
    />
  );
}
