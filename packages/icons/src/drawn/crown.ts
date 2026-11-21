import type { PixelIcon } from "../types";

// Crown: three points, a band with two jewels in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "crown",
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
    ".#........#",
    ".##########",
    ".#.oo..oo.#",
    ".##########",
  ],
};

export default icon;
