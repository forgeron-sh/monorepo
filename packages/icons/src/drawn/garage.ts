import type { PixelIcon } from "../types";

// Garage: a low gable roof over a roll-up door with three slats.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "garage",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "...##..##",
    ".##......##",
    ".#........#",
    ".#.######.#",
    ".#.#....#.#",
    ".#.######.#",
    ".#.#....#.#",
    ".#.######.#",
    ".###....###",
  ],
};

export default icon;
