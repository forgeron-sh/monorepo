import type { PixelIcon } from "../types";

// Cloud struck by a lightning bolt in the secondary tone, the cloud of `rain` cut around the bolt.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-angled-zap",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "...##...#",
    "..#......#",
    ".#........#",
    ".#....oo..#",
    "..###oo.##",
    "....oooo",
    ".....oo",
    "....oo",
    "....o",
  ],
};

export default icon;
