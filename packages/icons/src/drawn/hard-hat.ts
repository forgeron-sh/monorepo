import type { PixelIcon } from "../types";

// Hard hat: a dome on a wide brim, the ridge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hard-hat",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....####",
    "..##.oo.##",
    ".#...oo...#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    "############",
  ],
};

export default icon;
