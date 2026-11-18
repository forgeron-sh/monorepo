import type { PixelIcon } from "../types";

// The Google Home mark: the outline of a house, a thick pointed roof over thick walls and a wide
// base.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "google-home",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....####",
    "...######",
    "..###..###",
    ".###....###",
    "###......###",
    "###......###",
    "###......###",
    "###......###",
    "############",
    "############",
  ],
};

export default icon;
