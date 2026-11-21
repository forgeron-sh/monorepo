import type { PixelIcon } from "../types";

// Cook book: a bound book with a fork on its cover in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cook-book",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".##.......#",
    ".##..o.o..#",
    ".##..o.o..#",
    ".##..ooo..#",
    ".##...o...#",
    ".##...o...#",
    ".##...o...#",
    ".##.......#",
    ".##########",
  ],
};

export default icon;
