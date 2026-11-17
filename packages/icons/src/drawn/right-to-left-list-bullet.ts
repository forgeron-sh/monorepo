import type { PixelIcon } from "../types";

// Right-to-left bulleted list: list-view mirrored, bullets on the right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "right-to-left-list-bullet",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#######.oo",
    "",
    "",
    ".#######.oo",
    "",
    "",
    ".#######.oo",
    "",
    "",
    ".#######.oo",
  ],
};

export default icon;
