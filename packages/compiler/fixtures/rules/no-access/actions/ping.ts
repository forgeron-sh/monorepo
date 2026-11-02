import { action, z } from "@forgeron/sdk";

// access is missing: a JavaScript caller can leave it out.
export default action({ description: "Pings.", input: z.object({}), run: () => 1 });
