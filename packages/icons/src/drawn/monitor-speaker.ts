import type { PixelIcon } from "../types";

// Monitor beside a speaker in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "monitor-speaker",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "######.ooooo",
    "#....#.o...o",
    "#....#.o.o.o",
    "#....#.o...o",
    "#....#.o...o",
    "######.o.o.o",
    "..##...o.o.o",
    "..##...o...o",
    ".####..ooooo",
  ],
};

export default icon;
