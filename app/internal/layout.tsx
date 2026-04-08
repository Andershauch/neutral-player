import { redirect } from "next/navigation";
import { getInternalAdminContext } from "@/lib/internal-auth";
import InternalNav from "@/components/internal/InternalNav";

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const internalCtx = await getInternalAdminContext();
  if (!internalCtx) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <InternalNav />
        {children}
      </div>
    </div>
  );
}
