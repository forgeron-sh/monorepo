import type { PixelIcon } from "../types";

// Envelope with cut corners, the flap in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mail-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    ".#o......o#",
    ".#.o....o.#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
