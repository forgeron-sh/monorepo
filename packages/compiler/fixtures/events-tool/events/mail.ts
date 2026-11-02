import { on } from "@forgeron/sdk";

// Runs after the order succeeded, through the queue.
export default on("order.placed", { mode: "queue" }, (ctx) => ctx.emit("mail.sent", ctx.payload));
