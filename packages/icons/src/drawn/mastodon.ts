import type { PixelIcon } from "../types";

// The Mastodon mark in pixels: the rounded speech balloon with the m cut out and its tail at the
// lower left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "mastodon",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..########",
    ".##########",
    "############",
    "##........##",
    "##..#..#..##",
    "##..#..#..##",
    "##..#..#..##",
    "###########",
    ".#########",
    ".##",
    ".####",
    "...####",
  ],
};

export default icon;
