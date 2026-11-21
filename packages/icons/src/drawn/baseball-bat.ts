import type { PixelIcon } from "../types";

// Baseball bat: a bat at 45° with a ball beside it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "baseball-bat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........##",
    "........###",
    ".......###",
    "......###",
    ".....###",
    "....##",
    "...##",
    "..##...oo",
    ".##....oo",
    ".#",
  ],
};

export default icon;
