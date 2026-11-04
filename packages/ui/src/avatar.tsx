import { cx } from "./cx";

export interface AvatarProps {
  /** The person's name or email; the initials come from it. */
  name: string;
  size?: number;
  className?: string;
}

const initials = (name: string) => {
  const words = name
    .split("@")[0]!
    .split(/[\s._-]+/)
    .filter(Boolean);
  const letters = words.length > 1 ? words[0]![0]! + words[1]![0]! : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
};

/** The person's initials in a sharp square; decorative, the name is always written next to it. */
export function Avatar({ name, size = 24, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cx("fg-avatar", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initials(name)}
    </span>
  );
}
