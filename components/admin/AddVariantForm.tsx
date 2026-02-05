"use client";

import { useState } from "react";
import { createVariant } from "@/actions/create-variant";
import VideoUploader from "@/components/admin/MuxUploader";
import { useRouter } from "next/navigation";

export default function AddVariantForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [lang, setLang] = useState("da");
  const [muxUploadId, setMuxUploadId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    // Gem i databasen via Server Action
    await createVariant(groupId, lang, muxUploadId);
    
    setIsSaving(false);
    setMuxUploadId(""); // Nulstil formular
    router.refresh();   // Opdater siden så den nye video vises
  }

  return (
    <div className="mt-4 p-4 bg-gray-900 rounded border border-gray-700">
      <h4 className="text-sm font-bold text-gray-300 mb-3">Upload ny version</h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Vælg Sprog */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Sprog</label>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 text-sm"
          >
            <option value="da">Dansk 🇩🇰</option>
            <option value="en">Engelsk 🇬🇧</option>
            <option value="de">Tysk 🇩🇪</option>
            <option value="sv">Svensk 🇸🇪</option>
            <option value="no">Norsk 🇳🇴</option>
          </select>
        </div>

        {/* 2. Upload Video */}
        {!muxUploadId ? (
          <VideoUploader onUploadSuccess={(id) => setMuxUploadId(id)} />
        ) : (
          <div className="p-3 bg-green-900/30 border border-green-600 rounded text-green-400 text-sm flex justify-between items-center">
            <span>✅ Video klar til at gemme</span>
            <button 
              type="button" 
              onClick={() => setMuxUploadId("")}
              className="text-xs underline hover:text-white"
            >
              Slet
            </button>
          </div>
        )}

        {/* 3. Gem Knap */}
        <button
          type="submit"
          disabled={!muxUploadId || isSaving}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded text-sm font-bold transition-colors"
        >
          {isSaving ? "Gemmer..." : "Gem Video"}
        </button>
      </form>
    </div>
  );
}