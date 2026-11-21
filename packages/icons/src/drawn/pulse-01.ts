import type { PixelIcon } from "../types";

// Heart crossed by a pulse line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pulse-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..###..###",
    ".#...##...#",
    ".#........#",
    "oo..o.....oo",
    ".#.o.o..o.#",
    "..#...oo.#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
