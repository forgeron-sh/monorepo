import type { PixelIcon } from "../types";

// Baggage conveyor: a briefcase on a conveyor belt, the belt in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "briefcase-conveyor-belt",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..########",
    "",
    "oooooooooooo",
    "o.o..o..o.o",
    "oooooooooooo",
  ],
};

export default icon;
