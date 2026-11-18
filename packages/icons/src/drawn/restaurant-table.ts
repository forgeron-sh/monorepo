import type { PixelIcon } from "../types";

// Restaurant table: a table on a pedestal between two chairs, a plate on it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "restaurant-table",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "#..........#",
    "#...oooo...#",
    "#..######..#",
    "#....##....#",
    "###..##..###",
    "#.#..##..#.#",
    "#.#..##..#.#",
    "#.#.####.#.#",
  ],
};

export default icon;
