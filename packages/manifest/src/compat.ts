// Which builds a platform accepts (D-136). A tool's build and the platform that runs it are released
// apart; what binds them is a **contract number**: the shape of the manifest and of what the runtime
// offers a tool. A build is stamped with the contract of the SDK it was made with (`manifest.forgeron`);
// every place that takes a build (`POST /deploy`, a marketplace, a rollback) asks `checkContract`
// **before** reading the manifest in detail, so that a tool made for a newer platform is refused with
// its reason, not with "the manifest is not valid".
//
// The table is the platform's register, like the deprecation policy of Kubernetes or `versions.json` of
// Obsidian: one line per contract, the SDK versions that produce it, and where it stands. Adding a
// contract is the rule for any change a platform of the previous contract could not read.

export type ContractStatus = "supported" | "deprecated" | "removed";

export interface ContractRecord {
  contract: number;
  /** The SDK versions that stamp this contract, for the person who has to change one. */
  sdk: string;
  status: ContractStatus;
  /** What this contract brought, one line. */
  note: string;
  /** `deprecated`: the day it stops being accepted (YYYY-MM-DD), once decided. */
  sunset?: string;
  /** `removed`: the SDK release from which it is refused. */
  removedIn?: string;
}

/**
 * The register. Never edit a line away: a contract only goes `supported` → `deprecated` → `removed`
 * (at least one minor release between the last two), and a new one is appended.
 */
export const CONTRACTS: readonly ContractRecord[] = [
  {
    contract: 1,
    sdk: "<0.4.0",
    status: "supported",
    note: "Builds made before the contract was stamped (no `forgeron` in the manifest).",
  },
  {
    contract: 2,
    sdk: ">=0.4.0",
    status: "supported",
    note: "ctx.directory, teams, member pictures, pages in production and realtime channels (D-130 to D-135).",
  },
];

/** The contract a build made today carries, and the newest this platform reads. */
export const CURRENT_CONTRACT = Math.max(...CONTRACTS.map((record) => record.contract));

/** A manifest that says nothing was made before contracts existed. */
export const LEGACY_CONTRACT = 1;

export interface ContractPlatform {
  /** The newest contract this platform reads. */
  current: number;
  records: readonly ContractRecord[];
}

export const DEFAULT_PLATFORM: ContractPlatform = {
  current: CURRENT_CONTRACT,
  records: CONTRACTS,
};

export type ContractCheck =
  | { ok: true; contract: number; warnings: string[] }
  | { ok: false; code: "AHEAD" | "REMOVED" | "INVALID"; contract?: number; message: string };

const newest = (platform: ContractPlatform) =>
  platform.records.find((record) => record.contract === platform.current);

/**
 * Whether a platform takes a build, read from the raw manifest (it does not need to be valid for this
 * platform: that is the point). Refused when the tool is **ahead** of the platform, or its contract
 * has been **removed**; accepted with a warning when it is **deprecated**.
 */
export function checkContract(
  manifest: unknown,
  platform: ContractPlatform = DEFAULT_PLATFORM,
): ContractCheck {
  const stamp =
    typeof manifest === "object" && manifest !== null
      ? (manifest as { forgeron?: unknown }).forgeron
      : undefined;
  let contract = LEGACY_CONTRACT;
  let sdk: string | undefined;
  if (stamp !== undefined) {
    const raw =
      typeof stamp === "object" && stamp !== null ? (stamp as Record<string, unknown>) : {};
    if (typeof raw.contract !== "number" || !Number.isInteger(raw.contract) || raw.contract < 1) {
      return {
        ok: false,
        code: "INVALID",
        message: "manifest.forgeron.contract: a whole number from 1.",
      };
    }
    contract = raw.contract;
    if (typeof raw.sdk === "string") sdk = raw.sdk.slice(0, 64);
  }
  const made = sdk ? `contract ${contract} (SDK ${sdk})` : `contract ${contract}`;
  const wanted = newest(platform);

  if (contract > platform.current) {
    return {
      ok: false,
      code: "AHEAD",
      contract,
      message: `This tool was built for Forgeron ${made}, newer than the one this platform reads (contract ${platform.current}). Update the platform, or build the tool with @forgeron/sdk ${wanted?.sdk ?? "of this platform"}.`,
    };
  }
  const record = platform.records.find((candidate) => candidate.contract === contract);
  if (!record) {
    return {
      ok: false,
      code: "INVALID",
      contract,
      message: `This tool was built for Forgeron ${made}, which this platform does not know.`,
    };
  }
  if (record.status === "removed") {
    return {
      ok: false,
      code: "REMOVED",
      contract,
      message: `This tool was built for Forgeron ${made}, which is no longer supported${record.removedIn ? ` (removed in ${record.removedIn})` : ""}. Update @forgeron/sdk to ${wanted?.sdk ?? "the current release"} and build again.`,
    };
  }
  const warnings =
    record.status === "deprecated"
      ? [
          `Forgeron ${made} is deprecated${record.sunset ? ` and stops being accepted on ${record.sunset}` : ""}: update @forgeron/sdk to ${wanted?.sdk ?? "the current release"}.`,
        ]
      : [];
  return { ok: true, contract, warnings };
}
