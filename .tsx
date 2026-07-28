import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Image as ImageIcon, Sliders, Palette } from 'lucide-react';

// Verdiğin 30 Renklik Özel Palet
const PALETTE_HEX = [
  "#FFFFFF", "#593D29",
  "#E3E4E5", "#F7E1B5",
  "#CCCCCC", "#FFFF80",
  "#7F7F7F", "#E5D900",
  "#4C4C4C", "#8CE63A",
  "#000000", "#00CD00",
  "#FFA0A0", "#5C7835",
  "#FF80C0", "#006B1F",
  "#FF3399", "#CCE5FF",
  "#FF5555", "#00CCE5",
  "#FF0000", "#0080D0",
  "#800000", "#0000FF",
  "#FF9955", "#101B7A",
  "#E59000", "#CD78EA",
  "#9A643E", "#800080"
];

// HEX -> RGB Dönüştürücü
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

const PALETTE_RGB = PALETTE_HEX.map(hexToRgb);

// İnsan gözünün renk algısına uygun weighted Öklid uzaklığı hesabı
function getNearestColor(r: number, g: number, b: number): [number, number, number] {
  let minDistance = Infinity;
  let nearest = PALETTE_RGB[0];

  for (let i = 0; i < PALETTE_RGB.length; i++) {
    const [pr, pg, pb] = PALETTE_RGB[i];
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const distance = dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114;

    if (distance < minDistance) {
      minDistance = distance;
      nearest = PALETTE_RGB[i];
    }
  }

  return nearest;
}

export default function PixelArtConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [pixelSize, setPixelSize] = useState<number>(8);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pikselleştirme motoru
  const processPixelArt = useCallback(() => {
    if (!imageSrc || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const w = img.width;
      const h = img.height;
      setOriginalDimensions({ width: w, height: h });

      canvas.width = w;
      canvas.height = h;

      const pSize = Math.max(1, pixelSize);
      const scaledW = Math.ceil(w / pSize);
      const scaledH = Math.ceil(h / pSize);

      const offCanvas = document.createElement('canvas');
      offCanvas.width = scaledW;
      offCanvas.height = scaledH;
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.imageSmoothingEnabled = false;
      offCtx.drawImage(img, 0, 0, scaledW, scaledH);

      const imgData = offCtx.getImageData(0, 0, scaledW, scaledH);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) continue;

        const [nr, ng, nb] = getNearestColor(r, g, b);
        data[i] = nr;
        data[i + 1] = ng;
        data[i + 2] = nb;
      }

      offCtx.putImageData(imgData, 0, 0);

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(offCanvas, 0, 0, scaledW, scaledH, 0, 0, w, h);
    };
  }, [imageSrc, pixelSize]);

  useEffect(() => {
    processPixelArt();
  }, [processPixelArt]);

  // Sürükle - Bırak İşlemleri
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImageSrc(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'pixel-art-30renk.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Başlık */}
        <header className="text-center space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-sm font-semibold border border-indigo-500/20">
            <Palette className="w-4 h-4" /> 30 Renkli Özel Palet Dönüştürücü
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Piksel Sanatı Oluşturucu
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            PNG, JPG, WEBP fark etmeksizin tüm resimleri sürükleyip bırakarak özel 30 renk paletiyle piksellere dönüştürün.
          </p>
        </header>

        {/* 30 Renkli Palet Gösterimi */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 shadow-xl">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-indigo-400" /> Aktif Renk Paleti (30 Renk)
          </h2>
          <div className="grid grid-cols-10 md:grid-cols-15 gap-1.5">
            {PALETTE_HEX.map((hex, idx) => (
              <div 
                key={idx} 
                className="group relative h-7 rounded border border-slate-700/50 transition-transform hover:scale-110 cursor-pointer shadow-sm"
                style={{ backgroundColor: hex }}
                title={`Renk #${idx + 1}: ${hex}`}
              >
                <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none z-10 whitespace-nowrap border border-slate-700">
                  {hex}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* İçerik */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Kontrol Paneli */}
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6 shadow-xl h-fit">
            <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-300 border-b border-slate-800 pb-3">
              <Sliders className="w-5 h-5 text-indigo-400" /> Kalite & Piksel Ayarı
            </h2>

            {/* Kalite / Piksel Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <label className="text-slate-300">Piksel Boyutu (Detay Derecesi)</label>
                <span className="text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-md text-xs border border-indigo-800 font-mono">
                  {pixelSize}px {pixelSize <= 3 ? '(Detaylı / Kaliteli)' : pixelSize >= 16 ? '(Retro / Büyük Piksel)' : '(Orta)'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="32"
                step="1"
                value={pixelSize}
                onChange={(e) => setPixelSize(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>1px (Yüksek Detay)</span>
                <span>32px (Düşük Detay)</span>
              </div>
            </div>

            {/* Hızlı Butonlar */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Hızlı Ayarlar</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Detaylı', size: 3 },
                  { label: 'Dengeli', size: 8 },
                  { label: 'Retro', size: 16 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setPixelSize(preset.size)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      pixelSize === preset.size
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset.label} ({preset.size}px)
                  </button>
                ))}
              </div>
            </div>

            {/* Yükleme ve İndirme */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 font-medium transition-all text-sm"
              >
                <Upload className="w-4 h-4 text-indigo-400" /> Resim Seç / Değiştir
              </button>

              {imageSrc && (
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 transition-all text-sm"
                >
                  <Download className="w-4 h-4" /> Piksel Resmini İndir (PNG)
                </button>
              )}
            </div>
          </div>

          {/* Sürükle-Bırak ve Canlı Canvas Alanı */}
          <div className="lg:col-span-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {!imageSrc ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`h-[420px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 cursor-pointer p-8 text-center ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-indigo-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-200">
                    Sürükleyip Buraya Bırakın
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    veya dosya seçmek için tıklayın (PNG, JPG, WEBP, GIF, vb.)
                  </p>
                </div>
              </div>
            ) : (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 px-2">
                  <div className="text-xs text-slate-400 font-mono">
                    {originalDimensions && (
                      <span>Çözünürlük: {originalDimensions.width}x{originalDimensions.height}px</span>
                    )}
                  </div>
                  <span className="text-xs text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900">
                    Canlı Piksel Önizleme
                  </span>
                </div>

                <div className="relative overflow-auto max-h-[600px] flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800/80 p-2 min-h-[300px]">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-[550px] object-contain rounded shadow-lg"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

