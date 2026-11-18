import type { PixelIcon } from "../types";

// Light bulb: a round glass, the filament rising from the base in the secondary tone, a two-row
// screw base (a V-shaped filament read as a smile).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bulb",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    ".#........#",
    ".#........#",
    ".#...oo...#",
    "..#..oo..#",
    "...#.oo.#",
    "...######",
    "....####",
    "....####",
  ],
};

export default icon;
