"use client";

import React, { useRef, useState, useEffect } from "react";
import { Trash2, PenLine, Upload, CheckCircle2 } from "lucide-react";

interface SignaturePadProps {
  onChange: (base64: string | null) => void;
  value?: string | null;
  placeholder?: string;
  uploadEndpoint?: string; // Optional: API endpoint to upload image file to get URL
}

type SignatureMode = "draw" | "upload";

export default function SignaturePad({
  onChange,
  value,
  placeholder = "Draw your signature here...",
  uploadEndpoint,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [mode, setMode] = useState<SignatureMode>("draw");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Initialize mode based on existing value
  useEffect(() => {
    if (value && !value.startsWith("data:image")) {
      // It's a URL (uploaded image), show upload mode
      setMode("upload");
      setUploadedImageUrl(value);
    }
  }, []);

  // Clear drawn signature
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange(null);
  };

  const clearAll = () => {
    clearCanvas();
    setUploadedImageUrl(null);
    setUploadError(null);
    onChange(null);
  };

  useEffect(() => {
    if (mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 200;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Restore drawn signature if it's base64
    if (value && value.startsWith("data:image")) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setIsEmpty(false);
        }
      };
      img.src = value;
    }

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [mode, value]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.releasePointerCapture(e.pointerId);
    setIsDrawing(false);
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      if (uploadEndpoint) {
        // Upload to server and get back URL
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(uploadEndpoint, { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const result = await res.json();
        const url: string = result.url;
        setUploadedImageUrl(url);
        onChange(url);
      } else {
        // Fallback: use base64 data URL locally
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          setUploadedImageUrl(dataUrl);
          onChange(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      setUploadError("Failed to upload signature image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const switchMode = (newMode: SignatureMode) => {
    if (newMode === mode) return;
    clearAll();
    setMode(newMode);
  };

  return (
    <div className="w-full space-y-2">
      {/* Mode Toggle */}
      <div className="flex gap-1 bg-[#0f0f12] border border-white/5 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => switchMode("draw")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === "draw"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <PenLine size={13} /> Draw
        </button>
        <button
          type="button"
          onClick={() => switchMode("upload")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mode === "upload"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Upload size={13} /> Upload Image
        </button>
      </div>

      {/* Draw Mode */}
      {mode === "draw" && (
        <div className="relative w-full h-[200px] bg-[#16161a] border border-white/10 rounded-2xl overflow-hidden cursor-crosshair">
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm pointer-events-none select-none">
              {placeholder}
            </div>
          )}
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            className="w-full h-full block touch-none"
          />
          {!isEmpty && (
            <button
              type="button"
              onClick={clearCanvas}
              className="absolute bottom-3 right-3 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold border border-red-500/10"
              title="Clear signature"
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      )}

      {/* Upload Mode */}
      {mode === "upload" && (
        <div className="w-full">
          {uploadedImageUrl ? (
            <div className="relative w-full h-[200px] bg-[#16161a] border border-emerald-500/30 rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3">
              <img
                src={uploadedImageUrl}
                alt="Uploaded Signature"
                className="max-h-[160px] max-w-full object-contain rounded-lg"
              />
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg px-2 py-1 text-xs font-semibold">
                <CheckCircle2 size={12} /> Uploaded
              </div>
              <button
                type="button"
                onClick={clearAll}
                className="absolute bottom-3 right-3 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold border border-red-500/10"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          ) : (
            <label
              htmlFor={`sig-upload-${placeholder?.slice(0, 8).replace(/\s/g, "")}`}
              className={`flex flex-col items-center justify-center w-full h-[200px] bg-[#16161a] border-2 border-dashed rounded-2xl cursor-pointer transition-all gap-3 ${
                isUploading
                  ? "border-primary/40 bg-primary/5"
                  : "border-white/10 hover:border-primary/40 hover:bg-white/[0.02]"
              }`}
            >
              {isUploading ? (
                <>
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground">
                    <Upload size={22} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Click to upload signature image</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP up to 5MB</p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                id={`sig-upload-${placeholder?.slice(0, 8).replace(/\s/g, "")}`}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          )}
          {uploadError && (
            <p className="text-xs text-red-400 mt-2">{uploadError}</p>
          )}
        </div>
      )}
    </div>
  );
}
