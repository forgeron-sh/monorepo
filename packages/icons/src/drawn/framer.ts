import type { PixelIcon } from "../types";

// The Framer mark: a top triangle, a middle square with a slanted edge and a bottom triangle,
// stacked like a folded arrow.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "framer",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..########",
    "...#######",
    "....######",
    ".....#####",
    "..####",
    "..#####",
    "..######",
    "..########",
    "..####",
    "..###",
    "..##",
    "..#",
  ],
};

export default icon;
