import type { PixelIcon } from "../types";

// A scalloped badge with the ruble sign.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "badge-russian-ruble",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..###..###",
    "..#.ooo..#",
    "..#.o..o.#",
    ".#..ooo...#",
    ".#.ooo....#",
    "..#.o....#",
    "..#.o....#",
    "..###..###",
    ".....##",
  ],
};

export default icon;
