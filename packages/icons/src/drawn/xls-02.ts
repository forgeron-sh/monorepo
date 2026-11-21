import type { PixelIcon } from "../types";

// XLS: the letters X, L and S alone, as `xls-01` without the sheet.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "xls-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#.#.#....##",
    ".#.#.#...#",
    "..#..#....#",
    ".#.#.#.....#",
    ".#.#.###.##",
  ],
};

export default icon;
