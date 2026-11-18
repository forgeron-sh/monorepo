import type { PixelIcon } from "../types";

// The Google Maps mark: a map pin with a round hole and a road cutting across it on the diagonal.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "google-maps",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...####.#",
    "..###..###",
    "..##....##",
    "..##....##",
    "..##...###",
    "..#.######",
    "...#.####",
    "....####",
    ".....##",
    ".....##",
  ],
};

export default icon;
