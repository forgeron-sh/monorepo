import type { PixelIcon } from "../types";

// Heavy check mark: both arms three pixels thick, the bold counterpart of `tick-02`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tick-04",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".........##",
    "........###",
    ".......###",
    ".##...###",
    ".###.###",
    "..#####",
    "...###",
  ],
};

export default icon;
