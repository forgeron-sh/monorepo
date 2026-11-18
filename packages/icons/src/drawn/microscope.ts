import type { PixelIcon } from "../types";

// Microscope: an eyepiece tube on an arm over a stage with a slide in the secondary tone, on a base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "microscope",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    "....##",
    "....######",
    "....##...#",
    "....##...#",
    "...####..#",
    "...oooo..#",
    "..########",
    ".........#",
    "..########",
  ],
};

export default icon;
