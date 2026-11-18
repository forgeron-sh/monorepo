import type { PixelIcon } from "../types";

// The Google mark: a thick letter G open at the top right, its bar running in from the right.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "google",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "..########",
    ".###....##",
    "###",
    "##",
    "##....######",
    "##....######",
    "##........##",
    "###.......##",
    ".###.....##",
    "..########",
    "...######",
  ],
};

export default icon;
