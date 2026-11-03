# @forgeron/sdk

What a tool imports. The public API is specified in `docs/sdk.md`; this package implements it.

## Planned contents

- `.`: `defineConfig`, `action`, `on`, `schedule`, `z`, `ToolError` (`sdk.md` §3, §6, §9)
- `./db`: schema, migrations, `sql` (`sdk.md` §8)
- `./react`: `defineView`, `useAction`, `useMutation`, `useParams`, `useUser`, `useCan`, and `ViewHost`, which checks access then parameters before rendering a view; React is an optional peer dependency (`sdk.md` §11)
- `./testing`: `createTestTool`, `mockFetch` (`sdk.md` §13)

## Notes

Imports neither `@forgeron/compiler` nor `@forgeron/hosting` (`sdk-stays-light` rule): a tool never ships build or deployment tooling.
