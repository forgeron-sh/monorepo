import type { PixelIcon } from "../types";

// Shredder: a sheet entering the machine, strips leaving below in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "shredder",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "...#....#",
    ".##########",
    ".#........#",
    ".#........#",
    ".##########",
    "..o.o..o.o",
    "..o.o..o.o",
    "..o.o..o.o",
    "..o.o..o.o",
  ],
};

export default icon;
