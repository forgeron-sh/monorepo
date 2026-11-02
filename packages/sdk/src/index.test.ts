import { describe, expect, it } from "vitest";
import { ACCESS_LEVELS } from "./index";

describe("ACCESS_LEVELS", () => {
  it("liste les niveaux standard", () => {
    expect(ACCESS_LEVELS).toEqual(["read", "write", "delete", "admin"]);
  });
});
