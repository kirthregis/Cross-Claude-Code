"use client";

import { useEffect, useRef } from "react";

export function Waveform({
  peaks,
  progress,
  height = 72,
  onSeek,
  accent = "#e879f9",
  className = "",
}: {
  peaks: Float32Array;
  progress?: number; // 0..1
  height?: number;
  onSeek?: (frac: number) => void;
  accent?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress ?? 0);
  progressRef.current = progress ?? 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const n = peaks.length;
    if (n === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, 0, w, h);
      return;
    }
    const mid = h / 2;
    const barW = Math.max(1, w / n);

    const prog = Math.max(0, Math.min(1, progressRef.current));
    const progX = prog * w;

    for (let i = 0; i < n; i++) {
      const amp = Math.max(0.015, Math.min(1, peaks[i]));
      const x = i * barW;
      const barH = Math.max(1.5, amp * (h - 8));
      const done = x <= progX;
      ctx.fillStyle = done ? accent : "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.roundRect(x + 0.5, mid - barH / 2, Math.max(1, barW - 1), barH, 1.5);
      ctx.fill();
    }

    // progress line
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(progX, 0);
    ctx.lineTo(progX, h);
    ctx.stroke();
  }, [peaks, height, accent]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height }}
      className={`w-full cursor-pointer ${className}`}
      onClick={(e) => {
        if (!onSeek) return;
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
      }}
    />
  );
}
