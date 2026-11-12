import { afterEach, describe, expect, it, vi } from "vitest";
import { parseWorkspaceHosts, workspaceHosts } from "./workspace";

// D-126: which workspace a host serves, and the one address of each workspace.

afterEach(() => vi.restoreAllMocks());

describe("parseWorkspaceHosts", () => {
  it("reads host=workspace pairs, in order, lower case, without port or trailing dot", () => {
    expect(
      parseWorkspaceHosts(" Forgeron-Gateway.Acct.workers.dev=acme , tools.example.com:443=globex"),
    ).toEqual([
      ["forgeron-gateway.acct.workers.dev", "acme"],
      ["tools.example.com", "globex"],
    ]);
  });

  it("leaves out an entry that is not a host and a workspace name, and logs it", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(
      parseWorkspaceHosts("nohost=acme,a.example=Not A Name,b.example=www,c.example=acme=x"),
    ).toEqual([]);
    expect(logged).toHaveBeenCalled();
  });

  it("keeps the first workspace of a host given twice", () => {
    expect(parseWorkspaceHosts("a.example=acme,a.example=globex")).toEqual([["a.example", "acme"]]);
  });
});

describe("workspaceHosts", () => {
  it("is the subdomain rule alone when nothing else is set (as before D-126)", () => {
    const hosts = workspaceHosts({ BASE_DOMAIN: "forgeron.app" });
    expect(hosts.workspaceOf("acme.forgeron.app")).toBe("acme");
    expect(hosts.workspaceOf("forgeron-gateway.acct.workers.dev")).toBeUndefined();
    expect(hosts.workspaceOf("www.forgeron.app")).toBeUndefined();
    expect(hosts.primaryOrigin("acme")).toBe("https://acme.forgeron.app");
  });

  it("serves a mapped host, before the subdomain rule", () => {
    const hosts = workspaceHosts({
      BASE_DOMAIN: "forgeron.test",
      WORKSPACE_HOSTS: "forgeron-gateway.acct.workers.dev=acme,globex.forgeron.test=acme",
    });
    expect(hosts.workspaceOf("FORGERON-GATEWAY.acct.workers.dev:443")).toBe("acme");
    expect(hosts.workspaceOf("globex.forgeron.test")).toBe("acme");
    expect(hosts.workspaceOf("initech.forgeron.test")).toBe("initech");
    expect(hosts.workspaceOf("other.workers.dev")).toBeUndefined();
  });

  it("makes the first mapped host the primary origin, else the subdomain", () => {
    const hosts = workspaceHosts({
      BASE_DOMAIN: "forgeron.test",
      WORKSPACE_HOSTS: "tools.acme.fr=acme,acme.example=acme",
    });
    expect(hosts.primaryOrigin("acme")).toBe("https://tools.acme.fr");
    expect(hosts.primaryOrigin("globex")).toBe("https://globex.forgeron.test");
  });

  it("serves the default workspace on any other host", () => {
    const hosts = workspaceHosts({ BASE_DOMAIN: "forgeron.test", DEFAULT_WORKSPACE: "acme" });
    expect(hosts.workspaceOf("forgeron-gateway.acct.workers.dev")).toBe("acme");
    expect(hosts.workspaceOf("globex.forgeron.test")).toBe("globex");
    // The default adds hosts, it changes no address: the primary origin is still the subdomain.
    expect(hosts.primaryOrigin("acme")).toBe("https://acme.forgeron.test");
  });

  it("works with no base domain: mapped hosts and the default only", () => {
    const hosts = workspaceHosts({
      WORKSPACE_HOSTS: "a.example=acme",
      DEFAULT_WORKSPACE: "globex",
    });
    expect(hosts.workspaceOf("a.example")).toBe("acme");
    expect(hosts.workspaceOf("acme.forgeron.app")).toBe("globex");
    expect(hosts.primaryOrigin("acme")).toBe("https://a.example");
    // No stable address: the gateway uses the request's origin instead.
    expect(hosts.primaryOrigin("globex")).toBeUndefined();
  });

  it("ignores a default that is not a workspace name", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const hosts = workspaceHosts({ BASE_DOMAIN: "forgeron.test", DEFAULT_WORKSPACE: "admin" });
    expect(hosts.workspaceOf("x.example")).toBeUndefined();
  });
});
