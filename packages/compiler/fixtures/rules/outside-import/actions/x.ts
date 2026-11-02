import { action, z } from "@forgeron/sdk";
import { shared } from "../../shared-outside";

export default action({
  description: "Imports a file outside.",
  access: "read",
  input: z.object({}),
  run: () => shared,
});
