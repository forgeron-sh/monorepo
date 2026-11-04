import { createRequestScope, createRoot } from "../src/spike/container";
import { createRequestModules } from "../src/spike/explicit";
const d1 = { prepare: () => ({}) } as never;
const mk = () => ({ d1, workspace: "acme", request: new Request("https://a/"), secret: "s" });
const N = 20000;
const root = createRoot();
const time = (label: string, f: () => unknown) => {
  for (let i = 0; i < 2000; i++) f();
  const t = performance.now();
  for (let i = 0; i < N; i++) f();
  console.log(label, (((performance.now() - t) / N) * 1000).toFixed(2), "µs/request");
};
time("awilix scope + resolve whoAmI ", () => createRequestScope(root, mk()).cradle.whoAmI);
time("explicit factories           ", () => createRequestModules(mk(), () => new Date()));
