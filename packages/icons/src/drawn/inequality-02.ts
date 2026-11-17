import type { PixelIcon } from "../types";

// Greater-than-or-equal sign, the mirror of inequality-01.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "inequality-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##",
    "...##",
    ".....##",
    ".......##",
    ".........##",
    ".##########",
    "",
    "",
    ".oooooooooo",
  ],
};

export default icon;
