import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteUserButton from "./DeleteUserButton";
import RoleSelector from "./RoleSelector"; // <--- HUSK DENNE IMPORT

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  if ((session?.user as any)?.role !== "admin") {
     return <div className="p-10">Ingen adgang</div>;
  }

  const users = await prisma.user.findMany({
    orderBy: { email: 'asc' }
  });

  return (
    <div className="max-w-6xl mx-auto"> {/* Gjort lidt bredere */}
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Bruger Administration</h1>
            <p className="text-gray-500 mt-1">Administrer hvem der har adgang til systemet</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bruger</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle & Adgang</th>
              <th className="px-6 py-3 text-right">Handling</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex items-center">
                     {user.image ? (
                        <img className="h-10 w-10 rounded-full mr-3 border border-gray-200" src={user.image} alt="" />
                     ) : (
                        <div className="h-10 w-10 rounded-full mr-3 bg-gray-200 flex items-center justify-center text-gray-500 font-bold">{user.name?.[0]}</div>
                     )}
                     <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</div>
                     </div>
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                
                {/* HER ER DEN NYE DROP DOWN */}
                <td className="px-6 py-4 whitespace-nowrap w-48">
                    <RoleSelector 
                        userId={user.id} 
                        currentRole={user.role} 
                        currentUserEmail={session?.user?.email}
                        targetUserEmail={user.email}
                    />
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user.email !== session?.user?.email && (
                     <DeleteUserButton userId={user.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}