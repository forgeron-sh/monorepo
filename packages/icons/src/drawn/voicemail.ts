import type { PixelIcon } from "../types";

// Voicemail: two rings joined along the bottom by a line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "voicemail",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..##....##",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    "..########",
  ],
};

export default icon;
