import type { PixelIcon } from "../types";

// The TeamViewer mark in pixels: the double arrow inside the round window of the rounded square.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "teamviewer",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "####....####",
    "###......###",
    "##........##",
    "##.#....#.##",
    "#.########.#",
    "#.########.#",
    "##.#....#.##",
    "##........##",
    "###......###",
    "####....####",
    ".##########",
  ],
};

export default icon;
