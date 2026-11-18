import type { PixelIcon } from "../types";

// Rose chart: four quarter-circle petals of different sizes around one centre, the largest in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-rose",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......ooo",
    "....#..oooo",
    "..###..ooooo",
    "..###..ooooo",
    ".####..ooooo",
    "",
    "",
    "#####..####",
    "#####..####",
    "#####..###",
    ".####..##",
    "..###",
  ],
};

export default icon;
