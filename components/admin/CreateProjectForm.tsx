"use client";

import { createEmbed } from "@/app/actions/create-embed";
import { useRef, useState } from "react";

export default function CreateProjectForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, setIsPending] = useState(false);

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] mb-10 border border-gray-100 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Opret nyt projekt</h2>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">
          Tilføj en ny video-container til dit dashboard
        </p>
      </div>
      
      <form 
        action={async (formData) => {
          setIsPending(true);
          try {
            await createEmbed(formData);
            formRef.current?.reset(); 
          } catch (error) {
            console.error("Fejl ved oprettelse:", error);
          } finally {
            setIsPending(false);
          }
        }} 
        ref={formRef}
        className="flex flex-col sm:flex-row gap-4 items-end"
      >
        <div className="w-full sm:flex-1">
          <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2 tracking-widest">
            Navn på projekt
          </label>
          <input 
            type="text" 
            name="name" 
            placeholder="Fx: Onboarding Videoer 2026"
            className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-bold text-sm transition-all placeholder:text-gray-300"
            required 
            disabled={isPending}
          />
        </div>
        
        <button 
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-100 active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? "Opretter..." : "Opret Projekt +"}
        </button>
      </form>
    </div>
  );
}