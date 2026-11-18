import type { PixelIcon } from "../types";

// Electric plug lying on its side: a body, two prongs pointing right, a short cable on the left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "plug-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...#####",
    "...#...####",
    ".###...#",
    ".###...#",
    "...#...####",
    "...#####",
  ],
};

export default icon;
