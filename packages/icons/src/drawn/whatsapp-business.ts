import type { PixelIcon } from "../types";

// The WhatsApp Business mark: the round speech bubble with a letter B inside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "whatsapp-business",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...#####",
    ".##.....##",
    ".#.......#",
    "#..ooo....#",
    "#..o..o...#",
    "#..ooo....#",
    "#..o..o...#",
    "#..ooo....#",
    ".#.......#",
    "##......##",
    "#.######",
  ],
};

export default icon;
