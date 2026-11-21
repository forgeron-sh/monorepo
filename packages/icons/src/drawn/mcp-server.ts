import type { PixelIcon } from "../types";

// MCP server: a server unit with its lights in the secondary tone, wired down to three clients.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "mcp-server",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    ".#.oo.....#",
    ".##########",
    ".#.oo.....#",
    ".##########",
    ".....##",
    ".....##",
    ".##########",
    ".##..##..##",
    "",
    ".oo..oo..oo",
    ".oo..oo..oo",
  ],
};

export default icon;
