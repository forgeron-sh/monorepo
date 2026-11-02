import { describe, expect, expectTypeOf, it } from "vitest";
import { action, z, type Context } from "./index";

// A context with only what a test needs: actions are plain functions of their context.
function contextOf<Input>(input: Input) {
  return { input } as unknown as Context<Input>;
}

describe("action", () => {
  const reply = action({
    description: "Adds a customer-visible reply to a ticket.",
    access: "write",
    confirm: true,
    input: z.object({ id: z.number().int(), message: z.string().min(1) }),
    cli: { args: ["id", "message"] },
    async run(ctx) {
      return { ok: ctx.input.message.length > 0 };
    },
  });

  it("keeps what the developer declared, tagged as an action", () => {
    expect(reply).toMatchObject({
      kind: "action",
      access: "write",
      confirm: true,
      cli: { args: ["id", "message"] },
    });
  });

  it("does not resolve the defaults: the compiler does", () => {
    const list = action({
      description: "Lists.",
      access: "read",
      input: z.object({}),
      run: () => 1,
    });
    expect(list.confirm).toBeUndefined();
    expect(list.http).toBeUndefined();
  });

  it("runs with a typed context", async () => {
    await expect(reply.run(contextOf({ id: 1, message: "Hello" }))).resolves.toEqual({ ok: true });
  });

  it("types the input from the schema, after defaults", () => {
    const list = action({
      description: "Lists tickets.",
      access: "read",
      input: z.object({ mine: z.boolean().default(true), limit: z.number().optional() }),
      run(ctx) {
        expectTypeOf(ctx.input).toEqualTypeOf<{ mine: boolean; limit?: number | undefined }>();
        return [];
      },
    });
    expect(list.kind).toBe("action");
  });

  it("types the result from the output schema", () => {
    const withOutput = action({
      description: "Moves a lead.",
      access: "write",
      input: z.object({ id: z.string() }),
      output: z.object({ id: z.string(), stage: z.string() }),
      run: (ctx) => ({ id: ctx.input.id, stage: "won" }),
    });
    expectTypeOf(withOutput.run).returns.toEqualTypeOf<
      { id: string; stage: string } | Promise<{ id: string; stage: string }>
    >();
  });

  it("accepts a level specific to the tool", () => {
    const upload = action({
      description: "Imports a CSV.",
      access: "import",
      input: z.object({}),
      run: () => null,
    });
    expect(upload.access).toBe("import");
  });

  it("refuses an action without a description or an access level", () => {
    const base = { input: z.object({}), run: () => null };
    expect(() => action({ ...base, description: " ", access: "read" })).toThrow(/description/);
    expect(() => action({ ...base, description: "x", access: "" })).toThrow(/access level/);
  });

  it("refuses a positional argument that is not an input field", () => {
    expect(() =>
      action({
        description: "x",
        access: "read",
        input: z.object({ id: z.string() }),
        // @ts-expect-error `name` is not a field of the input
        cli: { args: ["name"] },
        run: () => null,
      }),
    ).toThrow(/"name"/);
  });
});
