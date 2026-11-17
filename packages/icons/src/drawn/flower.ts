import type { PixelIcon } from "../types";

// Flower seen from above: four round petals parted by short lines, around a round heart in the
// secondary tone.
// Redrawn after Hugeicons `flower` (Iconify preview, 2026-11-17): composition only.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flower",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "...#....#",
    ".##.#..#.##",
    "#...#oo#...#",
    "#..#oooo#..#",
    "#..#oooo#..#",
    "#...#oo#...#",
    ".##.#..#.##",
    "...#....#",
    "...#....#",
    "....####",
  ],
};

export default icon;
