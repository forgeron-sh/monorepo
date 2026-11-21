import type { PixelIcon } from "../types";

// GIF: the three letters G, I and F.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gif-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..##..#.###",
    ".#....#.#",
    ".#.##.#.##",
    ".#..#.#.#",
    "..##..#.#",
  ],
};

export default icon;
