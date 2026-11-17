import type { PixelIcon } from "../types";

// Gift card: the credit-card outline crossed by a ribbon with a bow, the ribbon in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gift-card",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#.o.o....#",
    ".#oooooooo#",
    ".#..o.....#",
    ".#..o.....#",
    ".#..o.....#",
    ".#..o.....#",
    ".##########",
  ],
};

export default icon;
