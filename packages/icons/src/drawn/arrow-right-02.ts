import type { PixelIcon } from "../types";

// Arrow pointing right: the head of `arrow-right-01` on a two-row shaft, centred both ways.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "arrow-right-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "......##",
    ".......##",
    "........##",
    ".##########",
    ".##########",
    "........##",
    ".......##",
    "......##",
  ],
};

export default icon;
