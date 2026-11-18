import type { PixelIcon } from "../types";

// Open source: a thick ring with a keyhole slot cut from its centre down to the bottom edge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "open-source",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..########",
    ".####..####",
    ".###....###",
    "####....####",
    "####....####",
    ".###....###",
    ".####..####",
    "..###..###",
    "...##..##",
  ],
};

export default icon;
