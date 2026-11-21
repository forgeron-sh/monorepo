import type { PixelIcon } from "../types";

// Venus and Mars: one ring with the arrow of Mars up and the cross of Venus down.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "venus-and-mars",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......###",
    "........##",
    "...###.#.#",
    "..#...#",
    "..#...#",
    "..#...#",
    "...###",
    "....#",
    "...###",
    "....#",
  ],
};

export default icon;
