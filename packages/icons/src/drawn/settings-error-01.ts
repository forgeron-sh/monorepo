import type { PixelIcon } from "../types";

// Cog of `settings-01` with a cross in its hole in the secondary tone: a settings error.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "settings-error-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...##..##",
    "...######",
    "..########",
    "####....####",
    "###.o..o.###",
    ".##..oo..##",
    ".##..oo..##",
    "###.o..o.###",
    "####....####",
    "..########",
    "...######",
    "...##..##",
  ],
};

export default icon;
