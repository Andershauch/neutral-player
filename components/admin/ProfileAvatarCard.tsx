"use client";

import { ChangeEvent, useRef, useState, useTransition } from "react";

type Props = {
  initialName: string;
  initialImage: string | null;
};

const MAX_INPUT_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_DATA_URL_LENGTH = 220_000;
const AVATAR_SIZE = 256;

async function compressToAvatarDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not decode image"));
      image.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas unavailable");
    }

    const sourceWidth = img.naturalWidth || img.width;
    const sourceHeight = img.naturalHeight || img.height;
    const side = Math.min(sourceWidth, sourceHeight);
    const sourceX = Math.floor((sourceWidth - side) / 2);
    const sourceY = Math.floor((sourceHeight - side) / 2);

    context.drawImage(img, sourceX, sourceY, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

    let quality = 0.86;
    let output = canvas.toDataURL("image/webp", quality);
    while (output.length > MAX_OUTPUT_DATA_URL_LENGTH && quality > 0.46) {
      quality -= 0.08;
      output = canvas.toDataURL("image/webp", quality);
    }

    if (output.length > MAX_OUTPUT_DATA_URL_LENGTH) {
      output = canvas.toDataURL("image/jpeg", 0.72);
    }

    if (output.length > MAX_OUTPUT_DATA_URL_LENGTH) {
      throw new Error("Compressed image too large");
    }

    return output;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function ProfileAvatarCard({ initialName, initialImage }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [image, setImage] = useState<string | null>(initialImage);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const firstLetter = (initialName || "B").trim().charAt(0).toUpperCase();

  const saveImage = (nextImage: string | null) => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/profile/avatar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: nextImage }),
        });
        const data = (await res.json()) as { error?: string; image?: string | null };
        if (!res.ok) {
          setError(data.error || "Kunne ikke opdatere profilbillede.");
          return;
        }

        setImage(typeof data.image === "string" ? data.image : null);
        setMessage(nextImage ? "Profilbillede opdateret." : "Profilbillede fjernet.");
        window.dispatchEvent(new CustomEvent("np:avatar-updated", { detail: { image: data.image ?? null } }));
      } catch {
        setError("Der opstod en fejl. Prøv igen.");
      }
    });
  };

  const onChooseFile = () => {
    inputRef.current?.click();
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setMessage(null);

    if (!file.type.startsWith("image/")) {
      setError("Filen skal være et billede.");
      return;
    }

    if (file.size > MAX_INPUT_UPLOAD_BYTES) {
      setError("Billedet er for stort. Maks 5 MB.");
      return;
    }

    startTransition(async () => {
      try {
        const compressedDataUrl = await compressToAvatarDataUrl(file);
        saveImage(compressedDataUrl);
      } catch {
        setError("Kunne ikke komprimere billedet. Prøv et andet.");
      }
    });
  };

  return (
    <section className="np-card p-5 md:p-6">
      <p className="np-kicker text-blue-600">Profilbillede</p>
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="h-16 w-16 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden">
          {image ? (
            <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${image}")` }} aria-label="Profilbillede" />
          ) : (
            <span className="text-lg font-black text-gray-600">{firstLetter}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          <button type="button" onClick={onChooseFile} disabled={isPending} className="np-btn-primary px-4 py-3 disabled:opacity-50">
            Vælg billede
          </button>
          <button
            type="button"
            onClick={() => saveImage(null)}
            disabled={isPending || !image}
            className="np-btn-ghost px-4 py-3 disabled:opacity-50"
          >
            Fjern billede
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">Google- og Microsoft-billede synkroniseres automatisk ved social login.</p>
      {error ? <p className="mt-2 text-xs font-bold text-red-600">{error}</p> : null}
      {message ? <p className="mt-2 text-xs font-bold text-green-600">{message}</p> : null}
    </section>
  );
}
