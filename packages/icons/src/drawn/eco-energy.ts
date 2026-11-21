import type { PixelIcon } from "../types";

// Green energy: the leaf of `leaf-01` with a lightning bolt in the secondary tone along its midrib.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "eco-energy",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".......###",
    ".....##.o#",
    "....#..o.#",
    "...#..oo#",
    "...#..o.#",
    "..#..o.#",
    "..#.o##",
    "..###",
    ".#",
  ],
};

export default icon;
