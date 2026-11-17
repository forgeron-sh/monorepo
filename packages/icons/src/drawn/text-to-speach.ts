import type { PixelIcon } from "../types";

// Text to speech: a letter T and sound bars, in the secondary tone, rising from it.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-to-speach",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    "...#",
    "...#....o",
    "...#..o.o",
    "...#..o.o.o",
    "......o.o.o",
    "..o.o.o.o.o",
    "..o.o.o.o",
    "....o...o",
    "....o",
  ],
};

export default icon;
