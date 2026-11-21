import type { PixelIcon } from "../types";

// Invoice: a sheet with a torn bottom edge, two lines in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "invoice-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#.oooo.#",
    "..#......#",
    "..#......#",
    "..#.oooo.#",
    "..#......#",
    "..#......#",
    "..#.#..#.#",
    "..##.##.##",
  ],
};

export default icon;
