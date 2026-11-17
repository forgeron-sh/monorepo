import type { PixelIcon } from "../types";

// A suitcase riding on a conveyor belt.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "baggage-claim",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..########",
    "",
    "oooooooooooo",
    "..oo....oo",
  ],
};

export default icon;
