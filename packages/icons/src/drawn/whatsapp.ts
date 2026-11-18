import type { PixelIcon } from "../types";

// The WhatsApp mark: a round speech bubble with a pointed tail and a phone handset inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "whatsapp",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#####",
    ".##.....##",
    ".#.......#",
    "#..oo.....#",
    "#..oo.....#",
    "#...o.....#",
    "#....o.oo.#",
    "#.....ooo.#",
    ".#.......#",
    "##......##",
    "#.######",
  ],
};

export default icon;
