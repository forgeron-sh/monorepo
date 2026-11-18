import type { PixelIcon } from "../types";

// Frying pan seen from above with its handle to the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pan-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..####",
    ".#....#",
    "#......#",
    "#......#####",
    "#......#####",
    "#......#",
    ".#....#",
    "..####",
  ],
};

export default icon;
