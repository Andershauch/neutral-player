import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import DeleteUserButton from "./DeleteUserButton";
import RoleSelector from "./RoleSelector";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest border border-red-100">
          Ingen adgang
        </div>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">
            Brugere
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Administrer hvem der har adgang til systemet.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Bruger</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Email</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Rolle & Adgang</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Handling</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.image ? (
                        <Image
                          className="h-9 w-9 rounded-full mr-3 border border-gray-100 object-cover"
                          src={user.image}
                          alt=""
                          width={36}
                          height={36}
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full mr-3 bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-black border border-blue-100">
                          {user.name?.[0] || "U"}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-gray-900">{user.name || "Navn mangler"}</div>
                        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">ID: {user.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{user.email}</td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="min-w-[160px]">
                      <RoleSelector
                        userId={user.id}
                        currentRole={user.role}
                        currentUserEmail={session?.user?.email}
                        targetUserEmail={user.email}
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-[10px]">
                    {user.email !== session?.user?.email ? (
                      <DeleteUserButton userId={user.id} userName={user.name || user.email} />
                    ) : (
                      <span className="font-black uppercase text-blue-600 bg-blue-50 px-4 py-2 rounded-full tracking-widest">
                        Dig selv
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
