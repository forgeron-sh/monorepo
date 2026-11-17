import type { PixelIcon } from "../types";

// Clear formatting: the T of `text`, a small cross in the secondary tone at its foot.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "remove-formatting",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    ".#..##..#",
    "....##",
    "....##",
    "....##",
    "....##",
    "....##..o..o",
    "....##...oo",
    "....##...oo",
    "...####.o..o",
  ],
};

export default icon;
