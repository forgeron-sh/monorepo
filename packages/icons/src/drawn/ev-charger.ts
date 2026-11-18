import type { PixelIcon } from "../types";

// EV charger: the pump of `fuel-station` with a lightning bolt in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ev-charger",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######",
    ".#....#.#",
    ".#..o.#..#",
    ".#.oo.#..#",
    ".#..oo##.#",
    ".#..o.#..#",
    ".#....#..#",
    ".#....#.#",
    ".#....#",
    "########",
  ],
};

export default icon;
