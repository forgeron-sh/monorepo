import type { PixelIcon } from "../types";

// A square frame whose path runs along the middle of the stroke, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stroke-center",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#oooooooo#",
    ".#o######o#",
    ".#o#....#o#",
    ".#o#....#o#",
    ".#o#....#o#",
    ".#o#....#o#",
    ".#o######o#",
    ".#oooooooo#",
    ".##########",
  ],
};

export default icon;
