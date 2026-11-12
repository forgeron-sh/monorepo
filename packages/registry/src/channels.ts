// The channels of a tool (D-125). Production and the permanent channels an admin adds take only
// releases; each pushed branch is a temporary channel. Outside production a channel is named by its
// reference: a branch for a temporary channel, `~<name>` for a permanent one. Git refuses `~` in a
// branch name, so a reference is never both. The same reference is the channel's address
// (`/t/<tool>@<branch>`, `/t/<tool>~<name>`), its access rule and its people's library entry.
import type { Environment } from "@forgeron/hosting";
import type { EnvironmentRecord, Registry, RegisteredEnvironment } from "./registry";

/** The mark of a permanent channel's reference. */
export const PERMANENT_MARK = "~";

/** The reference of a channel other than production: its branch, or `~<name>`. */
export function channelRef(environment: Pick<EnvironmentRecord, "name" | "branch" | "channel">) {
  if (environment.name === "channel") return `${PERMANENT_MARK}${environment.channel ?? ""}`;
  return environment.branch ?? "";
}

/** What a reference names: a branch's temporary channel, or a permanent channel. */
export function parseChannelRef(
  ref: string,
): { name: "preview"; branch: string } | { name: "channel"; channel: string } {
  return ref.startsWith(PERMANENT_MARK)
    ? { name: "channel", channel: ref.slice(PERMANENT_MARK.length) }
    : { name: "preview", branch: ref };
}

/** Whether a reference names a permanent channel. */
export const isPermanentRef = (ref: string) => ref.startsWith(PERMANENT_MARK);

/** The environment a reference names, as the registry knows it, or `undefined`. */
export async function environmentOfRef(
  registry: Pick<Registry, "listEnvironments">,
  toolId: string,
  ref: string,
): Promise<EnvironmentRecord | undefined> {
  const wanted = parseChannelRef(ref);
  return (await registry.listEnvironments(toolId)).find((e) =>
    wanted.name === "channel"
      ? e.name === "channel" && e.channel === wanted.channel
      : e.name === "preview" && e.branch === wanted.branch,
  );
}

/** The hosting target of a reference. */
export function hostingTargetOfRef(tool: string, ref: string): Environment {
  const wanted = parseChannelRef(ref);
  return wanted.name === "channel"
    ? { tool, name: "channel", channel: wanted.channel }
    : { tool, name: "preview", branch: wanted.branch };
}

/** The hosting target of an environment the registry knows. */
export function hostingTargetOf(
  tool: string,
  environment: Pick<EnvironmentRecord, "name" | "branch" | "channel">,
): Environment {
  const name: RegisteredEnvironment = environment.name;
  return {
    tool,
    name,
    ...(name === "preview" && environment.branch ? { branch: environment.branch } : {}),
    ...(name === "channel" && environment.channel ? { channel: environment.channel } : {}),
  };
}
