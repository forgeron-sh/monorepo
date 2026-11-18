import type { PixelIcon } from "../types";

// The tree of hierarchy-circle-01 laid on its side: the root on the left, two circles (secondary tone) on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hierarchy-circle-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........oo",
    "......##o..o",
    "......##o..o",
    "..##..#..oo",
    ".#..###",
    ".#..###",
    "..##..#..oo",
    "......##o..o",
    "......##o..o",
    ".........oo",
  ],
};

export default icon;
