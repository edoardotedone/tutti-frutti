import React, { useEffect, useState } from 'react';
import Game from './Game';
import { FRUIT_LEVELS } from './constants';

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
            // Instead of rejecting on error (which would fail the whole Promise.all), 
            // we resolve with null or just don't include it if we want to handle missing textures gracefully in App.tsx
            // But since we want textureMap[level] to exist or be handled, let's resolve with a flag or just catch error per promise.
            img.onerror = () => {
              console.warn(`Failed to load image: ${fruit.url}. Texture will be missing for level ${fruit.level}`);
              // Resolve with an empty canvas or something that indicates failure if we want to keep the array length consistent, 
              // but actually it's better to just resolve with a special value or handle it in results.
              // Let's use a hack: resolve with a dummy that isn't a valid texture but doesn't crash.
              // Actually, let's just resolve with [fruit.level, null as any] so we can filter later.
              resolve([fruit.level, null as any]);
            };
          });
        });

        const results = await Promise.all(texturePromises);
        const textureMap: Record<number, HTMLCanvasElement> = {};
        results.forEach(([level, canvas]) => {
          if (canvas) {
            textureMap[level] = canvas;
          }
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