interface SendInviteEmailInput {
  to: string;
  inviteUrl: string;
  workspaceName: string;
  role: string;
  inviterName: string;
}

interface SendInviteEmailResult {
  sent: boolean;
  reason?: string;
}

export async function sendInviteEmail(input: SendInviteEmailInput): Promise<SendInviteEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITE_FROM_EMAIL;

  if (!apiKey || !from) {
    return { sent: false, reason: "email-provider-not-configured" };
  }

  const subject = `Invitation til ${input.workspaceName}`;
  const html = [
    "<div style='font-family:Arial,sans-serif;line-height:1.5;color:#111'>",
    `<h2>Du er inviteret til ${escapeHtml(input.workspaceName)}</h2>`,
    `<p>${escapeHtml(input.inviterName)} har inviteret dig som <strong>${escapeHtml(input.role)}</strong>.</p>`,
    `<p><a href='${input.inviteUrl}' style='display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px'>Accepter invitation</a></p>`,
    `<p>Eller brug dette link:<br /><a href='${input.inviteUrl}'>${input.inviteUrl}</a></p>`,
    "</div>",
  ].join("");

  const text = [
    `Du er inviteret til ${input.workspaceName}.`,
    `${input.inviterName} har inviteret dig som ${input.role}.`,
    `Accepter invitation: ${input.inviteUrl}`,
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
