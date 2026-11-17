import type { PixelIcon } from "../types";

// Wireless earbuds: a pair of solid buds, each a round head on a stem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "airpod-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    "#####..#####",
    "#####..#####",
    ".####..####",
    "...##..##",
    "...##..##",
    "...##..##",
    "...##..##",
    "...##..##",
    "...##..##",
  ],
};

export default icon;
