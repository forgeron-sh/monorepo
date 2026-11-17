import type { PixelIcon } from "../types";

// Brain of `brain-01` with a circuit trace and its node inside, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "brain-circuit",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "..#..##..#",
    ".#.ooo....#",
    ".#...o.oo.#",
    ".#...ooo..#",
    "..#.......#",
    "...#####.#",
    ".......#.#",
    ".......#.#",
  ],
};

export default icon;
