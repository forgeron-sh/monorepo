import type { PixelIcon } from "../types";

// Server stack with a cog badge in the secondary tone: `server-stack-01` with its lower unit cut by the badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "server-cog",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#.##.....#",
    ".#.##.....#",
    ".##########",
    "",
    ".......o.o",
    ".####.ooooo",
    ".#.##.oo.oo",
    ".#.##.ooooo",
    ".####..o.o",
  ],
};

export default icon;
