import type { PixelIcon } from "../types";

// Crop: two L-shaped frames, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "crop",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "...#",
    ".########",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...########",
    "........#",
    "........#",
  ],
};

export default icon;
