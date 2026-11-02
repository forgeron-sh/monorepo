import { schedule } from "@forgeron/sdk";

export default schedule("0 2 * * *", { timezone: "Europe/Paris" }, () => {});
