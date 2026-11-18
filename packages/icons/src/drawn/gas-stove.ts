import type { PixelIcon } from "../types";

// Gas stove: a cooker with its oven window, two burner flames in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gas-stove",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...o....o",
    "..ooo..ooo",
    "..ooo..ooo",
    "",
    "############",
    ".#........#",
    ".#.######.#",
    ".#.#....#.#",
    ".#.######.#",
    ".##########",
  ],
};

export default icon;
