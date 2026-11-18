import type { PixelIcon } from "../types";

// Berlin, the Brandenburg Gate: the quadriga on an entablature over columns.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "berlin",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....####",
    ".##########",
    ".#........#",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    "############",
  ],
};

export default icon;
