import { on } from "@forgeron/sdk";

export default on("order.placed", { mode: "queue" }, () => {});
