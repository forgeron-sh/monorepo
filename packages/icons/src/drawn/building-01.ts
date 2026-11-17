import type { PixelIcon } from "../types";

// Building: four windows, a door, standing on a ground line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "building-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#.#..#.#",
    "..#......#",
    "..#......#",
    "..#.#..#.#",
    "..#......#",
    "..#..##..#",
    "..#..##..#",
    ".##########",
  ],
};

export default icon;
