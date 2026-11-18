import type { PixelIcon } from "../types";

// Libra: an arch with flat feet over a bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zodiac-libra",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....####",
    "...#....#",
    "...#....#",
    ".###....###",
    "",
    "",
    ".##########",
  ],
};

export default icon;
