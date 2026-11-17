import type { PixelIcon } from "../types";

// Medium signal: the wedge of `signal-full-02` lit up to two thirds, the rest in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "signal-medium-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........o",
    ".........oo",
    "........ooo",
    ".......#ooo",
    "......##ooo",
    ".....###ooo",
    "....####ooo",
    "...#####ooo",
    "..######ooo",
    ".#######ooo",
  ],
};

export default icon;
