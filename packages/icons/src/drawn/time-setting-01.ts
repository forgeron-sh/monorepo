import type { PixelIcon } from "../types";

// Cog with clock hands in the secondary tone in its hole: timing settings. Built on `settings-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "time-setting-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...##..##",
    "...######",
    "..########",
    "####....####",
    "###..o...###",
    ".##..o...##",
    ".##..ooo.##",
    "###......###",
    "####....####",
    "..########",
    "...######",
    "...##..##",
  ],
};

export default icon;
