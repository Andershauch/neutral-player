"use client";

import MuxUploader from "@mux/mux-uploader-react";

interface MuxUploaderProps {
  onUploadSuccess: (uploadId: string) => void;
}

export default function VideoUploader({ onUploadSuccess }: MuxUploaderProps) {
  return (
    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 bg-gray-900 text-center">
      <p className="text-gray-400 mb-4 text-sm">
        Træk din videofil herind, eller klik for at vælge
      </p>
      
      <MuxUploader
        endpoint="/api/upload"
        // Vi skriver ": any" herunder for at få TypeScript til at tie stille
        onSuccess={(event: any) => {
          console.log("Upload færdig!", event);
          
          // Nu brokker den sig ikke længere, fordi vi har sagt det er 'any'
          if (event.detail && event.detail.id) {
            onUploadSuccess(event.detail.id);
          }
        }}
        className="w-full"
      />
    </div>
  );
}