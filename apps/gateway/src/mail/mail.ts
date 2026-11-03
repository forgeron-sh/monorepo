// Sending mail (D-049). The gateway only needs to send a short message to one address, so the
// interface is that and nothing more; what carries it is chosen where the gateway is built.

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
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
