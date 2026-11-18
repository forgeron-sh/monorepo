import type { PixelIcon } from "../types";

// A turtle seen from the side: a domed shell, head and legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "turtle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...####",
    "..#....#",
    ".#.oooo.#.##",
    ".#......####",
    "##########",
    ".##....##",
  ],
};

export default icon;
