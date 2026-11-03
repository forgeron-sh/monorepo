// The entry of the deployed Worker (`scripts/build.ts`). workerd treats every named export of the
// main module as an entrypoint and refuses one that is not a handler (`DEPLOY_SCOPE` is a string),
// so the bundle exposes the default handler only; `index.ts` keeps its named exports for the code
// and tests that import them.
export { default } from "./index";
