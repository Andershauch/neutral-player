import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  // RETTELSE: Tillad både admin og contributor
  if (role !== "admin" && role !== "contributor") {
    redirect("/unauthorized");
  }

  const user = session?.user;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="text-xl font-bold tracking-tight">
            VIDEO CMS <span className="text-blue-600">PRO</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLink href="/admin/dashboard" icon="📹">Projekter</NavLink>
          
          {/* KUN VIS BRUGERE FOR ADMINS */}
          {role === "admin" && (
            <NavLink href="/admin/users" icon="👥">Brugere</NavLink>
          )}
        </nav>

        {/* BRUGER BUND MENU */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            {user?.image ? (
              <Image 
                src={user.image} 
                alt="User" 
                width={32} 
                height={32} 
                className="rounded-full border border-gray-200" 
              />
            ) : (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {user?.name?.[0]}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{role}</p>
            </div>
          </div>
          <Link 
            href="/api/auth/signout" 
            className="block w-full text-center text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 py-2 rounded-md transition-colors"
          >
            Log ud
          </Link>
        </div>
      </aside>

      {/* HOVED INDHOLD */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon, children }: any) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-black transition-colors"
    >
      <span>{icon}</span>
      {children}
    </Link>
  )
}