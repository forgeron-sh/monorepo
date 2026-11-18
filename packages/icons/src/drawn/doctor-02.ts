import type { PixelIcon } from "../types";

// Doctor: a person wearing a stethoscope in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "doctor-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    ".....##",
    "",
    "...######",
    "..#.o..o.#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
