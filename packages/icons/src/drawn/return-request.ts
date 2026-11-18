import type { PixelIcon } from "../types";

// Return request: a document with the back arrow of mail-reply-01 as a badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "return-request",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#####",
    "..#...##",
    "..#...#.#",
    "..#...####",
    "..#......#",
    "..#....o",
    "..#...oooo",
    "..#....o..o",
    "..#.......o",
    "..#####...o",
  ],
};

export default icon;
