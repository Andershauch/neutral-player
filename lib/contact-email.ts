interface SendContactEmailInput {
  name: string;
  email: string;
  company?: string;
  message: string;
}

interface SendContactEmailResult {
  sent: boolean;
  reason?: string;
}

export async function sendContactEmail(input: SendContactEmailInput): Promise<SendContactEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL || process.env.INVITE_FROM_EMAIL || process.env.VERIFY_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !from || !to) {
    return { sent: false, reason: "email-provider-not-configured" };
  }

  const subject = `Ny kontaktforespørgsel fra ${input.name}`;
  const html = [
    "<div style='font-family:Arial,sans-serif;line-height:1.5;color:#111'>",
    "<h2>Ny kontaktforespørgsel</h2>",
    `<p><strong>Navn:</strong> ${escapeHtml(input.name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(input.email)}</p>`,
    `<p><strong>Firma:</strong> ${escapeHtml(input.company || "-")}</p>`,
    `<p><strong>Besked:</strong></p>`,
    `<p>${escapeHtml(input.message).replaceAll("\n", "<br/>")}</p>`,
    "</div>",
  ].join("");

  const text = [
    "Ny kontaktforespørgsel",
    `Navn: ${input.name}`,
    `Email: ${input.email}`,
    `Firma: ${input.company || "-"}`,
    "Besked:",
    input.message,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: input.email,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    return { sent: false, reason: "provider-error" };
  }

  return { sent: true };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

