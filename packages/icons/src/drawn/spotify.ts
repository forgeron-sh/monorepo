import type { PixelIcon } from "../types";

// The Spotify mark in pixels: the three sound arcs cut out of the round disc, shorter from top to
// bottom.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "spotify",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..########",
    ".##########",
    ".##......##",
    "##.######.##",
    "############",
    "###.....####",
    "##.#####.###",
    ".##########",
    ".###....###",
    "..#.####.#",
    "....####",
  ],
};

export default icon;
