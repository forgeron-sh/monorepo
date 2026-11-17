import type { PixelIcon } from "../types";

// Fan: four curved blades turning around a hub in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "fan-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...###",
    "...####",
    "....###..##",
    ".....##.###",
    "..###oo####",
    ".####oo###",
    ".###.##",
    ".##..###",
    ".....####",
    "......###",
  ],
};

export default icon;
