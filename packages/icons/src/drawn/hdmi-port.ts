import type { PixelIcon } from "../types";

// HDMI port: the trapezoid socket, the pin strip in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hdmi-port",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##########",
    ".#........#",
    ".#.oooooo.#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
