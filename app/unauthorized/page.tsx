import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="np-default-theme np-form-shell flex-col">
      <div className="np-form-card text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
          <span className="text-3xl font-black text-red-600" aria-hidden>
            !
          </span>
        </div>

        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">Ingen adgang</h1>

        <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">
          Du er logget ind, men din profil mangler de nødvendige{" "}
          <span className="text-red-500 font-bold">administratorrettigheder</span> for at se denne side.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="np-btn-primary px-6 py-4 shadow-lg shadow-blue-100 active:scale-[0.98]"
          >
            Gå til forsiden
          </Link>

          <Link
            href="/api/auth/signout"
            className="np-link-quiet text-[10px] font-black uppercase tracking-widest pt-2"
          >
            Log ud og prøv igen
          </Link>
        </div>
      </div>

      <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
        Neutral<span className="text-blue-400">.</span> Player
      </p>
    </div>
  );
}
