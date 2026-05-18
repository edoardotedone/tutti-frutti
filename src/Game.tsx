/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, memo, useMemo } from 'react';
import Matter from 'matter-js';
import { Trophy, RefreshCw, Play } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function shadeColor(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor((R * (100 + percent)) / 100);
  G = Math.floor((G * (100 + percent)) / 100);
  B = Math.floor((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  const RR = R.toString(16).length === 1 ? '0' + R.toString(16) : R.toString(16);
  const GG = G.toString(16).length === 1 ? '0' + G.toString(16) : G.toString(16);
  const BB = B.toString(16).length === 1 ? '0' + B.toString(16) : B.toString(16);

  return '#' + RR + GG + BB;
}

// --- Constants ---
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GAME_OVER_Y = 120;
const SPAWN_Y = 60;

const FRUIT_LEVELS = [
  { level: 0, radius: 15, color: '#ff4d4d', name: 'Cherry', score: 2, icon: '🍒' },
  { level: 1, radius: 22, color: '#ffb3b3', name: 'Strawberry', score: 4, icon: '🍓' },
  { level: 2, radius: 32, color: '#9933ff', name: 'Grape', score: 6, icon: '🍇' },
  { level: 3, radius: 40, color: '#ffcc00', name: 'Dekopon', score: 10, icon: '🍊' },
  { level: 4, radius: 52, color: '#ffa31a', name: 'Orange', score: 15, icon: '🍊' },
  { level: 5, radius: 64, color: '#ff3333', name: 'Apple', score: 21, icon: '🍎' },
  { level: 6, radius: 78, color: '#ffff33', name: 'Pear', score: 28, icon: '🍐' },
  { level: 7, radius: 92, color: '#ff99ff', name: 'Peach', score: 36, icon: '🍑' },
  { level: 8, radius: 105, color: '#99ff33', name: 'Pineapple', score: 45, icon: '🍍' },
  { level: 9, radius: 120, color: '#33cc33', name: 'Melon', score: 55, icon: '🍈' },
  { level: 10, radius: 138, color: '#006600', name: 'Watermelon', score: 66, icon: '🍉' },
  { level: 11, radius: 155, color: '#ff0000', name: 'King Suika', score: 100, icon: '👑' },
];

const ASSET_MAPPING: Record<number, string> = {
  0: './assets/fruit_0.png',
  1: './assets/fruit_1.png',
  2: './assets/fruit_2.png',
  3: './assets/fruit_3.png',
  4: './assets/fruit_4.png',
  5: './assets/fruit_5.png',
  6: './assets/fruit_6.png',
  7: './assets/fruit_7.png',
  8: './assets/fruit_8.png',
  9: './assets/fruit_9.png',
  10: './assets/fruit_10.png',
  11: './assets/fruit_11.png',
};

// --- Sub-components ---

const Scoreboard = memo(({ score, bestScore }: { score: number; bestScore: number }) => (
  <div className="w-full max-w-[400px] flex justify-between items-end mb-1 px-2 shrink-0">
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Score</span>
      <span className="text-3xl font-bold text-slate-800 tabular-nums leading-none">{score}</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#d4af37] font-semibold">
          <Trophy size={10} strokeWidth={3} />
          Best
        </div>
        <span className="text-xl font-bold text-slate-600 tabular-nums leading-none">{bestScore}</span>
      </div>
    </div>
  </div>
));

const NextFruitIndicator = memo(({ nextType, loadedTextures }: { nextType: number; loadedTextures: Record<number, HTMLCanvasElement> }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedTextures[nextType]) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const texture = loadedTextures[nextType];
    const size = 32;
    canvas.width = size;
    canvas.height = size;

    // Draw circular clip
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    
    // Draw texture centered and scaled
    const scale = size / Math.max(texture.width, texture.height);
    const w = texture.width * scale;
    const h = texture.height * scale;
    ctx.drawImage(texture, (size - w) / 2, (size - h) / 2, w, h);
    ctx.restore();
  }, [nextType, loadedTextures]);

  return (
    <div className="flex flex-col items-center bg-white/50 p-1 rounded-xl border border-slate-200 min-w-[56px]">
      <span className="text-[9px] uppercase tracking-tighter text-slate-400 mb-0.5">Next</span>
      <div className="relative w-8 h-8 flex items-center justify-center">
        {loadedTextures[nextType] ? (
          <canvas ref={canvasRef} className="w-6 h-6" />
        ) : (
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-sm shadow-sm" 
            style={{ 
              backgroundColor: FRUIT_LEVELS[nextType].color,
              border: `2px solid ${shadeColor(FRUIT_LEVELS[nextType].color, -20)}`
            }}
          >
            {FRUIT_LEVELS[nextType].icon}
          </div>
        )}
      </div>
    </div>
  );
});

const EvolutionBar = memo(({ score, loadedTextures }: { score: number; loadedTextures: Record<number, HTMLCanvasElement> }) => {
  return (
    <div className="w-full max-w-[400px] mt-1 overflow-x-auto no-scrollbar py-1 shrink-0">
      <div className="flex gap-4 px-4 min-w-max items-center">
        {FRUIT_LEVELS.slice(0, 11).map((fruit, i) => (
          <div key={i} className={cn("flex flex-col items-center opacity-40 transition-opacity", score > 0 && "opacity-100")}>
            <div 
              className="rounded-full shadow-sm flex items-center justify-center overflow-hidden border border-black/5 relative" 
              style={{ 
                backgroundColor: fruit.color, 
                width: 16 + i*2.5, 
                height: 16 + i*2.5 
              }}
            >
               {loadedTextures[i] ? (
                 <img 
                   src={loadedTextures[i].toDataURL()} 
                   className="w-full h-full object-cover"
                   alt=""
                 />
               ) : (
                 <span style={{ fontSize: `${10 + i * 0.5}px` }}>{fruit.icon}</span>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// --- Main Component ---

interface GameProps {
  loadedTextures: Record<number, HTMLCanvasElement>;
}

export default function Game({ loadedTextures }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const inputXRef = useRef(CANVAS_WIDTH / 2);
  const lastSpawnTimeRef = useRef(0);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [currentFruitType, setCurrentFruitType] = useState(0);
  const [nextFruitType, setNextFruitType] = useState(0);
  const currentFruitTypeRef = useRef(0);
  const nextFruitTypeRef = useRef(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSoundTimeRef = useRef(0);

  // --- Audio System ---

  const playMergeSound = (level: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const now = ctx.currentTime;
    if (now - lastSoundTimeRef.current < 0.1) return;
    lastSoundTimeRef.current = now;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    const baseFreq = 220 + level * 40;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.3);
  };

  const playCollisionSound = (intensity: number) => {
    if (!audioCtxRef.current || intensity < 1) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    if (now - lastSoundTimeRef.current < 0.05) return; 
    lastSoundTimeRef.current = now;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    
    gain.gain.setValueAtTime(Math.min(0.03, intensity * 0.01), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.1);
  };

  // --- Game Logic ---

  useEffect(() => {
    const saved = localStorage.getItem('suika-best-score');
    if (saved) setBestScore(parseInt(saved, 10));
    setNextFruitType(Math.floor(Math.random() * 4)); 

    const handleFirstInteraction = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      window.removeEventListener('mousedown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    window.addEventListener('mousedown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
  }, []);

  const spawnFruit = (level: number, x: number, y: number) => {
    if (!engineRef.current) return null;
    const config = FRUIT_LEVELS[level];
    const fruit = Matter.Bodies.circle(x, y, config.radius, {
      restitution: 0.2,
      friction: 0.3,
      frictionAir: 0.02,
      slop: 0.02,
      sleepThreshold: 360,
      label: `fruit_${level}`,
      isStatic: false,
      collisionFilter: { group: 0, category: 0x0001, mask: 0x0001 },
      render: { visible: false }
    });

    (fruit as any).spawnTime = Date.now();
    Matter.Composite.add(engineRef.current.world, fruit);
    return fruit;
  };

  const createWalls = () => {
    if (!engineRef.current) return;
    const thickness = 1000;
    const walls = [
      Matter.Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + thickness / 2, CANVAS_WIDTH + thickness, thickness, { isStatic: true, friction: 0.8, restitution: 0.1 }),
      Matter.Bodies.rectangle(-thickness / 2, CANVAS_HEIGHT / 2, thickness, CANVAS_HEIGHT * 2, { isStatic: true, friction: 0.8, restitution: 0.1 }),
      Matter.Bodies.rectangle(CANVAS_WIDTH + thickness / 2, CANVAS_HEIGHT / 2, thickness, CANVAS_HEIGHT * 2, { isStatic: true, friction: 0.8, restitution: 0.1 }),
    ];
    Matter.Composite.add(engineRef.current.world, walls);
  };

  const handleMerge = (pair: Matter.IPair) => {
    const { bodyA, bodyB } = pair;
    if (!bodyA.label.startsWith('fruit_') || !bodyB.label.startsWith('fruit_')) return;
    if (bodyA.label === bodyB.label) {
      const level = parseInt(bodyA.label.split('_')[1], 10);
      if (level >= FRUIT_LEVELS.length - 1) return;

      const midX = (bodyA.position.x + bodyB.position.x) / 2;
      const midY = (bodyA.position.y + bodyB.position.y) / 2;

      Matter.Composite.remove(engineRef.current!.world, [bodyA, bodyB]);

      const newFruit = spawnFruit(level + 1, midX, midY);
      if (newFruit) Matter.Sleeping.set(newFruit, false);
      
      playMergeSound(level);
      setScore(prev => {
        const newScore = prev + FRUIT_LEVELS[level].score;
        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem('suika-best-score', newScore.toString());
        }
        return newScore;
      });
    }
  };

  const startNewGame = () => {
    setIsGameOver(false);
    setScore(0);
    setIsStarted(true);
    const initialFruit = Math.floor(Math.random() * 4);
    const nextFruit = Math.floor(Math.random() * 4);
    setCurrentFruitType(initialFruit);
    setNextFruitType(nextFruit);
    currentFruitTypeRef.current = initialFruit;
    nextFruitTypeRef.current = nextFruit;

    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world, false);
      createWalls();
    }
  };

  useEffect(() => {
    const engine = Matter.Engine.create({ enableSleeping: true });
    const runner = Matter.Runner.create();
    engineRef.current = engine;
    runnerRef.current = runner;

    const render = Matter.Render.create({
      canvas: canvasRef.current!,
      engine: engine,
      options: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT, wireframes: false, background: 'transparent' }
    });
    renderRef.current = render;

    createWalls();

    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        handleMerge(pair);
        playCollisionSound(pair.collision.speed);
      });
    });

    Matter.Runner.run(runner, engine);

    const loop = () => {
      if (isGameOver) return;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && engine.world.bodies.length > 0) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw Dead Line
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, GAME_OVER_Y); ctx.lineTo(CANVAS_WIDTH, GAME_OVER_Y); ctx.stroke();
        ctx.setLineDash([]);

        const bodies = Matter.Composite.allBodies(engine.world);
        let gameOverTriggered = false;

        bodies.forEach((body: Matter.Body) => {
          if (body.label.startsWith('fruit_')) {
            const level = parseInt(body.label.split('_')[1], 10);
            const radius = FRUIT_LEVELS[level].radius;
            ctx.save();
            ctx.translate(body.position.x, body.position.y);
            ctx.rotate(body.angle);

            if (loadedTextures[level]) {
              // Draw circular clip for the image
              ctx.beginPath();
              ctx.arc(0, 0, radius, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(loadedTextures[level], -radius, -radius, radius * 2, radius * 2);
            } else {
              // Fallback to a simple colored circle
              ctx.beginPath();
              ctx.arc(0, 0, radius, 0, Math.PI * 2);
              ctx.fillStyle = FRUIT_LEVELS[level].color;
              ctx.fill();
            }
            ctx.restore();

            if (body.position.y - radius < GAME_OVER_Y && body.velocity.y < 0.1 && body.velocity.y > -0.1) {
              if (Date.now() - (body as any).spawnTime > 2000) gameOverTriggered = true;
            }
          }
        });

        if (gameOverTriggered) { setIsGameOver(true); setIsStarted(false); }

        if (isStarted && !isGameOver) {
          const type = currentFruitTypeRef.current;
          const config = FRUIT_LEVELS[type];
          ctx.save(); ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'; ctx.beginPath();
          ctx.moveTo(inputXRef.current, SPAWN_Y); ctx.lineTo(inputXRef.current, CANVAS_HEIGHT); ctx.stroke(); ctx.restore();
          ctx.globalAlpha = 0.6; ctx.save(); ctx.translate(inputXRef.current, SPAWN_Y);

          // Clipping for preview fruit
          ctx.beginPath();
          ctx.arc(0, 0, config.radius, 0, Math.PI * 2);
          ctx.clip();

          if (loadedTextures[type]) {
            ctx.drawImage(loadedTextures[type], -config.radius, -config.radius, config.radius * 2, config.radius * 2);
          } else {
            ctx.beginPath(); ctx.arc(0, 0, config.radius, 0, Math.PI * 2); ctx.fillStyle = config.color; ctx.fill();
          }
          ctx.restore(); ctx.globalAlpha = 1.0;
        }
      }
      requestAnimationFrame(loop);
    };

    const animFrame = requestAnimationFrame(loop);
    return () => {
      Matter.Engine.clear(engine);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      cancelAnimationFrame(animFrame);
    };
  }, [loadedTextures, isStarted, isGameOver]);

  const onInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isGameOver || !isStarted) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    let clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const scaledX = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const config = FRUIT_LEVELS[currentFruitType];
    inputXRef.current = Math.max(config.radius, Math.min(CANVAS_WIDTH - config.radius, scaledX));
  };

  const onInteractionEnd = () => {
    if (isGameOver || !isStarted) return;
    const now = Date.now();
    if (now - lastSpawnTimeRef.current < 500) return;
    const fruit = spawnFruit(currentFruitType, inputXRef.current, SPAWN_Y);
    if (fruit) {
      lastSpawnTimeRef.current = now;
      const next = nextFruitType;
      setCurrentFruitType(next);
      currentFruitTypeRef.current = next;
      const newNext = Math.floor(Math.random() * 4);
      setNextFruitType(newNext);
      nextFruitTypeRef.current = newNext;
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-[400px] h-[100dvh] flex flex-col bg-[#fdfaf3] select-none touch-none font-sans overflow-hidden mx-auto p-2">
      <div className="flex flex-col w-full h-full">
        <Scoreboard score={score} bestScore={bestScore} />
        
        <div className="w-full flex justify-between items-center px-2 mb-1 shrink-0">
           <NextFruitIndicator nextType={nextFruitType} loadedTextures={loadedTextures} />
           {/* Space for potential other UI elements */}
           <div className="w-16" /> 
        </div>

         <div className="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden">
           <div className="relative aspect-[400/600] max-h-full max-w-full bg-[#ffeeb2] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#e6d08b]">
             <canvas
               ref={canvasRef}
               className="w-full h-full object-contain block"
               onMouseMove={onInteractionMove}
               onMouseUp={onInteractionEnd}
               onTouchMove={onInteractionMove}
               onTouchEnd={onInteractionEnd}
             />
           </div>
         </div>

        {!isStarted && !isGameOver && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-8 text-center z-50">
            <button onClick={startNewGame} className="group flex flex-col items-center bg-white text-slate-900 px-8 py-6 rounded-3xl shadow-xl transform transition-all active:scale-95 hover:scale-105">
              <div className="w-16 h-16 bg-[#ff6b6b] rounded-full flex items-center justify-center text-white mb-4 shadow-lg group-hover:bg-[#ff5252]">
                <Play fill="currentColor" size={32} className="ml-1" />
              </div>
              <span className="text-2xl font-bold">Uniscile Tutte</span>
              <span className="text-sm text-slate-500 mt-1 uppercase tracking-widest">Tutti Frutti</span>
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-[#ff6b6b]/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white z-50">
            <span className="text-5xl font-black mb-2 uppercase tracking-tight">Game Over</span>
            <span className="text-lg opacity-80 mb-8 font-medium">Final Score: {score}</span>
            <button onClick={startNewGame} className="flex items-center gap-3 bg-white text-[#ff6b6b] px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-slate-50 transition-colors active:scale-95">
              <RefreshCw size={24} />
              Try Again
            </button>
          </div>
        )}

        <EvolutionBar score={score} loadedTextures={loadedTextures} />
      </div>
    </div>
  );
}
