import type { PixelIcon } from "../types";

// Push pin: a head, a body, a base, the needle in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pin",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "....#..#",
    "....#..#",
    "....#..#",
    "..########",
    ".....oo",
    ".....oo",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
