import { describe, expect, it } from "vitest";
import { ACCESS_LEVELS } from "./index";

describe("ACCESS_LEVELS", () => {
  it("lists the standard levels", () => {
    expect(ACCESS_LEVELS).toEqual(["read", "write", "delete", "admin"]);
  });
});
