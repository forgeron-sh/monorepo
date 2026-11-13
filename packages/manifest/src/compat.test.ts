import { describe, expect, it } from "vitest";
import { CONTRACTS, CURRENT_CONTRACT, checkContract, type ContractPlatform } from "./compat";

const platform = (
  ...statuses: Array<"supported" | "deprecated" | "removed">
): ContractPlatform => ({
  current: statuses.length,
  records: statuses.map((status, i) => ({
    contract: i + 1,
    sdk: `>=0.${i + 1}.0`,
    status,
    note: "test",
    ...(status === "deprecated" ? { sunset: "2027-01-01" } : {}),
    ...(status === "removed" ? { removedIn: "0.9.0" } : {}),
  })),
});

const stamped = (contract: number, sdk?: string) => ({
  forgeron: { contract, ...(sdk ? { sdk } : {}) },
});

describe("checkContract", () => {
  it("takes a build with no stamp as the first contract", () => {
    expect(checkContract({})).toEqual({ ok: true, contract: 1, warnings: [] });
  });

  it("takes the current contract", () => {
    expect(checkContract(stamped(CURRENT_CONTRACT, "0.4.0"))).toMatchObject({ ok: true });
  });

  it("refuses a tool ahead of the platform, and says what to do", () => {
    const result = checkContract(stamped(3, "0.6.0"), platform("supported", "supported"));
    expect(result).toMatchObject({ ok: false, code: "AHEAD", contract: 3 });
    expect(result.ok === false && result.message).toContain("Update the platform");
    expect(result.ok === false && result.message).toContain("contract 3 (SDK 0.6.0)");
  });

  it("refuses a removed contract", () => {
    const result = checkContract(stamped(1), platform("removed", "supported"));
    expect(result).toMatchObject({ ok: false, code: "REMOVED" });
    expect(result.ok === false && result.message).toContain("removed in 0.9.0");
    expect(result.ok === false && result.message).toContain(">=0.2.0");
  });

  it("takes a deprecated contract, with its sunset as a warning", () => {
    const result = checkContract(stamped(1), platform("deprecated", "supported"));
    expect(result).toMatchObject({ ok: true, contract: 1 });
    expect(result.ok && result.warnings[0]).toContain("2027-01-01");
  });

  it("refuses a stamp that is not a contract", () => {
    for (const forgeron of [{ contract: 0 }, { contract: 1.5 }, { contract: "2" }, "x", null, {}]) {
      expect(checkContract({ forgeron })).toMatchObject({ ok: false, code: "INVALID" });
    }
  });

  it("does not need the rest of the manifest to be valid for this platform", () => {
    expect(checkContract({ forgeron: { contract: 9 }, somethingNew: true })).toMatchObject({
      ok: false,
      code: "AHEAD",
    });
  });
});

describe("the register", () => {
  it("numbers its contracts one after the other", () => {
    expect(CONTRACTS.map((record) => record.contract)).toEqual(
      CONTRACTS.map((_, index) => index + 1),
    );
  });

  it("keeps the newest contract supported", () => {
    expect(CONTRACTS.at(-1)?.status).toBe("supported");
  });
});
