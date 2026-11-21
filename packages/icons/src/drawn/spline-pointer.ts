import type { PixelIcon } from "../types";

// A spline from a handle to a pointer in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "spline-pointer",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###",
    ".#.####",
    ".###...#",
    ".......#",
    "",
    ".......o",
    ".......oo",
    ".......ooo",
    ".......oooo",
    ".......oo",
  ],
};

export default icon;
