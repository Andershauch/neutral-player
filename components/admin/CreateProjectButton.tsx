"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const CreateProjectModal = dynamic(() => import("./CreateProjectModal"), {
  ssr: false,
  loading: () => null,
});

export default function CreateProjectButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto bg-blue-600 text-white px-6 md:px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <span className="text-lg leading-none">+</span> Nyt projekt
      </button>

      {isOpen && <CreateProjectModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
