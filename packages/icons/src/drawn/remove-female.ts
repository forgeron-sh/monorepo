import type { PixelIcon } from "../types";

// Remove a woman: the female sign of `add-female`, a minus badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "remove-female",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###",
    ".#...#",
    ".#...#",
    ".#...#",
    "..###",
    "...#",
    ".#####",
    "...#...ooooo",
    "...#",
  ],
};

export default icon;
