import type { PixelIcon } from "../types";

// Hockey: a stick with its blade on the ice and a puck in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hockey",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........#",
    ".........#",
    "........#",
    ".......#",
    "......#",
    ".....#",
    "....#",
    "...#",
    "####...oooo",
    "........oooo",
  ],
};

export default icon;
