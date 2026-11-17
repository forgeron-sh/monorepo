import type { PixelIcon } from "../types";

// Cut-out: the dashed square of square-dashed, its corner taken by small scissors in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scissor-rectangle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##..##..##",
    ".#........#",
    "",
    "",
    ".#........#",
    ".#",
    ".#.....o...o",
    "........o.o",
    ".#.......o",
    ".##....oo.oo",
    ".......oo.oo",
  ],
};

export default icon;
