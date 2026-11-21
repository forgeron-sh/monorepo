import type { PixelIcon } from "../types";

// Signal bars, none lit: all four in the secondary tone. Bars of `signal`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "signal-zero",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..........o",
    "..........o",
    ".......o..o",
    ".......o..o",
    "....o..o..o",
    "....o..o..o",
    ".o..o..o..o",
    ".o..o..o..o",
  ],
};

export default icon;
