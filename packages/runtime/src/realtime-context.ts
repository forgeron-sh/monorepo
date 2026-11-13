import type { Manifest } from "@forgeron/manifest";
import {
  CHANNEL,
  channelKey,
  MAX_PAYLOAD_BYTES,
  MAX_PUBLISH_PER_CALL,
  type Published,
} from "./realtime";

// `ctx.realtime` (D-135): what an action says to the people listening. Checked here, where the developer
// sees the mistake at once: the channel is declared, the name is valid, the payload is small, and one
// call does not flood. The messages leave with the response (the gateway or the local host reads them).

/** What the action sees: `publish` a message, or `changed` to tell listeners to read again. */
export interface RealtimeContext {
  publish(channel: string, event: string, payload?: unknown): void;
  changed(channel: string): void;
}

const refuse = (message: string) =>
  Object.assign(new Error(message), { name: "ToolError", code: "INVALID" });

export function createRealtimeContext(
  manifest: Pick<Manifest, "realtime">,
  sink: ((message: Published) => void) | undefined,
): RealtimeContext {
  let count = 0;
  const publish = (channel: string, event: string, payload?: unknown) => {
    if (!manifest.realtime) {
      throw refuse("ctx.realtime is used but `realtime` is not declared in forgeron.config.ts.");
    }
    if (!CHANNEL.test(channel)) throw refuse(`"${channel}" is not a channel name.`);
    if (!(channelKey(channel) in manifest.realtime.channels)) {
      throw refuse(`The channel "${channelKey(channel)}" is not declared in realtime.channels.`);
    }
    if (typeof event !== "string" || event === "" || event.length > 60) {
      throw refuse("An event name is 1 to 60 characters.");
    }
    if (new TextEncoder().encode(JSON.stringify(payload ?? null)).length > MAX_PAYLOAD_BYTES) {
      throw refuse(
        `A payload is ${MAX_PAYLOAD_BYTES / 1024} KB at most: send an id and let the page read it.`,
      );
    }
    if (++count > MAX_PUBLISH_PER_CALL) {
      throw refuse(`One call publishes ${MAX_PUBLISH_PER_CALL} messages at most.`);
    }
    sink?.({ channel, event, ...(payload === undefined ? {} : { payload }) });
  };
  return { publish, changed: (channel) => publish(channel, "changed") };
}
