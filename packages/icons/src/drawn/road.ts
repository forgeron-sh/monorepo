import type { PixelIcon } from "../types";

// Road in perspective: two edges converging in steady two-row steps, mirror-symmetric, and
// two-pixel centre dashes in the secondary tone that lengthen towards the viewer (redrawn on
// 2026-11-17: the edges were uneven and the dashes drifted from column 6 to column 5).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "road",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#..#",
    "....#..#",
    "...#....#",
    "...#.oo.#",
    "..#......#",
    "..#..oo..#",
    ".#...oo...#",
    ".#........#",
    "#....oo....#",
    "#....oo....#",
  ],
};

export default icon;
