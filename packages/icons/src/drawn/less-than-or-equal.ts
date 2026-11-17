import type { PixelIcon } from "../types";

// Less than or equal: the angle of `less-than` over a bar in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "less-than-or-equal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........##",
    "......##",
    "....##",
    "..##",
    "..##",
    "....##",
    "......##",
    "........##",
    "",
    "",
    ".oooooooooo",
  ],
};

export default icon;
