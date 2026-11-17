import type { PixelIcon } from "../types";

// Variable font: two letters T side by side, each over a short rule in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-variable-front",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "#####..#####",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "",
    "",
    "ooooo..ooooo",
  ],
};

export default icon;
