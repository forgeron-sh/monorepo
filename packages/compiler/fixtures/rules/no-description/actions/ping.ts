import { action, z } from "@forgeron/sdk";

export default action({ description: "", access: "read", input: z.object({}), run: () => 1 });
