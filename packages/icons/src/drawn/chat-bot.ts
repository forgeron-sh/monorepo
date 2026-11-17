import type { PixelIcon } from "../types";

// Chat bot: the speech bubble of `message-01` with an antenna and two eyes in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chat-bot",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "..########",
    ".#........#",
    ".#.oo..oo.#",
    ".#.oo..oo.#",
    ".#........#",
    ".#........#",
    "..#..#####",
    "..#.#",
    "..##",
  ],
};

export default icon;
