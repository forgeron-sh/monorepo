import { describe, expect, it } from "vitest";
import { TOOL_ERROR_CODES, ToolError } from "./index";

describe("ToolError", () => {
  it("lists the shared codes", () => {
    expect(TOOL_ERROR_CODES).toEqual([
      "INVALID",
      "FORBIDDEN",
      "NOT_FOUND",
      "CONFLICT",
      "RATE_LIMITED",
      "UPSTREAM",
    ]);
  });

  it("carries a code, a message and details", () => {
    const error = new ToolError("UPSTREAM", "Odoo error", { status: 502 });
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "ToolError",
      code: "UPSTREAM",
      message: "Odoo error",
      details: { status: 502 },
    });
  });

  it("can be told apart from other errors", () => {
    expect(new Error("x")).not.toBeInstanceOf(ToolError);
  });
});
