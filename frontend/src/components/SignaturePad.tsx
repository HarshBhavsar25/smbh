"use client";

import React, { useRef, useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

interface SignaturePadProps {
  onChange: (base64: string | null) => void;
  value?: string | null;
  placeholder?: string;
}

export default function SignaturePad({ onChange, value, placeholder = "Draw your signature here..." }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Clear signature
  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 200; // Fixed visual height
      
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

    // Draw existing signature if provided as base64/url
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
  }, [value]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
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

    // Trigger change callback with base64 data
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  return (
    <div className="w-full">
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
            onClick={clear}
            className="absolute bottom-3 right-3 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold border border-red-500/10"
            title="Clear signature"
          >
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
