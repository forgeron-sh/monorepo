import type { PixelIcon } from "../types";

// Laptop with a play triangle on its screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "laptop-video",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    "..#......#",
    "..#..o...#",
    "..#..oo..#",
    "..#..o...#",
    "..#......#",
    "..########",
    ".##########",
  ],
};

export default icon;
