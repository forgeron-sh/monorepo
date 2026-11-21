import { CommandLine, CommandLineCopy, CommandLinePrompt, CommandLineText } from "@forgeron/ui";

// The parts: prompt, text and a copy button, placed as you like.
export default function Composed() {
  return (
    <CommandLine>
      <CommandLinePrompt>$</CommandLinePrompt>
      <CommandLineText>npx forgeron init</CommandLineText>
      <CommandLineCopy value="npx forgeron init" />
    </CommandLine>
  );
}
