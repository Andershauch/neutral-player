"use client";

import { createEmbed } from "@/app/actions/create-embed";
import { useRef } from "react";

export default function CreateProjectForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-8 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4">Opret nyt projekt</h2>
      
      <form 
        action={async (formData) => {
          // Vi pakker kaldet ind her for at gøre TypeScript glad
          // og for at kunne nulstille formularen efter oprettelse
          await createEmbed(formData);
          formRef.current?.reset(); 
        }} 
        ref={formRef}
        className="flex gap-4 items-end"
      >
        <div className="flex-1">
          <label className="block text-sm text-gray-400 mb-1">Navn på projekt</label>
          <input 
            type="text" 
            name="name" 
            placeholder="Fx: Onboarding Videoer 2024"
            className="w-full p-2 rounded bg-gray-900 border border-gray-600 focus:border-blue-500 outline-none text-white"
            required 
          />
        </div>
        <button 
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition-colors"
        >
          Opret +
        </button>
      </form>
    </div>
  );
}