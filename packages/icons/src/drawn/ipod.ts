import type { PixelIcon } from "../types";

// Pocket music player: a tall case with a screen in the secondary tone and a click wheel.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ipod",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#.oooo.#",
    "..#.oooo.#",
    "..#......#",
    "..#..##..#",
    "..#.#..#.#",
    "..#.#..#.#",
    "..#..##..#",
    "..#......#",
    "..########",
  ],
};

export default icon;
