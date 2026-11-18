import type { PixelIcon } from "../types";

// Hands clapping: the hands of `hand-prayer` palm to palm, clap marks in the secondary tone on both sides.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hands-clapping",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o...#.#...o",
    "..o.##.##.o",
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
