import type { PixelIcon } from "../types";

// The VK mark: the letters V and K side by side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "vk",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "#...#.#...#",
    "#...#.#..#",
    ".#.#..###",
    ".#.#..#..#",
    "..#...#...#",
  ],
};

export default icon;
