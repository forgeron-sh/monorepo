import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@forgeron/ui";

// shadcn's InputOTP: the cells in groups, a separator between them.
export default function Composed() {
  return (
    <InputOTP label="Verification code" maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}
