import { describe, expect, it } from "vitest";
import { retargetWorkflow, workflow, workflowEndpoints } from "./workflow";

// The endpoints a workflow names, and the workflow pointed at another platform (D-147).

const OLD = "https://old.forgeron.test";
const NEW = "https://new.forgeron.test";

describe("workflowEndpoints", () => {
  it("lists the distinct origins the workflow deploys to", () => {
    expect(workflowEndpoints(workflow({ version: "1.0.0", endpoint: OLD }))).toEqual([OLD]);
  });

  it("reads quotes, trailing comments and paths, and ignores what is not an address", () => {
    const text = [
      `endpoint: "${OLD}/" # first`,
      `  endpoint: '${NEW}/console'`,
      "endpoint: not an address",
      "endpoint: ${{ vars.ENDPOINT }}",
      "# endpoint: https://commented.test",
    ].join("\n");
    expect(workflowEndpoints(text)).toEqual([OLD, NEW]);
  });

  it("finds none in a workflow that names none", () => {
    expect(workflowEndpoints(workflow({ version: "1.0.0" }))).toEqual([]);
  });
});

describe("retargetWorkflow", () => {
  it("points every endpoint at the new platform and keeps the rest of the file", () => {
    const before = workflow({ version: "1.0.0", endpoint: OLD });
    const after = retargetWorkflow(before, NEW);
    expect(workflowEndpoints(after)).toEqual([NEW]);
    expect(after).toBe(before.replaceAll(OLD, NEW));
  });

  it("keeps quotes' absence, trailing comments and the lines already right", () => {
    const text = `a:\n  endpoint: "${OLD}" # keep\nb:\n  endpoint: ${NEW}\n`;
    expect(retargetWorkflow(text, NEW)).toBe(
      `a:\n  endpoint: ${NEW} # keep\nb:\n  endpoint: ${NEW}\n`,
    );
  });

  it("changes nothing when there is no valid target", () => {
    const text = workflow({ version: "1.0.0", endpoint: OLD });
    expect(retargetWorkflow(text, "nope")).toBe(text);
  });
});
