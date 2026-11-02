import { on } from "@forgeron/sdk";

// Runs inside the action: an error here cancels the order.
export default on("order.placed", (ctx) => ctx.emit("audit.logged", ctx.payload));
