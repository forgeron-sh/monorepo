import type { PixelIcon } from "../types";

// Torii gate: an upturned top beam, a straight tie beam, two posts.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "torri-gate",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "##........##",
    ".##########",
    "...#....#",
    "..########",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "..##....##",
  ],
};

export default icon;
