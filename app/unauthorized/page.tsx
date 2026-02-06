import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-gray-200">
        <div className="text-5xl mb-4">⛔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ingen Adgang</h1>
        <p className="text-gray-600 mb-6">
          Du er logget ind, men din bruger har ikke administrator-rettigheder.
        </p>
        
        <div className="flex flex-col gap-3">
            <Link 
                href="/" 
                className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
                Gå til forsiden
            </Link>
            
            {/* Dette link logger brugeren ud ved at sende dem til signout siden */}
            <Link 
                href="/api/auth/signout" 
                className="text-gray-500 text-sm hover:underline mt-2"
            >
                Log ud
            </Link>
        </div>
      </div>
    </div>
  );
}