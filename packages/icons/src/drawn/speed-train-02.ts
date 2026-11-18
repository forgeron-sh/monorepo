import type { PixelIcon } from "../types";

// High-speed train seen from the side: a long sloping nose, windows in the secondary tone, on a rail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "speed-train-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#####",
    ".#....##",
    ".#......##",
    ".#.oooo...##",
    ".###########",
    "",
    "############",
  ],
};

export default icon;
