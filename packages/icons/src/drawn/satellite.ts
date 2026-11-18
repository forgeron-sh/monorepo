import type { PixelIcon } from "../types";

// Satellite: a body with a dish in the secondary tone on top and a solar panel on each side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "satellite",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....oo",
    "###.####.###",
    "#.#.#..#.#.#",
    "#.###..###.#",
    "#.#.#..#.#.#",
    "#.#.####.#.#",
    "###......###",
  ],
};

export default icon;
