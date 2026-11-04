// SPIKE FOR-144, throwaway: an Awilix root container per isolate and one scope per request.
import { createRegistry, type Registry } from "@forgeron/registry";
import { asClass, asFunction, asValue, createContainer, InjectionMode } from "awilix";
import { createCaller } from "../identity/caller";
import type { Person } from "../identity/authenticate";

/** What a request puts in its scope: never anything of another request. */
export interface RequestDeps {
  d1: Parameters<typeof createRegistry>[0];
  workspace: string;
  request: Request;
  secret: string;
  secretsKey?: string;
}

class Clock {
  now() {
    return new Date();
  }
}

/** A use case written as a class: its dependencies arrive by name (PROXY mode). */
class WhoAmI {
  private readonly caller: ReturnType<typeof createCaller>;
  private readonly workspace: string;
  private readonly request: Request;
  // PROXY mode hands the constructor ONE argument, the cradle: destructure it, never list
  // positional parameters (a positional `caller` would receive the cradle itself).
  constructor(deps: {
    caller: ReturnType<typeof createCaller>;
    workspace: string;
    request: Request;
  }) {
    this.caller = deps.caller;
    this.workspace = deps.workspace;
    this.request = deps.request;
  }
  async execute(): Promise<Person | undefined> {
    return (await this.caller.identify(this.request, this.workspace, true))?.person;
  }
}

export function createRoot() {
  return createContainer({ injectionMode: InjectionMode.PROXY, strict: true }).register({
    clock: asClass(Clock).singleton(),
    // Registry, caller and use cases hold the request's D1 and identity: scoped, never singleton.
    registry: asFunction(({ d1, clock }: { d1: RequestDeps["d1"]; clock: Clock }) =>
      createRegistry(d1, { now: () => clock.now() }),
    ).scoped(),
    caller: asFunction(
      ({ registry, secret, clock }: { registry: Registry; secret: string; clock: Clock }) =>
        createCaller({ registry, secret, now: () => clock.now() }),
    ).scoped(),
    whoAmI: asClass(WhoAmI).scoped(),
  });
}

export type Root = ReturnType<typeof createRoot>;

export function createRequestScope(root: Root, deps: RequestDeps) {
  return root.createScope().register({
    d1: asValue(deps.d1),
    workspace: asValue(deps.workspace),
    request: asValue(deps.request),
    secret: asValue(deps.secret),
  });
}
