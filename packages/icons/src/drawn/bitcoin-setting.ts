import type { PixelIcon } from "../types";

// The cog of `settings-01` with a quarter taken out and a bitcoin sign in its place.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-setting",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...##..##",
    "...######",
    "..########",
    "####....####",
    "###......###",
    ".##......##",
    ".##",
    "###....oooo",
    "####...o...o",
    "..####.oooo",
    "...###.o...o",
    "...##..oooo",
  ],
};

export default icon;
