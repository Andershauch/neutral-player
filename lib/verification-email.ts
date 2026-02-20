interface SendVerificationEmailInput {
  to: string;
  verifyUrl: string;
  name?: string | null;
}

interface SendVerificationEmailResult {
  sent: boolean;
  reason?: string;
}

export async function sendVerificationEmail(
  input: SendVerificationEmailInput
): Promise<SendVerificationEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.VERIFY_FROM_EMAIL || process.env.INVITE_FROM_EMAIL;

  if (!apiKey || !from) {
    return { sent: false, reason: "email-provider-not-configured" };
  }

  const subject = "Bekræft din email";
  const greeting = input.name ? `Hej ${escapeHtml(input.name)},` : "Hej,";
  const html = [
    "<div style='font-family:Arial,sans-serif;line-height:1.5;color:#111'>",
    `<p>${greeting}</p>`,
    "<p>Klik på knappen herunder for at bekræfte din email og fortsætte setup.</p>",
    `<p><a href='${input.verifyUrl}' style='display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px'>Bekræft email</a></p>`,
    `<p>Eller brug dette link:<br /><a href='${input.verifyUrl}'>${input.verifyUrl}</a></p>`,
    "</div>",
  ].join("");

  const text = [
    "Bekræft din email for at fortsætte setup.",
    `Bekræft email: ${input.verifyUrl}`,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
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
