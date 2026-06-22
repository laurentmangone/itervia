import { useRef, useEffect } from 'react';
import { ElevationPoint } from '../types';

interface ElevationProfileProps {
  data: ElevationPoint[];
  height?: number;
}

export function ElevationProfile({ data, height = 150 }: ElevationProfileProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const distances = data.map((p) => p.distance);
    const elevations = data.map((p) => p.elevation);
    const minElev = Math.min(...elevations);
    const maxElev = Math.max(...elevations);
    const elevRange = maxElev - minElev || 1;
    const distRange = distances[distances.length - 1] - distances[0] || 1;

    const padding = { top: 10, right: 10, bottom: 20, left: 40 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + plotHeight);
    data.forEach((point, i) => {
      const x = padding.left + ((point.distance - distances[0]) / distRange) * plotWidth;
      const y = padding.top + plotHeight - ((point.elevation - minElev) / elevRange) * plotHeight;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotHeight);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((point, i) => {
      const x = padding.left + ((point.distance - distances[0]) / distRange) * plotWidth;
      const y = padding.top + plotHeight - ((point.elevation - minElev) / elevRange) * plotHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const elev = minElev + (elevRange * i) / 4;
      const y = padding.top + plotHeight - (i / 4) * plotHeight;
      ctx.fillText(`${Math.round(elev)}m`, padding.left - 5, y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= 4; i++) {
      const dist = distances[0] + (distRange * i) / 4;
      const x = padding.left + (i / 4) * plotWidth;
      ctx.fillText(`${(dist / 1000).toFixed(1)}km`, x, padding.top + plotHeight + 5);
    }
  }, [data, height]);

  if (data.length < 2) {
    return (
      <div className="elevation-profile empty" style={{ height }}>
        <p>Profil altimétrique non disponible</p>
      </div>
    );
  }

  return (
    <div className="elevation-profile" style={{ height }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}