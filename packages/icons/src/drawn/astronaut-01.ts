import type { PixelIcon } from "../types";

// An astronaut in a helmet with a visor.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "astronaut-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#..oooo..#",
    ".#.oooooo.#",
    ".#..oooo..#",
    "..#......#",
    "...######",
    "..#......#",
    ".#..####..#",
    ".#..#..#..#",
    ".##########",
  ],
};

export default icon;
