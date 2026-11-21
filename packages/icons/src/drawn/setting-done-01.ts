import type { PixelIcon } from "../types";

// Cog of `settings-01` with a check in its hole in the secondary tone: settings applied.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "setting-done-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...##..##",
    "...######",
    "..########",
    "####....####",
    "###......###",
    ".##....o.##",
    ".##.o.o..##",
    "###..o...###",
    "####....####",
    "..########",
    "...######",
    "...##..##",
  ],
};

export default icon;
