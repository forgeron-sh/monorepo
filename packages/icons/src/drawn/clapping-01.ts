import type { PixelIcon } from "../types";

// Clapping: the hands of `hand-prayer` parting at the fingertips, three motion marks in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "clapping-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".o....o....o",
    ".o.#..o..#.o",
    "...##...##",
    "....##.##",
    "...###.###",
    "...###.###",
    "..####.####",
    "..###...###",
    "",
    "..###...###",
  ],
};

export default icon;
