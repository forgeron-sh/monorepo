import type { PixelIcon } from "../types";

// Ambulance van facing right with a cross on its body in the secondary tone, a slanted cab and two wheels.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ambulance",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#######",
    ".#..o..###",
    ".#.ooo.#..#",
    ".#..o..#..#",
    ".#.....#..#",
    ".##########",
    "..##....##",
    "..##....##",
  ],
};

export default icon;
