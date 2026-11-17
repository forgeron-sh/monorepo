import type { PixelIcon } from "../types";

// An equal sign: two one-pixel bars, eight long, two rows apart, centred exactly; the weight
// of `plus-sign` and `minus-sign`.
// Redrawn after Hugeicons `equal-sign` (Iconify preview, 2026-11-17): composition only.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "equal-sign",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "..########",
    "",
    "",
    "..########",
  ],
};

export default icon;
