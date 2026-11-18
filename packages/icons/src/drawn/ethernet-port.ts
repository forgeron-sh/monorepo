import type { PixelIcon } from "../types";

// Ethernet socket: the stepped outline of an RJ45 port and its row of contacts in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ethernet-port",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    "...#....#",
    ".###....###",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#.oooooo.#",
    ".##########",
  ],
};

export default icon;
