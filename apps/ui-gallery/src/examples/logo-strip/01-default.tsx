import { LogoStrip } from "@forgeron/ui";

// Real names only: until then, the slots stay hatched.
export default function Default() {
  return <LogoStrip label="Forging at" names={["Acme"]} slots={4} />;
}
