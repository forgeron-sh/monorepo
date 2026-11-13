// Sending mail (D-049). The gateway only needs to send a short message to one address, so the
// interface is that and nothing more; what carries it is chosen where the gateway is built.

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  /** What the message carries, for a sender that does not send mail (`consoleMailSender`). */
  code?: string;
  invitation?: { teams: string[] };
  /** A notice to a person, for a sender that does not send mail: what happened, never a value (D-111). */
  notice?: string;
}

export interface MailSender {
  send(message: MailMessage): Promise<void>;
}

/** The `send_email` binding of Cloudflare Email Service (`env.EMAIL.send`, Workers API). */
export interface SendEmailBinding {
  send(message: { from: string; to: string; subject: string; text: string }): Promise<unknown>;
}

/** Sends through Cloudflare Email Sending; `from` is an address of a domain onboarded there. */
export function cloudflareMailSender(binding: SendEmailBinding, from: string): MailSender {
  return {
    async send(message) {
      await binding.send({ from, to: message.to, subject: message.subject, text: message.text });
    },
  };
}

/**
 * Test installs (D-051): no mail goes out; one structured line per code or invitation goes to the
 * Worker's logs. Anyone who can read the logs can sign in as an allowed address.
 */
export function consoleMailSender(log: (line: string) => void = console.log): MailSender {
  return {
    async send(message) {
      if (message.code !== undefined) {
        log(JSON.stringify({ event: "sign-in code", address: message.to, code: message.code }));
      } else if (message.notice !== undefined) {
        log(JSON.stringify({ event: message.notice, address: message.to }));
      } else if (message.invitation) {
        log(
          JSON.stringify({
            event: "invitation",
            address: message.to,
            teams: message.invitation.teams,
          }),
        );
      }
    },
  };
}

/** A sender that keeps what it is given, for tests: nothing leaves the process. */
export function memoryMailSender(): MailSender & { sent: MailMessage[] } {
  const sent: MailMessage[] = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}
