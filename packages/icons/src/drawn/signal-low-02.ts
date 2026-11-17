import type { PixelIcon } from "../types";

// Low signal: the wedge of `signal-full-02` lit only at its foot, the rest in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "signal-low-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........o",
    ".........oo",
    "........ooo",
    ".......oooo",
    "......ooooo",
    ".....oooooo",
    "....ooooooo",
    "...#ooooooo",
    "..##ooooooo",
    ".###ooooooo",
  ],
};

export default icon;
