import type { PixelIcon } from "../types";

// Crown with a plus: the crown drawing with a plus badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "crown-plus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#...##...#",
    ".##.#..#.##",
    ".#.#....#.#",
    ".#........#",
    ".#",
    ".#####...o",
    ".#.##....o",
    ".#####.ooooo",
    ".........o",
    ".........o",
  ],
};

export default icon;
