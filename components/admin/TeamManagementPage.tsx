import { prisma } from "@/lib/prisma";
import Image from "next/image";
import DeleteUserButton from "@/app/admin/users/DeleteUserButton";
import RoleSelector from "@/app/admin/users/RoleSelector";
import { getOrgContextForMemberManagement } from "@/lib/authz";
import AddMemberForm from "@/app/admin/users/AddMemberForm";
import InviteActions from "@/app/admin/users/InviteActions";

export default async function TeamManagementPage() {
  const orgCtx = await getOrgContextForMemberManagement();
  if (!orgCtx) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-xs font-bold uppercase tracking-widest text-red-600">
          Ingen adgang
        </div>
      </div>
    );
  }

  const memberships = await prisma.organizationUser.findMany({
    where: { organizationId: orgCtx.orgId },
    orderBy: { createdAt: "asc" },
    include: {
      user: true,
    },
  });

  const pendingInvites = await prisma.invite.findMany({
    where: {
      organizationId: orgCtx.orgId,
      acceptedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  const currentUserEmail = memberships.find((m) => m.userId === orgCtx.userId)?.user.email;
  const canAssignOwner = orgCtx.role === "owner";

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="np-card np-card-pad bg-gradient-to-br from-white via-white to-blue-50/30">
        <p className="np-kicker text-blue-600">Team administration</p>
        <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Team</h1>
        <p className="text-sm text-gray-500 mt-1">Administrer medlemmer, roller og invitationer.</p>
      </section>

      <AddMemberForm canAssignOwner={canAssignOwner} />

      <section className="np-card overflow-hidden">
        <div className="px-5 py-4 md:px-6 md:py-5 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Afventende invitationer</h2>
          <p className="text-xs text-gray-500 mt-1">
            Brug Gensend hvis mailen ikke er modtaget, eller Annuller hvis invitationen ikke skal bruges.
          </p>
        </div>

        {pendingInvites.length === 0 ? (
          <div className="px-6 py-8 text-xs font-semibold text-gray-500">Ingen aktive invitationer.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Email</th>
                  <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Rolle</th>
                  <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Udløber</th>
                  <th className="px-4 md:px-6 py-4 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Handling</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {pendingInvites.map((invite) => {
                  const isExpired = invite.expiresAt < new Date();
                  return (
                    <tr key={invite.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{invite.email}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs font-bold uppercase text-gray-600">{invite.role}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-500">
                        {new Intl.DateTimeFormat("da-DK", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(invite.expiresAt)}
                        {isExpired ? (
                          <span className="ml-2 px-2 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest">
                            Udlobet
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                        <InviteActions inviteId={invite.id} inviteEmail={invite.email} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="np-card overflow-hidden">
        <div className="px-5 py-4 md:px-6 md:py-5 border-b border-gray-100 bg-white">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Medlemmer</h2>
          <p className="text-xs text-gray-500 mt-1">Roller og adgangsniveau for nuværende team.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Bruger</th>
                <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Email</th>
                <th className="px-4 md:px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Rolle og adgang</th>
                <th className="px-4 md:px-6 py-4 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Handling</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {memberships.map((membership) => (
                <tr key={membership.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {membership.user.image ? (
                        <Image
                          className="h-9 w-9 rounded-full mr-3 border border-gray-100 object-cover"
                          src={membership.user.image}
                          alt=""
                          width={36}
                          height={36}
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full mr-3 bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-black border border-blue-100">
                          {membership.user.name?.[0] || "U"}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-gray-900">{membership.user.name || "Navn mangler"}</div>
                        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">ID: {membership.user.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{membership.user.email}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="min-w-[160px]">
                      <RoleSelector
                        userId={membership.userId}
                        currentRole={membership.role}
                        currentUserEmail={currentUserEmail}
                        targetUserEmail={membership.user.email}
                        canAssignOwner={canAssignOwner}
                      />
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-[10px]">
                    {membership.user.id !== orgCtx.userId ? (
                      <DeleteUserButton userId={membership.user.id} userName={membership.user.name || membership.user.email} />
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
      </section>
    </div>
  );
}
