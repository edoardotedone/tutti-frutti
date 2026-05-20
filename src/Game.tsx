/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, memo, useMemo } from 'react';
import Matter from 'matter-js';
import { Trophy, RefreshCw, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FRUIT_LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_OVER_Y, SPAWN_Y, type FruitLevel } from './constants';

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

// --- Sub-components ---

const Scoreboard = memo(({ score, bestScore, darkMode }: { score: number; bestScore: number; darkMode: boolean }) => (
  <div className="w-full max-w-[400px] flex justify-between items-baseline px-2 shrink-0">
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold leading-none mb-1">Score</span>
      <span className={cn("text-3xl font-bold tabular-nums leading-none", darkMode ? "text-slate-200" : "text-slate-800")}>{score}</span>
    </div>
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#d4af37] font-semibold leading-none mb-1">
        <Trophy size={10} strokeWidth={3} />
        Best
      </div>
      <span className={cn("text-3xl font-bold tabular-nums leading-none", darkMode ? "text-slate-400" : "text-slate-600")}>{bestScore}</span>
    </div>
  </div>
));

const NextFruitIndicator = memo(({ nextType, loadedTextures, darkMode }: { nextType: number; loadedTextures: Record<number, HTMLCanvasElement>; darkMode?: boolean }) => {
  const borderColor = useMemo(() => shadeColor(FRUIT_LEVELS[nextType].color, -20), [nextType]);
  const textureUrl = useMemo(() => loadedTextures[nextType]?.toDataURL(), [nextType, loadedTextures[nextType]]);

  return (
    <div className="flex flex-col items-center min-w-[60px]">
      <span className={cn("text-[10px] uppercase tracking-widest mb-1 font-semibold", darkMode ? "text-slate-500" : "text-slate-400")}>Next</span>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shadow-sm relative"
        style={{
          border: `3px solid ${borderColor}`,
          background: darkMode ? '#2a2a3e' : '#ffffff'
        }}
      >
        {textureUrl ? (
          <img
            src={textureUrl}
            className="w-full h-full object-cover"
            alt=""
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-lg"
            style={{ backgroundColor: FRUIT_LEVELS[nextType].color }}
          >
            {FRUIT_LEVELS[nextType].icon}
          </div>
        )}
      </div>
    </div>
  );
});

const EvolutionBar = memo(({ score, loadedTextures, darkMode }: { score: number; loadedTextures: Record<number, HTMLCanvasElement>; darkMode?: boolean }) => {
  const textureUrls = useMemo(() => {
    const urls: Record<number, string> = {};
    FRUIT_LEVELS.forEach((fruit) => {
      if (loadedTextures[fruit.level]) {
        urls[fruit.level] = loadedTextures[fruit.level].toDataURL();
      }
    });
    return urls;
  }, [loadedTextures]);

  return (
    <div className="w-full max-w-[400px] mt-1 overflow-x-auto no-scrollbar py-1 shrink-0">
      <div className="flex gap-4 px-4 min-w-max items-center">
        {FRUIT_LEVELS.map((fruit) => {
          const isKingSuika = fruit.level === FRUIT_LEVELS.length - 1;
          return (
            <div key={fruit.level} className={cn("flex flex-col items-center opacity-40 transition-opacity", score > 0 && "opacity-100", darkMode && "opacity-60")}>
              <div
                className="rounded-full shadow-sm flex items-center justify-center overflow-hidden border border-black/5 relative"
                style={{
                  backgroundColor: isKingSuika ? '#e2e8f0' : fruit.color,
                  width: 16 + fruit.level * 2.5,
                  height: 16 + fruit.level * 2.5
                }}
              >
                 {isKingSuika ? (
                   <span className="text-slate-500 font-bold" style={{ fontSize: `${10 + fruit.level * 0.5}px` }}>?</span>
                 ) : textureUrls[fruit.level] ? (
                  <img
                    src={textureUrls[fruit.level]}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  <span style={{ fontSize: `${10 + fruit.level * 0.5}px` }}>{fruit.icon}</span>
                )}
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
});

// --- Main Component ---

interface GameProps {
  loadedTextures: Record<number, HTMLCanvasElement>;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Game({ loadedTextures, darkMode, setDarkMode }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameId, setGameId] = useState(0);

  return (
    <div ref={containerRef} key={gameId} className={cn("w-full max-w-[400px] h-[100dvh] flex flex-col select-none touch-none font-sans overflow-hidden mx-auto p-2 transition-colors", darkMode ? "bg-[#2a2a3e]" : "bg-[#e8e0f0]")}>
      <GameContent loadedTextures={loadedTextures} setGameId={setGameId} gameId={gameId} darkMode={darkMode} setDarkMode={setDarkMode} />
    </div >
  );
}

interface GameContentProps {
  loadedTextures: Record<number, HTMLCanvasElement>;
  setGameId: React.Dispatch<React.SetStateAction<number>>;
  gameId: number;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

function GameContent({ loadedTextures, setGameId, gameId, darkMode, setDarkMode }: GameContentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const inputXRef = useRef(CANVAS_WIDTH / 2);
  const lastSpawnTimeRef = useRef(0);
  // Retina DPI support
  const dprRef = useRef(1);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [currentFruitType, setCurrentFruitType] = useState(0);
  const [nextFruitType, setNextFruitType] = useState(0);
  const currentFruitTypeRef = useRef(0);
  const nextFruitTypeRef = useRef(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);

  // Ref synced with state for safe access inside the render loop without triggering re-setup
  const isGameOverRef = useRef(false);
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);
  const darkModeRef = useRef(darkMode);
  useEffect(() => { darkModeRef.current = darkMode; }, [darkMode]);

  // Refs for proper render loop cleanup
  const activeRef = useRef(true);
  const animFrameRef = useRef<number | null>(null);

  // Set for deduplicating merges (keys: "bodyA_id-bodyB_id")
  const mergedPairsRef = useRef<Set<string>>(new Set());
  // Queue for deferred merge processing (avoids modifying world during collision iteration)
  const pendingMergesRef = useRef<Array<{ level: number; x: number; y: number }>>([]);

  // Countdown state for game-over warning
  const countdownRef = useRef(0);
  const [countdown, setCountdown] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastMergeSoundTimeRef = useRef(0);
  // Track which body IDs have already played their collision sound
  const collisionPlayedRef = useRef<Set<number>>(new Set());

  // Sound enabled state (persisted to localStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('suika-sound');
    return saved !== null ? saved === 'true' : true;
  });
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  // --- Audio System ---

  const playMergeSound = (level: number) => {
    if (!soundEnabledRef.current) return;
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    // Non-blocking resume attempt
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // If state is still not running, skip to avoid blocking/crashing
    if (ctx.state !== 'running' && ctx.state !== 'suspended') return;

    const now = ctx.currentTime;
    if (now - lastMergeSoundTimeRef.current < 0.1) return;
    lastMergeSoundTimeRef.current = now;

    // Defensive check for finite numbers
    const baseFreq = 220 + level * 40;
    if (!Number.isFinite(baseFreq)) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * 1.2, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.25);
    } catch (e) {
      console.error("Merge sound error:", e);
    }
  };

  const playCollisionSound = () => {
    if (!soundEnabledRef.current) return;
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    if (ctx.state === 'suspended') { ctx.resume(); }
    if (ctx.state !== 'running' && ctx.state !== 'suspended') return;

    const now = ctx.currentTime;
    try {
      // Short "thud" sound: low frequency triangle with quick decay
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.1);
    } catch (e) {
      // Silently ignore
    }
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
      mass: Math.pow(FRUIT_LEVELS[level].radius / 15, 2),
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

  const processPendingMerges = () => {
    if (!engineRef.current || pendingMergesRef.current.length === 0) return;
    const merges = pendingMergesRef.current;
    pendingMergesRef.current = [];

    for (const merge of merges) {
      if (merge.level >= FRUIT_LEVELS.length - 1) {
        setIsWin(true);
        return;
      }

      const newFruit = spawnFruit(merge.level + 1, merge.x, merge.y);
      if (newFruit) {
        Matter.Sleeping.set(newFruit, false);
        // Suppress collision sound for the newly merged fruit so merge sound plays alone
        collisionPlayedRef.current.add(newFruit.id);
      }

      playMergeSound(merge.level);
      setScore((prev: number) => {
        const newScore = prev + FRUIT_LEVELS[merge.level].score;
        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem('suika-best-score', newScore.toString());
        }
        return newScore;
      });
    }
  };

  const handleMerge = (pair: Matter.IPair) => {
    const { bodyA, bodyB } = pair;
    if (!bodyA.label.startsWith('fruit_') || !bodyB.label.startsWith('fruit_')) return;
    if (bodyA.label !== bodyB.label) return;

    const level = parseInt(bodyA.label.split('_')[1], 10);

    // Deduplication: create a stable key from the two body ids (sorted)
    const idA = bodyA.id;
    const idB = bodyB.id;
    const pairKey = idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
    if (mergedPairsRef.current.has(pairKey)) return;
    mergedPairsRef.current.add(pairKey);

    // Cap set size to prevent memory growth (keep last 500 entries)
    if (mergedPairsRef.current.size > 500) {
      const arr = Array.from(mergedPairsRef.current);
      mergedPairsRef.current = new Set(arr.slice(-250));
    }

    const midX = (bodyA.position.x + bodyB.position.x) / 2;
    const midY = (bodyA.position.y + bodyB.position.y) / 2;

    // Remove both bodies immediately (safe in collisionStart since iteration is over)
    Matter.Composite.remove(engineRef.current!.world, [bodyA, bodyB]);

    // Queue merge for deferred processing
    pendingMergesRef.current.push({ level, x: midX, y: midY });
  };

  const startNewGame = () => {
    setGameId(prev => prev + 1);
  };

  useEffect(() => {
    setIsGameOver(false);
    setIsWin(false);
    setScore(0);
    const initialFruit = Math.floor(Math.random() * 4);
    const nextFruit = Math.floor(Math.random() * 4);
    setCurrentFruitType(initialFruit);
    setNextFruitType(nextFruit);
    currentFruitTypeRef.current = initialFruit;
    nextFruitTypeRef.current = nextFruit;
  }, [gameId]);

  useEffect(() => {
    activeRef.current = true;
    const engine = Matter.Engine.create();
    const runner = Matter.Runner.create();
    engineRef.current = engine;
    runnerRef.current = runner;

    // Retina DPI: scale canvas internal resolution for crisp rendering
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      canvas.width = CANVAS_WIDTH * dpr;
      canvas.height = CANVAS_HEIGHT * dpr;
    }

    createWalls();

    Matter.Events.on(engine, 'collisionStart', (event: Matter.Event<{}>) => {
      const pairs = event.pairs;
      pairs.forEach((pair: Matter.IPair) => {
        const { bodyA, bodyB } = pair;

        const aFruit = bodyA.label.startsWith('fruit_');
        const bFruit = bodyB.label.startsWith('fruit_');

        // Merge takes priority: same-level fruit pair → merge, skip collision sound
        if (aFruit && bFruit && bodyA.label === bodyB.label) {
          handleMerge(pair);
          return; // Merge priority: no collision sound
        }

        // Collision sound: play once per fruit on first contact
        // Applies to fruit+wall, fruit+floor, and different-level fruit+fruit
        if (aFruit) {
          if (!collisionPlayedRef.current.has(bodyA.id)) {
            collisionPlayedRef.current.add(bodyA.id);
            playCollisionSound();
          }
        }
        if (bFruit) {
          if (!collisionPlayedRef.current.has(bodyB.id)) {
            collisionPlayedRef.current.add(bodyB.id);
            playCollisionSound();
          }
        }

        // Cap set size to prevent memory growth
        if (collisionPlayedRef.current.size > 200) {
          const arr = Array.from(collisionPlayedRef.current);
          collisionPlayedRef.current = new Set(arr.slice(-100));
        }
      });
    });

    // Process queued merges after each physics step (safe: no longer iterating collisions)
    Matter.Events.on(engine, 'afterUpdate', () => {
      processPendingMerges();
    });

    Matter.Runner.run(runner, engine);

    // Pause physics when tab is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        Matter.Runner.stop(runner);
      } else {
        Matter.Runner.run(runner, engine);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const loop = () => {
      if (!activeRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const dpr = dprRef.current;
      if (ctx && engine.world.bodies.length > 0) {
        // Scale context for DPI-aware rendering
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Dark mode aware colors
        const isDark = darkModeRef.current;
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = isDark ? 'rgba(255,100,100,0.5)' : 'rgba(255,68,68,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, GAME_OVER_Y); ctx.lineTo(CANVAS_WIDTH, GAME_OVER_Y); ctx.stroke();
        ctx.setLineDash([]);

        const bodies = Matter.Composite.allBodies(engine.world);
        let maxViolationMs = 0;

        bodies.forEach((body: Matter.Body) => {
          if (body.label.startsWith('fruit_')) {
            const level = parseInt(body.label.split('_')[1], 10);
            const radius = FRUIT_LEVELS[level].radius;
            ctx.save();
            ctx.translate(body.position.x, body.position.y);
            ctx.rotate(body.angle);

            if (loadedTextures[level]) {
              ctx.beginPath();
              ctx.arc(0, 0, radius, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(loadedTextures[level], -radius, -radius, radius * 2, radius * 2);

              // Add color-matched outline (scales: 3.5px on small fruits → 14px on large fruits)
              ctx.beginPath();
              ctx.arc(0, 0, radius + 0.5, 0, Math.PI * 2);
              ctx.strokeStyle = FRUIT_LEVELS[level].color;
              ctx.lineWidth = 3.5 + (level / 11) * 10.5;
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, radius, 0, Math.PI * 2);
              ctx.fillStyle = FRUIT_LEVELS[level].color;
              ctx.fill();
            }
            ctx.restore();

            if (body.position.y - radius < GAME_OVER_Y) {
              const violation = Date.now() - (body as any).spawnTime - 1000;
              if (violation > 0 && violation > maxViolationMs) maxViolationMs = violation;
            }
          }
        });

        const GAME_OVER_MS = 5000;
        if (maxViolationMs > GAME_OVER_MS) {
          setIsGameOver(true);
          if (countdownRef.current !== 0) { countdownRef.current = 0; setCountdown(0); }
        } else if (maxViolationMs > 0) {
          const remaining = Math.ceil((GAME_OVER_MS - maxViolationMs) / 1000);
          if (remaining !== countdownRef.current) {
            countdownRef.current = remaining;
            setCountdown(remaining);
          }
        } else {
          if (countdownRef.current !== 0) { countdownRef.current = 0; setCountdown(0); }
        }

        if (!isGameOverRef.current) {
          const type = currentFruitTypeRef.current;
          const config = FRUIT_LEVELS[type];
          ctx.save(); ctx.setLineDash([8, 8]); ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0, 0, 0, 0.15)'; ctx.beginPath();
          ctx.moveTo(inputXRef.current, SPAWN_Y); ctx.lineTo(inputXRef.current, CANVAS_HEIGHT); ctx.stroke(); ctx.restore();
          ctx.globalAlpha = 0.6; ctx.save(); ctx.translate(inputXRef.current, SPAWN_Y);

          ctx.beginPath();
          ctx.arc(0, 0, config.radius, 0, Math.PI * 2);
          ctx.clip();

          if (loadedTextures[type]) {
            ctx.drawImage(loadedTextures[type], -config.radius, -config.radius, config.radius * 2, config.radius * 2);

            // Add color-matched outline (scales: 3.5px on small fruits → 14px on large fruits)
            ctx.beginPath();
            ctx.arc(0, 0, config.radius + 0.5, 0, Math.PI * 2);
            ctx.strokeStyle = FRUIT_LEVELS[type].color;
            ctx.lineWidth = 3.5 + (type / 11) * 10.5;
            ctx.stroke();
          } else {
            ctx.beginPath(); ctx.arc(0, 0, config.radius, 0, Math.PI * 2); ctx.fillStyle = config.color; ctx.fill();
          }
          ctx.restore(); ctx.globalAlpha = 1.0;
        }

        ctx.restore(); // Restore DPI transform
      }
      requestAnimationFrame(loop);
    };

    const animFrame = requestAnimationFrame(loop);
    return () => {
      activeRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      Matter.Engine.clear(engine);
      Matter.Runner.stop(runner);
      cancelAnimationFrame(animFrame);
    };
  }, [gameId]);

  // Use refs instead of stale state inside event handlers
  const onInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isGameOverRef.current) return;
    // Prevent default touch scrolling while dragging
    if ('touches' in e) e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const scaledX = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const config = FRUIT_LEVELS[currentFruitTypeRef.current];
    inputXRef.current = Math.max(config.radius, Math.min(CANVAS_WIDTH - config.radius, scaledX));
  };

  const onInteractionEnd = () => {
    if (isGameOverRef.current) return;
    const now = Date.now();
    if (now - lastSpawnTimeRef.current < 500) return;
    const fruit = spawnFruit(currentFruitTypeRef.current, inputXRef.current, SPAWN_Y);
    if (fruit) {
      lastSpawnTimeRef.current = now;
      const next = nextFruitTypeRef.current;
      setCurrentFruitType(next);
      currentFruitTypeRef.current = next;
      const newNext = Math.floor(Math.random() * 4);
      setNextFruitType(newNext);
      nextFruitTypeRef.current = newNext;
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header container for Score and Next */}
      <div className="w-full px-2 mb-2 shrink-0 flex flex-col gap-1">
        <Scoreboard score={score} bestScore={bestScore} darkMode={darkMode} />
        <div className="flex justify-between items-center">
          <NextFruitIndicator nextType={nextFruitType} loadedTextures={loadedTextures} darkMode={darkMode} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                localStorage.setItem('suika-sound', String(next));
              }}
              className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", darkMode ? "bg-slate-600 hover:bg-slate-500" : "bg-slate-200 hover:bg-slate-300")}
            >
              {soundEnabled ? <Volume2 size={18} className="text-slate-700" /> : <VolumeX size={18} className="text-slate-400" />}
            </button>
            <button
              onClick={() => setDarkMode((d) => !d)}
              className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", darkMode ? "bg-slate-600 hover:bg-slate-500" : "bg-slate-200 hover:bg-slate-300")}
            >
              {darkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-slate-600" />}
            </button>
          </div>
        </div>
      </div>

       <div className="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden">
         <div className={cn("relative aspect-[400/600] max-h-full rounded-3xl overflow-hidden shadow-2xl border-4 transition-colors", darkMode ? "bg-[#3a3a52] border-[#4a4a62]" : "bg-[#d4e6f1] border-[#b8d4e3]")}>
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

      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="text-8xl font-black text-red-500/80 animate-pulse drop-shadow-lg">
            {countdown}
          </div>
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

      {isWin && (
        <div className="absolute inset-0 bg-[#d4af37]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white z-50">
          <span className="text-6xl mb-4">👑</span>
          <span className="text-5xl font-black mb-2 uppercase tracking-tight">You Win!</span>
          <span className="text-lg opacity-90 mb-2 font-medium">King Suika Evolved!</span>
          <span className="text-xl font-bold mb-8">Final Score: {score}</span>
          <button onClick={startNewGame} className="flex items-center gap-3 bg-white text-[#d4af37] px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-slate-50 transition-colors active:scale-95">
            <RefreshCw size={24} />
            Play Again
          </button>
        </div>
      )}

      <EvolutionBar score={score} loadedTextures={loadedTextures} darkMode={darkMode} />
    </div>
  );
}