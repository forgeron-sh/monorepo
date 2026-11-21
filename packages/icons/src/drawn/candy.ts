import type { PixelIcon } from "../types";

// Wrapped candy: a round sweet with a twisted wrapper end on each side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "candy",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "##..####..##",
    "#.##....##.#",
    "#..#....#..#",
    "#..#....#..#",
    "#.##....##.#",
    "##..####..##",
  ],
};

export default icon;
