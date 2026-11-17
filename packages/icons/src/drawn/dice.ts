import type { PixelIcon } from "../types";

// Die showing two: a rounded square, two pips on the diagonal, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dice",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#.##.....#",
    ".#.##.....#",
    ".#........#",
    ".#........#",
    ".#.....##.#",
    ".#.....##.#",
    ".#........#",
    "..########",
  ],
};

export default icon;
