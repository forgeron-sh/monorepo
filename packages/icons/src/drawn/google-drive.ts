import type { PixelIcon } from "../types";

// The Google Drive mark: a triangle made of three bands, the left and right sides and the base,
// split by thin gaps.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "google-drive",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#.####",
    "..##.####",
    ".###..####",
    ".###..####",
    "###....####",
    "##......####",
    "#.#########",
    "..########",
  ],
};

export default icon;
