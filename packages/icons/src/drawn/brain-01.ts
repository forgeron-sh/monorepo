import type { PixelIcon } from "../types";

// Brain seen from the side: a lobed outline, the folds in the secondary tone, the stem below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "brain-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "..#..##..#",
    ".#..oo....#",
    ".#....oo..#",
    ".#.ooo....#",
    "..#.......#",
    "...#####.#",
    ".......#.#",
    ".......#.#",
  ],
};

export default icon;
