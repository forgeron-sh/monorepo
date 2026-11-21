import type { PixelIcon } from "../types";

// Two capital T letters side by side: text set in capitals.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-all-caps",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#####..#####",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
  ],
};

export default icon;
