import type { PixelIcon } from "../types";

// A fuel pump: the pump body with its display (secondary tone), the hose and the nozzle hung on its side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fuel-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#######",
    "..#....#.#",
    "..#.oo.#..#",
    "..#.oo.#..#",
    "..#....#..#",
    "..#....#..#",
    "..#....#..#",
    "..#....###",
    "..#....#",
    "..#....#",
    ".########",
  ],
};

export default icon;
