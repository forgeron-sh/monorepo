// The person's picture or initials: the props-driven Avatar (with `name`), and shadcn's parts
// (`Avatar`, `AvatarImage`, `AvatarFallback`, Base UI) when there is no `name`, D-156.

import { Avatar as Base } from "@base-ui/react/avatar";
import type { ComponentProps, HTMLAttributes } from "react";
import { cx } from "./cx";

export interface AvatarProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "className" | "children"
> {
  /** The person's name or email; the initials come from it. */
  name: string;
  size?: number;
  className?: string;
  /** The person's picture, when they have one: it replaces the initials. */
  src?: string;
}

const initials = (name: string) => {
  const words = name
    .split("@")[0]!
    .split(/[\s._-]+/)
    .filter(Boolean);
  const letters = words.length > 1 ? words[0]![0]! + words[1]![0]! : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
};

type Part<T> = Omit<T, "className"> & { className?: string };

export type AvatarRootProps = Part<ComponentProps<typeof Base.Root>> & {
  name?: undefined;
  /** shadcn's sizes: 24, 32 and 40px. */
  size?: "default" | "sm" | "lg";
};

/**
 * With `name`: the person's picture, else their initials, in a sharp square; decorative, the name is
 * always written next to it. Without: the root of shadcn's parts (`AvatarImage`, `AvatarFallback`).
 */
export function Avatar(props: AvatarProps | AvatarRootProps) {
  return props.name !== undefined ? (
    <AvatarInitials {...(props as AvatarProps)} />
  ) : (
    <AvatarRoot {...(props as AvatarRootProps)} />
  );
}

function AvatarInitials({ name, size = 24, className, src, style, ...rest }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      data-slot="avatar"
      {...rest}
      className={cx("fg-avatar", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42), ...style }}
    >
      {src ? <img src={src} alt="" width={size} height={size} /> : initials(name)}
    </span>
  );
}

function AvatarRoot({ size = "default", className, ...rest }: AvatarRootProps) {
  return (
    <Base.Root
      data-size={size}
      className={cx("fg-avatar", "fg-avatar-part", className)}
      data-slot="avatar"
      {...rest}
    />
  );
}

export function AvatarImage({ className, ...rest }: Part<ComponentProps<typeof Base.Image>>) {
  return (
    <Base.Image className={cx("fg-avatar-image", className)} data-slot="avatar-image" {...rest} />
  );
}

export function AvatarFallback({ className, ...rest }: Part<ComponentProps<typeof Base.Fallback>>) {
  return (
    <Base.Fallback
      className={cx("fg-avatar-fallback", className)}
      data-slot="avatar-fallback"
      {...rest}
    />
  );
}
