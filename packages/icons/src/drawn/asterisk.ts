import type { PixelIcon } from "../types";

// Six-armed asterisk drawn as a solid shape.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "asterisk",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    ".....##",
    ".##..##..##",
    "...######",
    "...######",
    ".##..##..##",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
