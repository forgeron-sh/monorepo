import type { PixelIcon } from "../types";

// Dot: a single solid round dot, centred.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dot",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....####",
    "...######",
    "...######",
    "...######",
    "...######",
    "....####",
  ],
};

export default icon;
