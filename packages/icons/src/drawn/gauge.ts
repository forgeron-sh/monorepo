import type { PixelIcon } from "../types";

// Gauge: a dial open at the bottom, its needle and hub in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gauge",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    ".#........#",
    ".#......o.#",
    "#......o...#",
    "#.....o....#",
    "#....oo....#",
    "#....oo....#",
    ".#........#",
    "..#......#",
  ],
};

export default icon;
