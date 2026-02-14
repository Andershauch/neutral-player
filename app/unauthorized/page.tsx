import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl shadow-blue-900/5 max-w-sm w-full text-center border border-gray-100">
        
        {/* Ikon / Illustration */}
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
          <span className="text-3xl">🚫</span>
        </div>

        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">
          Ingen Adgang
        </h1>
        
        <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">
          Du er logget ind, men din profil mangler de nødvendige <span className="text-red-500 font-bold">administrator-rettigheder</span> for at se denne side.
        </p>
        
        <div className="flex flex-col gap-4">
          <Link 
            href="/" 
            className="bg-blue-600 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-[0.98]"
          >
            Gå til forsiden
          </Link>
          
          <Link 
            href="/api/auth/signout" 
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors pt-2"
          >
            Log ud og prøv igen
          </Link>
        </div>
      </div>
      
      {/* Lille branding i bunden */}
      <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
        Neutral<span className="text-blue-400">.</span> Player
      </p>
    </div>
  );
}