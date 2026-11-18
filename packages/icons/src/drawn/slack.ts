import type { PixelIcon } from "../types";

// The Slack mark in pixels: four bars and four dots turning around the centre.
// 16×16: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "slack",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "...###.###",
    "...###.###",
    "...###.###",
    ".......###",
    "######.###.###",
    "######.###.###",
    "######.###.###",
    "",
    ".###.###.######",
    ".###.###.######",
    ".###.###.######",
    ".....###",
    ".....###.###",
    ".....###.###",
    ".....###.###",
  ],
};

export default icon;
