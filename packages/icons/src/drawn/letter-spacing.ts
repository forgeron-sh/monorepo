import type { PixelIcon } from "../types";

// Letter spacing: a letter A between two bars in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "letter-spacing",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "o..........o",
    "o..........o",
    "o....##....o",
    "o...#..#...o",
    "o..#....#..o",
    "o..######..o",
    "o..#....#..o",
    "o..#....#..o",
    "o..........o",
    "o..........o",
  ],
};

export default icon;
