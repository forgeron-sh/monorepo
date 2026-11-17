import type { PixelIcon } from "../types";

// Clock whose right half is drawn in the secondary tone, hands at twelve and six: half the time passed. Built on `time-quarter-pass`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "time-half-pass",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...###ooo",
    "..#......o",
    ".#...##...o",
    ".#...##...o",
    ".#...##...o",
    ".#...##...o",
    ".#...##...o",
    ".#...##...o",
    "..#......o",
    "...###ooo",
  ],
};

export default icon;
