import type { PixelIcon } from "../types";

// Electric truck: the truck with a bolt in its cargo box in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "truck-electric",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#######",
    ".#...o.#",
    ".#..oo.###",
    ".#.oo..#..#",
    ".#.o...#..#",
    ".##########",
    "..##....##",
    "..##....##",
  ],
};

export default icon;
