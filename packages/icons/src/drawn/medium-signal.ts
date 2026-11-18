import type { PixelIcon } from "../types";

// Medium signal: three bars of rising height, the first two full, the tallest only outlined.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "medium-signal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".........##",
    "........#..#",
    "........#..#",
    ".....##.#..#",
    ".....##.#..#",
    ".....##.#..#",
    "..##.##.#..#",
    "..##.##.#..#",
    "..##.##.#..#",
    "..##.##..##",
  ],
};

export default icon;
