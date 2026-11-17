import type { PixelIcon } from "../types";

// Chevron pointing up: `arrow-down-01` flipped, one row higher than the centre (its weight is at
// the bottom).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-up-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".....##",
    "....####",
    "...##..##",
    "..##....##",
    "..#......#",
  ],
};

export default icon;
