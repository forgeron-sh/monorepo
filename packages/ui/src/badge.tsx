import { useRender } from "@base-ui/react/use-render";
import { isValidElement, type ComponentProps, type ReactNode } from "react";
import { cx } from "./cx";
import { Led } from "./led";

export interface BadgeProps extends Omit<ComponentProps<"span">, "children"> {
  tone?: "neutral" | "strong" | "success" | "warning" | "danger";
  /** shadcn's name for the look; takes the place of `tone` when given. */
  variant?: "default" | "secondary" | "destructive" | "outline";
  /** A square LED before the text, in the tone's color (states). */
  dot?: boolean;
  /** An identifier (v1.4.0, crm.contacts.list): its case is kept, where a badge is set in capitals. */
  mono?: boolean;
  /** shadcn's `asChild`: the one child element (a link) becomes the badge. */
  asChild?: boolean;
  className?: string;
  children?: ReactNode;
}

const VARIANT_CLASS = {
  default: "fg-badge-strong",
  secondary: "fg-badge-secondary",
  destructive: "fg-badge-danger",
  outline: undefined,
} as const;

/** Short mono label in capitals: interface, status, role. Takes `tone` or shadcn's `variant`. */
export function Badge({
  tone = "neutral",
  variant,
  dot,
  mono,
  asChild,
  className,
  children,
  ...rest
}: BadgeProps) {
  const look = variant
    ? VARIANT_CLASS[variant]
    : tone !== "neutral"
      ? `fg-badge-${tone}`
      : undefined;
  const child = asChild && isValidElement(children);
  return useRender({
    defaultTagName: "span",
    render: child ? children : undefined,
    props: {
      "data-slot": "badge",
      ...rest,
      className: cx("fg-badge", look, mono && "fg-badge-mono", className),
      ...(child
        ? {}
        : {
            children: (
              <>
                {dot ? <Led tone="current" /> : null}
                {children}
              </>
            ),
          }),
    },
  });
}

/**
 * Production, another permanent channel (`channel`, its name given as children), or a branch's
 * temporary channel (`preview`), D-125.
 */
const ENV_LABEL = { production: "Production", channel: "Channel", preview: "Branch" } as const;

export interface EnvTagProps extends Omit<ComponentProps<"span">, "children" | "className"> {
  env: keyof typeof ENV_LABEL;
  className?: string;
  children?: ReactNode;
}

/** The channel of a version: shape carries the information, not the tint. */
export function EnvTag({ env, className, children, ...rest }: EnvTagProps) {
  return (
    <span data-slot="env-tag" {...rest} className={cx("fg-env", `fg-env-${env}`, className)}>
      <Led tone="current" className="fg-env-mark" />
      {children ?? ENV_LABEL[env]}
    </span>
  );
}
