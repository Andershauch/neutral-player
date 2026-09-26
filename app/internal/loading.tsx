/// Samme begrundelse som app/admin/loading.tsx — uden en loading-fil viser
/// Next.js ingenting under navigation mellem interne sider.
export default function InternalLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-20 rounded-full bg-gray-100" />
        <div className="h-7 w-56 rounded-xl bg-gray-100" />
      </div>
      <div className="np-card p-5 md:p-6 space-y-3">
        <div className="h-4 w-1/3 rounded-full bg-gray-100" />
        <div className="h-4 w-2/3 rounded-full bg-gray-100" />
        <div className="h-4 w-1/2 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}
