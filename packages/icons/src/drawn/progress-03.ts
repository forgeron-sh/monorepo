import type { PixelIcon } from "../types";

// Progress at three quarters: the ring of `progress-01` drawn solid in the secondary tone except
// its upper left quarter, still dotted.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "progress-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#.ooo",
    ".........o",
    "..........o",
    ".#........o",
    "..........o",
    ".o........o",
    ".o........o",
    ".o........o",
    "..o......o",
    "...oooooo",
  ],
};

export default icon;
