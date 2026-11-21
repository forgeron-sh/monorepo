import type { PixelIcon } from "../types";

// Trend down: `chart-up` turned upside down, the line falling to the lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-down",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    "..#",
    "...#.#",
    "....#.#",
    ".......#",
    "........#.o",
    ".........#o",
    "........ooo",
  ],
};

export default icon;
