import type { PixelIcon } from "../types";

// Server stack: two units, each with a light in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "server-stack-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.oo.....#",
    ".#.oo.....#",
    ".##########",
    "",
    "",
    ".##########",
    ".#.oo.....#",
    ".#.oo.....#",
    ".##########",
  ],
};

export default icon;
