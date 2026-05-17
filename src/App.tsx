import React, { useEffect, useState, useMemo } from 'react';
import Game from './Game';

// --- Constants (Matching Game.tsx for consistency) ---
const FRUIT_LEVELS = [
  { level: 0, url: './assets/fruit_0.png' },
  { level: 1, url: './assets/fruit_1.png' },
  { level: 2, url: './assets/fruit_2.png' },
  { level: 3, url: './assets/fruit_3.png' },
  { level: 4, url: './assets/fruit_4.png' },
  { level: 5, url: './assets/fruit_5.png' },
  { level: 6, url: './assets/fruit_6.png' },
  { level: 7, url: './assets/fruit_7.png' },
  { level: 8, url: './assets/fruit_8.png' },
  { level: 9, url: './assets/fruit_9.png' },
  { level: 10, url: './assets/fruit_10.png' },
  { level: 11, url: './assets/fruit_11.png' },
];

export default function App() {
  const [loadedTextures, setLoadedTextures] = useState<Record<number, HTMLCanvasElement> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllTextures() {
      try {
        const texturePromises = FRUIT_LEVELS.map((fruit) => {
          return new Promise<[number, HTMLCanvasElement]>((resolve, reject) => {
            const img = new Image();
            img.src = fruit.url;
            img.onload = () => {
              // Create a canvas to hold the texture as requested by Game.tsx type signature
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve([fruit.level, canvas]);
              } else {
                reject(new Error(`Could not get context for fruit ${fruit.level}`));
              }
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${fruit.url}`));
          });
        });

        const results = await Promise.all(texturePromises);
        const textureMap: Record<number, HTMLCanvasElement> = {};
        results.forEach(([level, canvas]) => {
          textureMap[level] = canvas;
        });

        setLoadedTextures(textureMap);
      } catch (error) {
        console.error("Error loading textures:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAllTextures();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center bg-[#fdfaf3]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#ff6b6b] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium animate-pulse">Caricamento...</span>
        </div>
      </div>
    );
  }

  if (!loadedTextures) {
    return (
      <div className="w-full h-[100dvh] flex items-center justify-center bg-[#fdfaf3]">
        <span className="text-red-500">Erro nel caricamento delle risorse.</span>
      </div>
    );
  }

  return <Game loadedTextures={loadedTextures} />;
}