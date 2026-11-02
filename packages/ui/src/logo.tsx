import { cx } from "./cx";

/** Tracé de l'enclume, extrait de assets/logos (symbole, viewBox 132). */
const ANVIL = "M0 0H132L81.506 50.494A29 29 0 0 0 102.012 100H132V132H0V100A33 33 0 0 0 0 34Z";

export interface LogoProps {
  /** `symbol` : l'enclume seule ; `horizontal` : l'enclume et « forgeron ». */
  variant?: "symbol" | "horizontal";
  /** Hauteur du symbole en px. */
  size?: number;
  className?: string;
}

/** Logo monochrome : suit `ink`, donc blanc en thème sombre et noir en thème clair. */
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
