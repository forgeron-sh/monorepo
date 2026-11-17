import type { PixelIcon } from "../types";

// Highlighter: a marker at 45° with a cap band and a chisel tip, over a highlight stroke in the
// secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "highlighter",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........##",
    ".......#..#",
    "......####",
    ".....#..#",
    "....#..#",
    "...#..#",
    "...#.#",
    "...##",
    "",
    ".oooooo",
  ],
};

export default icon;
