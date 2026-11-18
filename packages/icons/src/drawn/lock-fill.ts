import type { PixelIcon } from "../types";

// Filled `lock`: the body filled with the keyhole cut out; the shackle stays an outline (the
// automatic fill would have filled it in). Drawn by hand.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "lock-fill",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "...#....#",
    "...#....#",
    ".##########",
    ".##########",
    ".####..####",
    ".####..####",
    ".##########",
    ".##########",
  ],
};

export default icon;
