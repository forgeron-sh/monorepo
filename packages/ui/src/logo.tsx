import { cx } from "./cx";

/** Anvil outline, taken from assets/logos (symbol, viewBox 132). */
const ANVIL = "M0 0H132L81.506 50.494A29 29 0 0 0 102.012 100H132V132H0V100A33 33 0 0 0 0 34Z";

export interface LogoProps {
  /** `symbol` : the anvil alone; `horizontal`: the anvil and "forgeron". */
  variant?: "symbol" | "horizontal";
  /** Symbol height in px. */
  size?: number;
  className?: string;
}

/** Monochrome logo: follows `ink`, so white in the dark theme and black in the light theme. */
export function Logo({ variant = "horizontal", size = 22, className }: LogoProps) {
  const symbol = (
    <svg width={size} height={size} viewBox="0 0 132 132" aria-hidden="true">
      <path fill="currentColor" d={ANVIL} />
    </svg>
  );
  if (variant === "symbol") {
    return (
      <span className={cx("fg-logo", className)} role="img" aria-label="Forgeron">
        {symbol}
      </span>
    );
  }
  return (
    <span className={cx("fg-logo", className)} role="img" aria-label="Forgeron">
      {symbol}
      <span className="fg-logo-word" aria-hidden="true" style={{ fontSize: size * 0.9 }}>
        forgeron
      </span>
    </span>
  );
}
