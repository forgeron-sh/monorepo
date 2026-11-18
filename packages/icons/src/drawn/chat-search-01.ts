import type { PixelIcon } from "../types";

// Speech bubble of `message-01` with a magnifier badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-search-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#",
    ".#.....ooo",
    "..#..#.o.o",
    "..#.#..ooo",
    "..##......o",
    "...........o",
  ],
};

export default icon;
