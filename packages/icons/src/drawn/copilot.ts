import type { PixelIcon } from "../types";

// The GitHub Copilot mark in pixels: the round head with its goggles and two eyes.
// 12×12: `#` primary tone. Rasterised from `simple-icons:githubcopilot` (Iconify, 2026-11-18), then redrawn by hand. Drawn on 2026-11-18.
// GitHub Copilot and the GitHub Copilot logo are trademarks of GitHub, Inc., used here only to refer to GitHub Copilot.
const icon: PixelIcon = {
  name: "copilot",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..########",
    ".##..##..##",
    ".#...##...#",
    ".##########",
    "##........##",
    "##..#..#..##",
    "##..#..#..##",
    ".##......##",
    "..########",
  ],
};

export default icon;
