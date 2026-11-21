import type { PixelIcon } from "../types";

// Frying pan: a round pan with an egg yolk in the secondary tone and a handle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fry",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..####",
    ".#....#",
    "#......#",
    "#..oo..#####",
    "#..oo..#####",
    "#......#",
    ".#....#",
    "..####",
  ],
};

export default icon;
