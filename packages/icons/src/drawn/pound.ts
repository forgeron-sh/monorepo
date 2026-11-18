import type { PixelIcon } from "../types";

// Pound sign: a two-pixel upright with a hook on top, a crossbar and a wide foot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pound",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....####",
    "....##",
    "....##",
    "....##",
    "..######",
    "....##",
    "....##",
    "....##",
    "...##",
    "..########",
  ],
};

export default icon;
