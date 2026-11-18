import type { PixelIcon } from "../types";

// Chess queen: a crown of three points over the body and base of `chess-king`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chess-queen",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#..##..#",
    "..##.##.##",
    "..#.#..#.#",
    "..########",
    "...#....#",
    "....#..#",
    "....#..#",
    "...#....#",
    "..#......#",
    ".##########",
  ],
};

export default icon;
