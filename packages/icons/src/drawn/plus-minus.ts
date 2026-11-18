import type { PixelIcon } from "../types";

// Plus-minus sign: a bold plus over a bold bar, two-pixel strokes, centred.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "plus-minus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "..########",
    "..########",
    ".....##",
    ".....##",
    "",
    "",
    "..########",
    "..########",
  ],
};

export default icon;
