import type { PixelIcon } from "../types";

// Camper van: a long living box with windows and a lower cab at the front, on two wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camper",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "#########",
    "#.......##",
    "#.##.##.#.#",
    "#.##.##.#..#",
    "#.......####",
    "#..........#",
    "############",
    "..##....##",
    "..##....##",
  ],
};

export default icon;
