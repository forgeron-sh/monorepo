import type { PixelIcon } from "../types";

// QR code: three finder squares and data blocks in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "qr-code",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..####",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
    "",
    "",
    ".####..oo",
    ".#..#..oo",
    ".#..#....oo",
    ".####....oo",
  ],
};

export default icon;
