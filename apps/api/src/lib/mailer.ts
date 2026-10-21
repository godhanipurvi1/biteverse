export type MailMessage = { to: string; subject: string; text: string };

// The only place email leaves the API. In development it prints to the console.
// To go live, replace the body with a provider call. Callers don't change.
export async function sendMail(message: MailMessage): Promise<void> {
  console.log(`[mail] to=${message.to} subject="${message.subject}"`);
  console.log(message.text);
}
