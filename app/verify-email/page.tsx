import VerifyEmailClient from "@/components/public/VerifyEmailClient";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolved = await searchParams;
  const token = resolved.token || "";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 md:py-16 flex items-center justify-center">
      <VerifyEmailClient token={token} />
    </main>
  );
}
