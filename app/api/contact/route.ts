import { NextResponse } from "next/server";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { sendContactEmail } from "@/lib/contact-email";

interface ContactPayload {
  name?: string;
  email?: string;
  company?: string;
  message?: string;
  website?: string;
}

export async function POST(req: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey("public:contact", req),
      max: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return rateLimitExceededResponse(rateLimit);
    }

    const body = (await req.json()) as ContactPayload;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const website = typeof body.website === "string" ? body.website.trim() : "";

    // Honeypot for bots: pretend success without sending email.
    if (website) {
      return NextResponse.json({ success: true });
    }

    if (name.length < 2 || name.length > 120) {
      return NextResponse.json({ error: "Ugyldigt navn." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Ugyldig email." }, { status: 400 });
    }
    if (company.length > 120) {
      return NextResponse.json({ error: "Firmanavn er for langt." }, { status: 400 });
    }
    if (message.length < 10 || message.length > 2000) {
      return NextResponse.json({ error: "Beskeden skal være mellem 10 og 2000 tegn." }, { status: 400 });
    }

    const result = await sendContactEmail({
      name,
      email,
      company,
      message,
    });

    if (!result.sent) {
      return NextResponse.json(
        { error: "Kontaktformular er ikke konfigureret korrekt endnu.", reason: result.reason ?? null },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

