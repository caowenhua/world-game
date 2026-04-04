'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// 地形颜色
const TERRAIN_COLORS: Record<number, { base: string; detail: string }> = {
  0: { base: '#4a7c3f', detail: '#5a9c4f' },
  1: { base: '#c4a882', detail: '#d4b892' },
  2: { base: '#5a5a6a', detail: '#4a4a5a' },
  3: { base: '#3a6a9f', detail: '#2a5a8f' },
  4: { base: '#2d5a27', detail: '#1d4a17' },
};

// 剧情对话
const STORY = [
  { speaker: '旁白', title: '', content: '西境王国边境，羊蹄山脚下。\n一个流浪剑客踏上这片神秘的土地...' },
  { speaker: '神秘声音', title: '???', content: '觉醒者...你终于来了。\n羊蹄山之魂在呼唤你。' },
  { speaker: '哨兵队长', title: '边境哨站', content: '站住！你是新来的冒险者？\n最近城外不太平，小心怪物。' },
  { speaker: '哨兵队长', title: '边境哨站', content: '在镇子里是安全的。\n去草地打怪练级吧，记住先在小怪身上练习！' },
];

export default function ImprovedRPG() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'story' | 'playing' | 'gameover' | 'victory'>('story');
  const [storyIdx, setStoryIdx] = useState(0);
  const [showText, setShowText] = useState('');
  const [typingDone, setTypingDone] = useState(false);

  // 玩家
  const [player, setPlayer] = useState({
    x: 50, y: 50, hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    level: 1, exp: 0, atk: 25, cooldown: 0, facing: 'down' as 'up' | 'down' | 'left' | 'right',
    isAttacking: false
  });

  // 摄像机
  const [camera, setCamera] = useState({ x: 40, y: 40 });

  // 怪物
  const [monsters, setMonsters] = useState<Array<{
    id: number; x: number; y: number; hp: number; maxHp: number; name: string;
    atk: number; color: string; state: 'patrol' | 'chase' | 'attack' | 'dead'; dir: number; cd: number;
  }>>([
    { id: 1, x: 55, y: 45, hp: 40, maxHp: 40, name: '史莱姆', atk: 8, color: '#7bed9f', state: 'patrol', dir: 1, cd: 0 },
    { id: 2, x: 58, y: 48, hp: 50, maxHp: 50, name: '灰狼', atk: 12, color: '#a4a4a4', state: 'patrol', dir: -1, cd: 0 },
    { id: 3, x: 45, y: 40, hp: 35, maxHp: 35, name: '哥布林', atk: 10, color: '#6ab04c', state: 'patrol', dir: 1, cd: 0 },
  ]);

  // 伤害飘字
  const [damages, setDamages] = useState<{ id: number; x: number; y: number; v: number; p: boolean; t: number }[]>([]);
  const didRef = useRef(0);

  // 地图 (100x100)
  const mapData = useRef<number[][]>(createMap());

  function createMap(): number[][] {
    const m: number[][] = [];
    for (let y = 0; y < 100; y++) {
      const row: number[] = [];
      for (let x = 0; x < 100; x++) {
        if (x === 0 || y === 0 || x === 99 || y === 99) row.push(2);
        else if (x >= 45 && x <= 55 && y >= 45 && y <= 55) row.push(1);
        else {
          const r = Math.random();
          row.push(r < 0.75 ? 0 : r < 0.9 ? 4 : 2);
        }
      }
      m.push(row);
    }
    return m;
  }

  const keysRef = useRef<Set<string>>(new Set());
  const lastRef = useRef(0);

  // 打字效果
  useEffect(() => {
    if (gameState !== 'story') return;
    const txt = STORY[storyIdx].content;
    let i = 0;
    setShowText('');
    setTypingDone(false);
    const t = setInterval(() => {
      if (i < txt.length) {
        setShowText(txt.slice(0, ++i));
      } else {
        setTypingDone(true);
        clearInterval(t);
      }
    }, 40);
    return () => clearInterval(t);
  }, [storyIdx, gameState]);

  // 键盘
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === 'j') attack();
      if (e.key === 'k') skill1();
      if (e.key === ' ') dodge();
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [player]);

  const addDmg = useCallback((x: number, y: number, v: number, p: boolean) => {
    setDamages(d => [...d, { id: didRef.current++, x, y, v, p, t: 50 }]);
  }, []);

  const attack = useCallback(() => {
    if (player.cooldown > 0) return;
    setPlayer(p => ({ ...p, cooldown: 25, isAttacking: true }));
    setTimeout(() => setPlayer(p => ({ ...p, isAttacking: false })), 300);
    setMonsters(mons => mons.map(m => {
      if (m.state === 'dead') return m;
      const dx = Math.abs(m.x - player.x), dy = Math.abs(m.y - player.y);
      if (dx <= 1.5 && dy <= 1.5) {
        const nh = m.hp - player.atk;
        addDmg(m.x, m.y, player.atk, false);
        return { ...m, hp: nh, state: nh <= 0 ? 'dead' : m.state };
      }
      return m;
    }));
  }, [player, addDmg]);

  const skill1 = useCallback(() => {
    if (player.mp < 20 || player.cooldown > 0) return;
    setPlayer(p => ({ ...p, mp: p.mp - 20, cooldown: 40 }));
    setMonsters(mons => mons.map(m => {
      if (m.state === 'dead') return m;
      const dx = Math.abs(m.x - player.x), dy = Math.abs(m.y - player.y);
      if (dx <= 3 && dy <= 3) {
        const nh = m.hp - 40;
        addDmg(m.x, m.y, 40, false);
        return { ...m, hp: nh, state: nh <= 0 ? 'dead' : m.state };
      }
      return m;
    }));
  }, [player, addDmg]);

  const dodge = useCallback(() => {
    if (player.cooldown > 0) return;
    const dirs = player.facing === 'up' ? [0, -2] : player.facing === 'down' ? [0, 2] : player.facing === 'left' ? [-2, 0] : [2, 0];
    let nx = player.x + dirs[0], ny = player.y + dirs[1];
    nx = Math.max(1, Math.min(98, nx));
    ny = Math.max(1, Math.min(98, ny));
    if (mapData.current[ny][nx] !== 2) {
      setPlayer(p => ({ ...p, x: nx, y: ny, cooldown: 30 }));
    }
  }, [player]);

  // 游戏循环
  useEffect(() => {
    if (gameState !== 'playing') return;
    let raf: number;
    const loop = (time: number) => {
      if (!lastRef.current) lastRef.current = time;
      const dt = time - lastRef.current;
      if (dt >= 100) {
        lastRef.current = time;
        let dx = 0, dy = 0;
        if (keysRef.current.has('w') || keysRef.current.has('arrowup')) { dy = -1; setPlayer(p => ({ ...p, facing: 'up' })); }
        if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) { dy = 1; setPlayer(p => ({ ...p, facing: 'down' })); }
        if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) { dx = -1; setPlayer(p => ({ ...p, facing: 'left' })); }
        if (keysRef.current.has('d') || keysRef.current.has('arrowright')) { dx = 1; setPlayer(p => ({ ...p, facing: 'right' })); }
        if (dx || dy) {
          setPlayer(p => {
            let nx = p.x + dx, ny = p.y + dy;
            nx = Math.max(1, Math.min(98, nx));
            ny = Math.max(1, Math.min(98, ny));
            if (mapData.current[ny][nx] === 2) return p;
            return { ...p, x: nx, y: ny };
          });
        }
        setPlayer(p => ({ ...p, cooldown: Math.max(0, p.cooldown - 1) }));
        setCamera(c => ({
          x: Math.max(0, Math.min(80, player.x - 10)),
          y: Math.max(0, Math.min(85, player.y - 7))
        }));
        setMonsters(mons => mons.map(m => {
          if (m.state === 'dead') return m;
          const pdx = player.x - m.x, pdy = player.y - m.y;
          const dist = Math.sqrt(pdx * pdx + pdy * pdy);
          let nx = m.x, ny = m.y, ns = m.state, ncd = Math.max(0, m.cd - 1);
          if (dist < 6) { ns = 'chase'; }
          else if (dist > 10) { ns = 'patrol'; }
          if (ns === 'chase' && mapData.current[Math.floor(m.y + pdy / dist * 0.5)][Math.floor(m.x + pdx / dist * 0.5)] !== 2) {
            nx = m.x + pdx / dist * 0.4;
            ny = m.y + pdy / dist * 0.4;
          }
          if (ns === 'patrol') {
            nx = m.x + m.dir * 0.3;
            if (mapData.current[Math.floor(m.y)][Math.floor(nx)] === 2) { nx = m.x; }
          }
          if (dist < 1.2 && ncd <= 0) {
            addDmg(player.x, player.y, m.atk, true);
            setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - m.atk) }));
            ncd = 50;
          }
          return { ...m, x: nx, y: ny, state: ns, cd: ncd };
        }));
        setDamages(d => d.filter(x => { x.t--; x.y -= 0.3; return x.t > 0; }));
        if (player.hp <= 0) setGameState('gameover');
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameState, player.x, player.y, player.hp, addDmg]);

  // 渲染
  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const W = cvs.width, H = cvs.height;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);
    const TS = 32;
    const ox = -camera.x * TS, oy = -camera.y * TS;
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 25; x++) {
        const mx = Math.floor(camera.x) + x, my = Math.floor(camera.y) + y;
        if (mx < 0 || my < 0 || mx >= 100 || my >= 100) continue;
        const t = mapData.current[my][mx];
        const cols = TERRAIN_COLORS[t] || TERRAIN_COLORS[0];
        ctx.fillStyle = cols.base;
        ctx.fillRect(x * TS + ox, y * TS + oy, TS, TS);
        ctx.fillStyle = cols.detail;
        if (t === 0) { ctx.fillRect(x*TS+ox+6, y*TS+oy+6, 2, 2); ctx.fillRect(x*TS+ox+18, y*TS+oy+14, 2, 2); }
        else if (t === 4) { ctx.fillRect(x*TS+ox+12, y*TS+oy+8, 8, 14); ctx.fillStyle='#3a7a37'; ctx.beginPath(); ctx.arc(x*TS+ox+16, y*TS+oy+12, 10, 0, Math.PI*2); ctx.fill(); }
      }
    }
    monsters.forEach(m => {
      if (m.state === 'dead') return;
      const sx = (m.x - camera.x) * TS + TS/2, sy = (m.y - camera.y) * TS + TS/2;
      if (sx < -TS || sx > W+TS || sy < -TS || sy > H+TS) return;
      ctx.fillStyle = m.color;
      ctx.beginPath(); ctx.arc(sx, sy, 12, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.arc(sx-4, sy-2, 2, 0, Math.PI*2); ctx.arc(sx+4, sy-2, 2, 0, Math.PI*2); ctx.fill();
      const hp = m.hp / m.maxHp;
      ctx.fillStyle = '#333'; ctx.fillRect(sx-15, sy-22, 30, 4);
      ctx.fillStyle = hp > 0.5 ? '#4ade80' : hp > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(sx-15, sy-22, 30*hp, 4);
      if (m.state === 'chase') { ctx.fillStyle='#ff6b6b'; ctx.font='12px sans-serif'; ctx.fillText('!', sx+10, sy-15); }
    });
    const px = (player.x - camera.x) * TS + TS/2, py = (player.y - camera.y) * TS + TS/2;
    if (player.isAttacking) {
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, py, 24, 0, Math.PI*2); ctx.stroke();
    }
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1e40af';
    let ex = 0, ey = 0;
    if (player.facing === 'up') ey = -3; if (player.facing === 'down') ey = 3;
    if (player.facing === 'left') ex = -3; if (player.facing === 'right') ex = 3;
    ctx.beginPath(); ctx.arc(px-4+ex, py-2+ey, 2, 0, Math.PI*2); ctx.arc(px+4+ex, py-2+ey, 2, 0, Math.PI*2); ctx.fill();
    if (player.x >= 45 && player.x <= 55 && player.y >= 45 && player.y <= 55) {
      ctx.fillStyle='rgba(59,130,246,0.2)'; ctx.fillRect(0, 0, W, 24);
      ctx.fillStyle='#fff'; ctx.font='12px sans-serif'; ctx.fillText('🏰 安全区域', 8, 16);
    }
    damages.forEach(d => {
      ctx.fillStyle = d.p ? '#ff6b6b' : '#ffd93d';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`-${d.v}`, (d.x - camera.x) * TS, (d.y - camera.y) * TS);
    });
  }, [player, camera, monsters, damages, gameState]);

  // 剧情界面
  if (gameState === 'story') {
    const cur = STORY[storyIdx];
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-600 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${cur.speaker === '旁白' ? 'bg-gray-700' : cur.speaker === '哨兵队长' ? 'bg-blue-700' : 'bg-purple-800'}`}>
              {cur.speaker === '旁白' ? '📜' : cur.speaker === '哨兵队长' ? 'CY' : 'YT'}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{cur.speaker}</h3>
              {cur.title && <p className="text-slate-400 text-sm">{cur.title}</p>}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-4 mb-6 min-h-[80px]">
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{showText}<span className="animate-pulse">▍</span></p>
          </div>
          <div className="flex gap-1 mb-4 justify-center">
            {STORY.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === storyIdx ? 'bg-amber-400' : i < storyIdx ? 'bg-green-500' : 'bg-slate-600'}`} />)}
          </div>
          <button
            onClick={() => { if (storyIdx < STORY.length - 1) { setStoryIdx(storyIdx + 1); } else { setGameState('playing'); }}}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-colors"
          >
            {storyIdx < STORY.length - 1 ? (typingDone ? '继续 →' : '跳过') : '开始冒险！'}
          </button>
        </div>
      </div>
    );
  }

  // 游戏结束
  if (gameState === 'gameover') {
    return (
      <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">💀 游戏结束</h1>
        <p className="text-slate-300 mb-8">你被怪物击败了...</p>
        <button onClick={() => { setPlayer(p => ({...p, x:50, y:50, hp:100, mp:50})); setMonsters(m => m.map(x => ({...x, hp: x.maxHp, state: 'patrol'}))); setGameState('playing'); }}
          className="px-8 py-3 bg-amber-600 text-white rounded-xl font-bold">
          重新开始
        </button>
      </div>
    );
  }

  // 游戏主界面
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* 顶部状态栏 */}
      <div className="h-14 bg-slate-900/90 border-b border-slate-700 flex items-center px-4 gap-6 z-10">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">👤</span>
          <span className="text-white font-bold">{player.level}级</span>
        </div>
        <div className="flex-1 max-w-[200px]">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>HP</span><span>{player.hp}/{player.maxHp}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all" style={{width: `${player.hp/player.maxHp*100}%`}} />
          </div>
        </div>
        <div className="flex-1 max-w-[150px]">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>MP</span><span>{player.mp}/{player.maxMp}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{width: `${player.mp/player.maxMp*100}%`}} />
          </div>
        </div>
        <div className="text-slate-400 text-sm">EXP: {player.exp}</div>
      </div>

      {/* 地图画布 */}
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} width={800} height={480} className="w-full h-full" />

        {/* 虚拟摇杆（移动） */}
        <div className="absolute bottom-20 left-4 flex flex-col items-center gap-1">
          <button className="w-12 h-12 bg-slate-800/80 rounded-lg flex items-center justify-center text-white text-xl border border-slate-600 active:bg-slate-700"
            onTouchStart={() => keysRef.current.add('w')} onTouchEnd={() => keysRef.current.delete('w')}
            onMouseDown={() => keysRef.current.add('w')} onMouseUp={() => keysRef.current.delete('w')} onMouseLeave={() => keysRef.current.delete('w')}>↑</button>
          <div className="flex gap-1">
            <button className="w-12 h-12 bg-slate-800/80 rounded-lg flex items-center justify-center text-white text-xl border border-slate-600 active:bg-slate-700"
              onTouchStart={() => keysRef.current.add('a')} onTouchEnd={() => keysRef.current.delete('a')}
              onMouseDown={() => keysRef.current.add('a')} onMouseUp={() => keysRef.current.delete('a')} onMouseLeave={() => keysRef.current.delete('a')}>←</button>
            <button className="w-12 h-12 bg-slate-800/80 rounded-lg flex items-center justify-center text-white text-xl border border-slate-600 active:bg-slate-700"
              onTouchStart={() => keysRef.current.add('s')} onTouchEnd={() => keysRef.current.delete('s')}
              onMouseDown={() => keysRef.current.add('s')} onMouseUp={() => keysRef.current.delete('s')} onMouseLeave={() => keysRef.current.delete('s')}>↓</button>
            <button className="w-12 h-12 bg-slate-800/80 rounded-lg flex items-center justify-center text-white text-xl border border-slate-600 active:bg-slate-700"
              onTouchStart={() => keysRef.current.add('d')} onTouchEnd={() => keysRef.current.delete('d')}
              onMouseDown={() => keysRef.current.add('d')} onMouseUp={() => keysRef.current.delete('d')} onMouseLeave={() => keysRef.current.delete('d')}>→</button>
          </div>
        </div>

        {/* 技能按钮 */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-2">
          <button onClick={attack} disabled={player.cooldown > 0}
            className="w-16 h-16 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg active:scale-95 transition-transform">
            <span className="text-xl">⚔️</span>
            <span className="text-[10px]">J攻击</span>
          </button>
          <button onClick={skill1} disabled={player.mp < 20 || player.cooldown > 0}
            className="w-16 h-16 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg active:scale-95 transition-transform">
            <span className="text-xl">🔥</span>
            <span className="text-[10px]">K火焰</span>
          </button>
          <button onClick={dodge}
            className="w-16 h-16 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg active:scale-95 transition-transform">
            <span className="text-xl">💨</span>
            <span className="text-[10px]">空格闪避</span>
          </button>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="h-10 bg-slate-900/90 border-t border-slate-700 flex items-center justify-center gap-8 text-slate-400 text-xs">
        <span>🎮 WASD/方向键移动</span>
        <span>⚔️ J攻击 K技能 空格闪避</span>
        <span>🏰 城镇内无怪物</span>
      </div>
    </div>
  );
}
