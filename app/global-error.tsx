"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // global-error erstatter hele root layout, så globals.css er ikke tilgængelig her.
  return (
    <html lang="da">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f6f5f2",
          color: "#111827",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            width: "100%",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "24px",
            padding: "40px 32px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(17, 24, 39, 0.08)",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "#6b7280",
            }}
          >
            Neutralplayer
          </p>
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "22px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
            }}
          >
            Der opstod en uventet fejl
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: "14px", lineHeight: 1.6, color: "#6b7280" }}>
            Fejlen er registreret, og vi kigger på den. Prøv at genindlæse siden eller gå tilbage til forsiden.
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "14px 24px",
              borderRadius: "9999px",
              background: "#17494d",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Gå til forsiden
          </a>
        </div>
      </body>
    </html>
  );
}
