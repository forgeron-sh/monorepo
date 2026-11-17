import type { PixelIcon } from "../types";

// Maximise: four 45° arrows pointing out to the corners.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "maximize-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..####",
    ".##......##",
    ".#.#....#.#",
    ".#..#..#..#",
    "",
    "",
    ".#..#..#..#",
    ".#.#....#.#",
    ".##......##",
    ".####..####",
  ],
};

export default icon;
