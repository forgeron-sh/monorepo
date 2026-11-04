import { describe, expect, it } from "vitest";
import { toolAddress } from "./tool-address";

describe("toolAddress", () => {
  it("is the tool's address for production", () => {
    expect(toolAddress("https://demo.fabriks.cc", "demo--crm--production", {})).toBe(
      "https://demo.fabriks.cc/t/crm",
    );
  });

  it("carries @<branch> for a preview", () => {
    expect(
      toolAddress("https://demo.fabriks.cc", "demo--crm--preview-ab12", { branch: "feat/export" }),
    ).toBe("https://demo.fabriks.cc/t/crm@feat/export");
  });
});
