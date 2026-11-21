import type { PixelIcon } from "../types";

// Ringing bell: a narrow bell with a tick on each side in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "notification-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    ".o.#....#.o",
    "o..#....#..o",
    "...#....#",
    "..#......#",
    "..#......#",
    "..########",
    "",
    ".....##",
  ],
};

export default icon;
