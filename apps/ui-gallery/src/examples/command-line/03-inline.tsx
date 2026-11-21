import { CommandLine } from "@forgeron/ui";

export default function Inline() {
  return (
    <p>
      Start with <CommandLine framed={false}>npx forgeron init</CommandLine>.
    </p>
  );
}
