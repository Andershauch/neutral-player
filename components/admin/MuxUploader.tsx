import { useRef } from "react";
import MuxUploader from "@mux/mux-uploader-react";

interface Props {
  onUploadSuccess: (uploadId: string) => void;
}

export default function VideoUploader({ onUploadSuccess }: Props) {
  // Vi bruger en 'ref' til at huske ID'et midlertidigt
  const uploadIdRef = useRef<string | null>(null);

  return (
    <MuxUploader
      // Her er rettelsen: Funktionen returnerer nu KUN url-strengen (Promise<string>)
      endpoint={async () => {
        // 1. Vi beder vores API om en upload-billet
        const response = await fetch("/api/mux-upload", {
          method: "POST",
        });
        
        const data = await response.json();
        
        // 2. Vi gemmer ID'et i vores 'ref', så vi har det til senere
        if (data.id) {
          uploadIdRef.current = data.id;
        }

        // 3. Vi returnerer KUN url'en til Mux-knappen, så TypeScript er glad
        return data.url; 
      }}

      onSuccess={() => {
        console.log("Upload succes! ID:", uploadIdRef.current);
        
        // Nu henter vi ID'et fra vores 'ref' og sender det videre
        if (uploadIdRef.current) {
          onUploadSuccess(uploadIdRef.current);
        }
      }}
      
      className="mux-uploader"
    />
  );
}