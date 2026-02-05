import AdminNav from "@/components/admin/AdminNav";
import EmbedList from "@/components/admin/EmbedList";

export const metadata = {
  title: "Admin Dashboard | EmbedManager",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Dashboard
              </h2>
            </div>
          </div>

          {/* List Component */}
          <EmbedList />
          
        </div>
      </main>
    </div>
  );
}