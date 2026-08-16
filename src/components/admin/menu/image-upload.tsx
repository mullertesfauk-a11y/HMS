"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "@uploadthing/react";
import {
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
} from "uploadthing/client";
import { ImagePlus, Loader2, X } from "lucide-react";

import { useUploadThing } from "@/lib/uploadthing";

export function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload, routeConfig } = useUploadThing("menuImage", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url) {
        onChange(res[0].url);
      }
      setIsUploading(false);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      setIsUploading(false);
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setIsUploading(true);
      await startUpload(acceptedFiles);
    },
    [startUpload],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(
      generatePermittedFileTypes(routeConfig).fileTypes,
    ),
    maxFiles: 1,
    disabled: isUploading,
  });

  if (value) {
    return (
      <div className="relative">
        <p className="mb-1.5 text-sm font-medium text-stone-700">Image</p>
        <div className="relative overflow-hidden rounded-lg border border-stone-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Menu item preview"
            className="h-32 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-stone-500 shadow-sm transition-colors hover:bg-white hover:text-red-600"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-stone-700">Image</p>
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-center transition-colors hover:border-stone-400 hover:bg-stone-100 ${
          isUploading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
        ) : (
          <ImagePlus className="h-6 w-6 text-stone-400" />
        )}
        <p className="text-xs text-stone-500">
          {isUploading
            ? "Uploading…"
            : "Drop an image here or click to browse"}
        </p>
        <p className="text-[10px] text-stone-400">PNG, JPG up to 4MB</p>
      </div>
    </div>
  );
}
