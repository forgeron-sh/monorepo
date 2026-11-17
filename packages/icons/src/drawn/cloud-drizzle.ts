import type { PixelIcon } from "../types";

// Cloud of `rain` with four short drizzle dashes in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-drizzle",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "...##...#",
    "..#......#",
    ".#........#",
    ".#........#",
    "..########",
    "",
    "..o......o",
    "..o.o..o.o",
    "....o..o",
  ],
};

export default icon;
