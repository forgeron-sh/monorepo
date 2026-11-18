import type { PixelIcon } from "../types";

// Road with a navigation arrow.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "navigator-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".#........#",
    ".#...##...#",
    ".#...##...#",
    ".#........#",
    ".#...##...#",
    ".#...##...#",
    ".#........#",
    ".#...oo...#",
    ".#..oooo..#",
    ".#.oooooo.#",
    ".#.oo..oo.#",
    ".#........#",
  ],
};

export default icon;
