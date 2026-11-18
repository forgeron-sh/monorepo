import type { PixelIcon } from "../types";

// Envelope with two speed lines in the secondary tone on its left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-send-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...########",
    "oo.##....##",
    "...#.#..#.#",
    "...#..##..#",
    "oo.#......#",
    "...########",
  ],
};

export default icon;
