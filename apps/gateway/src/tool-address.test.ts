import { describe, expect, it } from "vitest";
import { channelPath, toolAddress } from "./tool-address";

describe("toolAddress", () => {
  it("is the tool's address for production", () => {
    expect(toolAddress("https://demo.example.com", "demo--crm--production", {})).toBe(
      "https://demo.example.com/t/crm",
    );
  });

  it("carries @<branch> for a preview", () => {
    expect(
      toolAddress("https://demo.example.com", "demo--crm--preview-ab12", { branch: "feat/export" }),
    ).toBe("https://demo.example.com/t/crm@feat/export");
  });

  it("carries ~<name> for a permanent channel other than production (D-125)", () => {
    expect(
      toolAddress("https://demo.example.com", "demo--crm--channel-staging", { channel: "staging" }),
    ).toBe("https://demo.example.com/t/crm~staging");
    expect(channelPath("crm", "~staging")).toBe("/t/crm~staging");
    expect(channelPath("crm", "feat/x")).toBe("/t/crm@feat%2Fx");
  });
});
