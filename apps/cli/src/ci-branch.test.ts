import { describe, expect, it } from "vitest";
import { ciBranch } from "./ci-branch";

describe("the branch CI builds", () => {
  it("takes the pushed branch when GitHub sets the pull request's to an empty string", () => {
    expect(ciBranch({ GITHUB_HEAD_REF: "", GITHUB_REF_NAME: "main" })).toBe("main");
  });
  it("takes the pull request's branch first", () => {
    expect(ciBranch({ GITHUB_HEAD_REF: "feat/x", GITHUB_REF_NAME: "12/merge" })).toBe("feat/x");
  });
  it("is undefined outside CI", () => {
    expect(ciBranch({})).toBeUndefined();
    expect(ciBranch({ GITHUB_HEAD_REF: "", GITHUB_REF_NAME: "" })).toBeUndefined();
  });
});
