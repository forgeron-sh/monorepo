import type { PixelIcon } from "../types";

// A quarter of an hour gone: the hands of `clock-02` in the primary tone, the arc of the ring from 12 to 3 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "time-quarter-pass",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...###ooo",
    "..#......o",
    ".#...##...o",
    ".#...##...o",
    ".#...####.o",
    ".#...####.#",
    ".#........#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
