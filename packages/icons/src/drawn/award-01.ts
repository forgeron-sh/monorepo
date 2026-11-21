import type { PixelIcon } from "../types";

// Medal: ribbons in the secondary tone meeting on a round medal.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "award-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oo....oo",
    "...oo..oo",
    "....oooo",
    "....oooo",
    "....####",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "....####",
  ],
};

export default icon;
