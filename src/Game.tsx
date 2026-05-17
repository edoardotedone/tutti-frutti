/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
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
const TOP_MARGIN = 100;
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

// --- Components ---

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const inputXRef = useRef(CANVAS_WIDTH / 2);
  const isDraggingRef = useRef(false);
  const lastSpawnTimeRef = useRef(0);
  const gameOverTimerRef = useRef<number | null>(null);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [currentFruitType, setCurrentFruitType] = useState(0);
  const [nextFruitType, setNextFruitType] = useState(0);
  const currentFruitTypeRef = useRef(0);
  const nextFruitTypeRef = useRef(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const [loadedTextures, setLoadedTextures] = useState<Record<number, HTMLCanvasElement>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio System
  const playMergeSound = (level: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    const baseFreq = 220 + level * 40;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  const playCollisionSound = (intensity: number) => {
    if (!audioCtxRef.current || intensity < 1) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    
    gain.gain.setValueAtTime(Math.min(0.05, intensity * 0.01), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  // Initialize Best Score & Audio
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

  // Pre-process Textures with Circular Mask
  useEffect(() => {
    const loadAndProcess = async () => {
      const textures: Record<number, HTMLCanvasElement> = {};
      for (const [level, url] of Object.entries(ASSET_MAPPING)) {
        const lvl = parseInt(level, 10);
        try {
          const img = new Image();
          img.src = url;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          // Create offscreen canvas for masking
          const offCanvas = document.createElement('canvas');
          const radius = FRUIT_LEVELS[lvl].radius;
          const size = radius * 2;
          offCanvas.width = size;
          offCanvas.height = size;
          const ctx = offCanvas.getContext('2d');
          if (ctx) {
            ctx.beginPath();
            ctx.arc(radius, radius, radius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, 0, 0, size, size);
            textures[lvl] = offCanvas;
          }
        } catch (e) {
          // Fallback: Glossy circle + Emoji icon
          const offCanvas = document.createElement('canvas');
          const radius = FRUIT_LEVELS[lvl].radius;
          const size = radius * 2;
          offCanvas.width = size;
          offCanvas.height = size;
          const ctx = offCanvas.getContext('2d');
          if (ctx) {
            // Main body
            const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
            gradient.addColorStop(0, FRUIT_LEVELS[lvl].color);
            gradient.addColorStop(1, shadeColor(FRUIT_LEVELS[lvl].color, -20));
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Reflection
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.ellipse(radius * 0.6, radius * 0.5, radius * 0.3, radius * 0.15, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

            // Emoji
            ctx.font = `${radius * 1.2}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(FRUIT_LEVELS[lvl].icon, radius, radius + radius * 0.1);
            
            textures[lvl] = offCanvas;
          }
        }
      }
      setLoadedTextures(textures);
    };
    loadAndProcess();
  }, []);

  const spawnFruit = (level: number, x: number, y: number, isStatic = false) => {
    if (!engineRef.current) return null;
    const config = FRUIT_LEVELS[level];
    const fruit = Matter.Bodies.circle(x, y, config.radius, {
      restitution: 0.2,
      friction: 0.3,
      frictionAir: 0.02,
      slop: 0.02,
      sleepThreshold: 360, // Doubled from default 60 to give more time to settle
      label: `fruit_${level}`,
      isStatic,
      collisionFilter: {
        group: 0,
        category: 0x0001,
        mask: 0x0001,
      },
      render: {
        visible: false, // Custom drawing in loop
      }
    });

    (fruit as any).spawnTime = Date.now();
    Matter.Composite.add(engineRef.current.world, fruit);
    return fruit;
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

  const createWalls = () => {
    if (!engineRef.current) return;
    const thickness = 1000; // Very thick to prevent tunneling
    const walls = [
      // Bottom
      Matter.Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + thickness / 2, CANVAS_WIDTH + thickness, thickness, { 
        isStatic: true, 
        friction: 0.8,
        restitution: 0.1
      }),
      // Left
      Matter.Bodies.rectangle(-thickness / 2, CANVAS_HEIGHT / 2, thickness, CANVAS_HEIGHT * 2, { 
        isStatic: true,
        friction: 0.8,
        restitution: 0.1
      }),
      // Right
      Matter.Bodies.rectangle(CANVAS_WIDTH + thickness / 2, CANVAS_HEIGHT / 2, thickness, CANVAS_HEIGHT * 2, { 
        isStatic: true,
        friction: 0.8,
        restitution: 0.1
      }),
    ];
    Matter.Composite.add(engineRef.current.world, walls);
  };

  const handleMerge = (pair: Matter.IPair) => {
    const { bodyA, bodyB } = pair;
    if (!bodyA.label.startsWith('fruit_') || !bodyB.label.startsWith('fruit_')) return;
    if (bodyA.label === bodyB.label) {
      const level = parseInt(bodyA.label.split('_')[1], 10);
      if (level >= FRUIT_LEVELS.length - 1) {
        // Max level reached? Maybe just remove them or keep them?
        // In Suika, they usually don't merge further.
        return;
      }

      // Mid point
      const midX = (bodyA.position.x + bodyB.position.x) / 2;
      const midY = (bodyA.position.y + bodyB.position.y) / 2;

      // Remove old
      Matter.Composite.remove(engineRef.current!.world, [bodyA, bodyB]);

      // Add new
      const newFruit = spawnFruit(level + 1, midX, midY);
      if (newFruit) {
         // Wake up nearby bodies to prevent "suspended in air" issues
         const bodies = Matter.Composite.allBodies(engineRef.current!.world);
         bodies.forEach(body => {
           if (!body.isStatic) Matter.Sleeping.set(body, false);
         });
      }
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

  // Setup Engine
  useEffect(() => {
    const engine = Matter.Engine.create({
      enableSleeping: true,
      velocityIterations: 15,
      positionIterations: 15,
    });
    const runner = Matter.Runner.create();
    engineRef.current = engine;
    runnerRef.current = runner;

    const render = Matter.Render.create({
      canvas: canvasRef.current!,
      engine: engine,
      options: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        wireframes: false,
        background: 'transparent',
      }
    });
    renderRef.current = render;

    createWalls();

    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        handleMerge(pair);
        const intensity = pair.collision.speed;
        playCollisionSound(intensity);
      });
    });

    Matter.Runner.run(runner, engine);

    // Custom Animation Frame for custom rendering and Game Over check
    const loop = () => {
      if (isGameOver) return;
      
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && engine.world.bodies.length > 0) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw Game Over Line
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, GAME_OVER_Y);
        ctx.lineTo(CANVAS_WIDTH, GAME_OVER_Y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Render Bodies
        const bodies = Matter.Composite.allBodies(engine.world);
        let gameOverTriggered = false;

        bodies.forEach(body => {
          if (body.label.startsWith('fruit_')) {
            const level = parseInt(body.label.split('_')[1], 10);
            const radius = FRUIT_LEVELS[level].radius;
            
            ctx.save();
            ctx.translate(body.position.x, body.position.y);
            ctx.rotate(body.angle);
            
            if (loadedTextures[level]) {
              ctx.drawImage(loadedTextures[level], -radius, -radius, radius * 2, radius * 2);
            } else {
              // Fallback if textures not loaded yet
              ctx.beginPath();
              ctx.arc(0, 0, radius, 0, Math.PI * 2);
              ctx.fillStyle = FRUIT_LEVELS[level].color;
              ctx.fill();
            }
            ctx.restore();

            // Check Game Over (Only if not the one currently falling if we keep track)
            // Typically if a body is above the line AND settled for some time.
            // Simplified: if body.position.y - radius < GAME_OVER_Y and it has been there
            if (body.position.y - radius < GAME_OVER_Y && body.velocity.y < 0.1 && body.velocity.y > -0.1) {
              // Only check if it's not a fresh spawn (give it time to drop)
              if (Date.now() - (body as any).spawnTime > 2000) {
                gameOverTriggered = true;
              }
            }
          } else {
            // Walls
            ctx.fillStyle = '#333';
            ctx.beginPath();
            // Assuming boxes for walls
            const vertices = body.vertices;
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
              ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.fill();
          }
        });

        if (gameOverTriggered) {
          setIsGameOver(true);
          setIsStarted(false);
        }

        // Draw Current fruit (Ghost)
        if (isStarted && !isGameOver) {
          const type = currentFruitTypeRef.current;
          const currentConfig = FRUIT_LEVELS[type];

          // Draw vertical guide line
          ctx.save();
          ctx.setLineDash([8, 8]);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(inputXRef.current, SPAWN_Y);
          ctx.lineTo(inputXRef.current, CANVAS_HEIGHT);
          ctx.stroke();
          ctx.restore();

          ctx.globalAlpha = 0.6;
          ctx.save();
          ctx.translate(inputXRef.current, SPAWN_Y);
          if (loadedTextures[type]) {
            ctx.drawImage(loadedTextures[type], -currentConfig.radius, -currentConfig.radius, currentConfig.radius * 2, currentConfig.radius * 2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, currentConfig.radius, 0, Math.PI * 2);
            ctx.fillStyle = currentConfig.color;
            ctx.fill();
          }
          ctx.restore();
          ctx.globalAlpha = 1.0;
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
    
    let clientX = 0;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const x = clientX - rect.left;
    const config = FRUIT_LEVELS[currentFruitType];
    // Clamp
    inputXRef.current = Math.max(config.radius, Math.min(CANVAS_WIDTH - config.radius, x));
  };

  const onInteractionEnd = () => {
    if (isGameOver || !isStarted) return;
    const now = Date.now();
    if (now - lastSpawnTimeRef.current < 500) return;

    const fruit = spawnFruit(currentFruitType, inputXRef.current, SPAWN_Y);
    if (fruit) {
      lastSpawnTimeRef.current = now;
      
      // Cycle fruits
      const nextType = nextFruitType;
      setCurrentFruitType(nextType);
      currentFruitTypeRef.current = nextType;
      
      const newNext = Math.floor(Math.random() * 4);
      setNextFruitType(newNext);
      nextFruitTypeRef.current = newNext;
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center min-h-screen bg-[#fdfaf3] p-4 select-none touch-none font-sans overflow-hidden">
      {/* Responsive Container */}
      <div className="flex flex-col items-center w-full max-w-[400px] max-h-[85dvh] aspect-[4/6]">
        {/* UI Header */}
        <div className="w-full max-w-[400px] flex justify-between items-end mb-4 px-2">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Score</span>
          <span className="text-4xl font-bold text-slate-800 tabular-nums leading-none">{score}</span>
        </div>
        <div className="flex items-center gap-4">
           {/* Next Fruit Preview */}
           <div className="flex flex-col items-center bg-white/50 p-2 rounded-2xl border border-slate-200 min-w-16">
             <span className="text-[10px] uppercase tracking-tighter text-slate-400 mb-1">Next</span>
             <div className="relative w-10 h-10 flex items-center justify-center">
               {loadedTextures[nextFruitType] ? (
                 <img 
                    src={loadedTextures[nextFruitType].toDataURL()} 
                    alt="Next fruit" 
                    className="w-8 h-8 object-contain"
                 />
               ) : (
                 <div 
                   className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm" 
                   style={{ 
                     backgroundColor: FRUIT_LEVELS[nextFruitType].color,
                     border: `2px solid ${shadeColor(FRUIT_LEVELS[nextFruitType].color, -20)}`
                   }}
                 >
                   {FRUIT_LEVELS[nextFruitType].icon}
                 </div>
               )}
             </div>
           </div>
           <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
              <Trophy size={12} strokeWidth={3} />
              Best
            </div>
            <span className="text-2xl font-bold text-slate-600 tabular-nums leading-none">{bestScore}</span>
          </div>
        </div>
      </div>

       {/* Game Canvas Container */}
       <div className="relative w-full h-full bg-[#ffeeb2] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#e6d08b]">
         <canvas
           ref={canvasRef}
           className="w-full h-full bg-transparent block"
           onMouseMove={onInteractionMove}
           onMouseUp={onInteractionEnd}
           onTouchMove={onInteractionMove}
           onTouchEnd={onInteractionEnd}
         />

        {/* Start Overlay */}
        {!isStarted && !isGameOver && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-center items-center justify-center p-8 text-center">
            <button 
              onClick={startNewGame}
              className="group flex flex-col items-center bg-white text-slate-900 px-8 py-6 rounded-3xl shadow-xl transform transition-all active:scale-95 hover:scale-105"
            >
              <div className="w-16 h-16 bg-[#ff6b6b] rounded-full flex items-center justify-center text-white mb-4 shadow-lg group-hover:bg-[#ff5252]">
                <Play fill="currentColor" size={32} className="ml-1" />
              </div>
              <span className="text-2xl font-bold">Uniscile Tutte</span>
              <span className="text-sm text-slate-500 mt-1 uppercase tracking-widest">Tutti Frutti</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-[#ff6b6b]/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white animate-in fade-in zoom-in duration-300">
            <span className="text-5xl font-black mb-2 uppercase tracking-tight">Game Over</span>
            <span className="text-lg opacity-80 mb-8 font-medium">Final Score: {score}</span>
            <button 
              onClick={startNewGame}
              className="flex items-center gap-3 bg-white text-[#ff6b6b] px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-slate-50 transition-colors active:scale-95"
            >
              <RefreshCw size={24} />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Evolution Info (Bottom Bar - Secret Level Hidden) */}
      <div className="w-full max-w-[400px] mt-6 overflow-x-auto no-scrollbar py-2">
        <div className="flex gap-4 px-4 min-w-max items-center">
          {FRUIT_LEVELS.slice(0, 11).map((fruit, i) => (
            <div key={i} className={cn("flex flex-col items-center opacity-40 transition-opacity", score > 0 && "opacity-100")}>
              <div 
                className="rounded-full shadow-sm flex items-center justify-center overflow-hidden border border-black/5" 
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
                    alt={fruit.name}
                  />
                ) : (
                  <span style={{ fontSize: `${10 + i * 0.5}px` }}>{fruit.icon}</span>
                )}
              </div>
            </div>
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300">
             ?
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">
        Fai cadere la frutta • Non superare la linea rossa
      </div>
    </div>
    </div>
  );
}
