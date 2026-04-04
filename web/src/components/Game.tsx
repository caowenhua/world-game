import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameMap, { Monster, Player, DamageNumber, INITIAL_MONSTERS } from './RPGGameMap';

const PLAYER_INITIAL: Player = {
  x: 5,
  y: 5,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  level: 1,
  exp: 0,
  attack: 25,
  attackCooldown: 0,
  invincible: 0,
};

const ATTACK_RANGE = 1.5;
const SKILL1_RANGE = 2;
const SKILL2_RANGE = 3;
const MONSTER_CHASE_RANGE = 5;
const MONSTER_ATTACK_RANGE = 1.2;
const PLAYER_DODGE_DISTANCE = 2;

let damageIdCounter = 0;

export const Game: React.FC = () => {
  const [player, setPlayer] = useState<Player>(PLAYER_INITIAL);
  const [monsters, setMonsters] = useState<Monster[]>(() => 
    INITIAL_MONSTERS.map(m => ({
      ...m,
      state: 'patrol' as const,
      patrolDir: { dx: Math.random() > 0.5 ? 1 : -1, dy: 0 },
      patrolTimer: 0,
      attackCooldown: 0,
    }))
  );
  const [damages, setDamages] = useState<DamageNumber[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'gameover' | 'victory'>('playing');
  
  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const addDamage = useCallback((x: number, y: number, value: number, isPlayer: boolean) => {
    const id = damageIdCounter++;
    setDamages(prev => [...prev, { id, x, y, value, isPlayer, timer: 30 }]);
  }, []);

  const handlePlayerMove = useCallback((dx: number, dy: number) => {
    if (gameStatus !== 'playing') return;
    setPlayer(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, [gameStatus]);

  const handlePlayerAttack = useCallback(() => {
    if (gameStatus !== 'playing') return;
    
    setPlayer(prev => {
      if (prev.attackCooldown > 0) return prev;
      return { ...prev, attackCooldown: 15 };
    });

    setMonsters(prev => {
      let expGain = 0;
      const updated = prev.map(monster => {
        if (monster.hp <= 0) return monster;
        const dist = Math.sqrt(
          Math.pow(monster.x - player.x, 2) + 
          Math.pow(monster.y - player.y, 2)
        );
        if (dist <= ATTACK_RANGE) {
          const damage = Math.max(1, player.attack - monster.defense + Math.floor(Math.random() * 10) - 5);
          const newHp = monster.hp - damage;
          addDamage(monster.x, monster.y, damage, false);
          if (newHp <= 0) expGain += 10;
          return { ...monster, hp: newHp };
        }
        return monster;
      });
      if (expGain > 0) {
        setPlayer(p => ({ ...p, exp: p.exp + expGain }));
      }
      return updated.filter(m => m.hp > 0);
    });
  }, [player.x, player.y, player.attack, gameStatus, addDamage]);

  const handlePlayerSkill1 = useCallback(() => {
    if (gameStatus !== 'playing') return;
    
    setPlayer(prev => {
      if (prev.mp < 15) return prev;
      return { ...prev, mp: prev.mp - 15, attackCooldown: 20 };
    });

    setMonsters(prev => {
      let expGain = 0;
      const updated = prev.map(monster => {
        if (monster.hp <= 0) return monster;
        const dist = Math.sqrt(
          Math.pow(monster.x - player.x, 2) + 
          Math.pow(monster.y - player.y, 2)
        );
        if (dist <= SKILL1_RANGE) {
          const damage = Math.max(1, Math.floor(player.attack * 1.5) - monster.defense);
          const newHp = monster.hp - damage;
          addDamage(monster.x, monster.y, damage, false);
          if (newHp <= 0) expGain += 10;
          return { ...monster, hp: newHp };
        }
        return monster;
      });
      if (expGain > 0) {
        setPlayer(p => ({ ...p, exp: p.exp + expGain }));
      }
      return updated.filter(m => m.hp > 0);
    });
  }, [player.x, player.y, player.attack, gameStatus, addDamage]);

  const handlePlayerSkill2 = useCallback(() => {
    if (gameStatus !== 'playing') return;
    
    setPlayer(prev => {
      if (prev.mp < 20) return prev;
      return { ...prev, mp: prev.mp - 20, attackCooldown: 30 };
    });

    setMonsters(prev => {
      let targetId: number | null = null;
      let targetX = 0, targetY = 0, targetDef = 0;
      let minDist = Infinity;

      for (const monster of prev) {
        if (monster.hp <= 0) continue;
        const dist = Math.sqrt(
          Math.pow(monster.x - player.x, 2) + 
          Math.pow(monster.y - player.y, 2)
        );
        if (dist < minDist && dist <= SKILL2_RANGE) {
          minDist = dist;
          targetId = monster.id;
          targetX = monster.x;
          targetY = monster.y;
          targetDef = monster.defense;
        }
      }

      if (targetId !== null) {
        const damage = Math.max(1, Math.floor(player.attack * 2.5) - targetDef);
        addDamage(targetX, targetY, damage, false);
        
        return prev.map(m => {
          if (m.id === targetId) {
            const newHp = m.hp - damage;
            if (newHp <= 0) {
              setPlayer(p => ({ ...p, exp: p.exp + 15 }));
            }
            return { ...m, hp: newHp };
          }
          return m;
        }).filter(m => m.hp > 0);
      }
      return prev;
    });
  }, [player.x, player.y, player.attack, gameStatus, addDamage]);

  const handlePlayerDodge = useCallback(() => {
    if (gameStatus !== 'playing') return;
    
    const dirs = [
      { dx: -PLAYER_DODGE_DISTANCE, dy: 0 },
      { dx: PLAYER_DODGE_DISTANCE, dy: 0 },
      { dx: 0, dy: -PLAYER_DODGE_DISTANCE },
      { dx: 0, dy: PLAYER_DODGE_DISTANCE },
    ];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    
    setPlayer(prev => ({ 
      ...prev, 
      x: Math.max(1, Math.min(18, prev.x + dir.dx)),
      y: Math.max(1, Math.min(13, prev.y + dir.dy)),
      invincible: 20,
    }));
  }, [gameStatus]);

  const handleMonsterMove = useCallback((id: number, x: number, y: number) => {
    setMonsters(prev => prev.map(m => m.id === id ? { ...m, x, y } : m));
  }, []);

  const handleMonsterHit = useCallback((id: number, damage: number) => {
    // handled in monster update
  }, []);

  const handleMonsterDie = useCallback((id: number) => {
    setMonsters(prev => prev.filter(m => m.id !== id));
  }, []);

  const handlePlayerHit = useCallback((damage: number) => {
    addDamage(player.x, player.y, damage, true);
  }, [player.x, player.y, addDamage]);

  // 游戏主循环
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const gameLoop = () => {
      // 更新伤害数字
      setDamages(prev => prev.map(d => ({ ...d, timer: d.timer - 1 })).filter(d => d.timer > 0));

      // 更新玩家状态
      setPlayer(prev => ({
        ...prev,
        attackCooldown: Math.max(0, prev.attackCooldown - 1),
        invincible: Math.max(0, prev.invincible - 1),
      }));

      // 怪物AI
      setMonsters(prev => {
        return prev.map(monster => {
          if (monster.hp <= 0) return monster;
          
          const distToPlayer = Math.sqrt(
            Math.pow(monster.x - player.x, 2) + 
            Math.pow(monster.y - player.y, 2)
          );
          
          let newState: 'patrol' | 'chase' | 'attack' = monster.state;
          let newX = monster.x;
          let newY = monster.y;
          let newPatrolDir = monster.patrolDir;
          let newPatrolTimer = monster.patrolTimer;
          let newAttackCooldown = monster.attackCooldown - 1;
          
          // 状态切换
          if (distToPlayer <= MONSTER_ATTACK_RANGE) {
            newState = 'attack';
          } else if (distToPlayer <= MONSTER_CHASE_RANGE) {
            newState = 'chase';
          } else {
            newState = 'patrol';
          }
          
          // 攻击玩家
          if (newState === 'attack' && newAttackCooldown <= 0) {
            const damage = Math.max(1, monster.attack - 5 + Math.floor(Math.random() * 10));
            setPlayer(p => {
              if (p.invincible > 0) return p;
              const newHp = p.hp - damage;
              if (newHp <= 0) {
                setGameStatus('gameover');
              }
              return { ...p, hp: Math.max(0, newHp) };
            });
            addDamage(player.x, player.y, damage, true);
            newAttackCooldown = 40;
          }
          
          // 追逐
          if (newState === 'chase') {
            const dx = player.x - monster.x;
            const dy = player.y - monster.y;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0.5) {
              newX += Math.sign(dx) * 0.3;
            } else if (Math.abs(dy) > 0.5) {
              newY += Math.sign(dy) * 0.3;
            }
          }
          
          // 巡逻
          if (newState === 'patrol') {
            newPatrolTimer++;
            if (newPatrolTimer > 60) {
              newPatrolTimer = 0;
              newPatrolDir = { 
                dx: Math.random() > 0.5 ? 1 : -1, 
                dy: Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0 
              };
            }
            newX += newPatrolDir.dx * 0.15;
            newY += newPatrolDir.dy * 0.15;
          }
          
          newX = Math.max(1, Math.min(18, newX));
          newY = Math.max(1, Math.min(13, newY));
          
          return {
            ...monster,
            x: newX,
            y: newY,
            state: newState,
            patrolDir: newPatrolDir,
            patrolTimer: newPatrolTimer,
            attackCooldown: newAttackCooldown,
          };
        });
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStatus, player.x, player.y, addDamage]);

  // 检查胜利
  useEffect(() => {
    if (gameStatus === 'playing' && monsters.filter(m => m.hp > 0).length === 0) {
      setGameStatus('victory');
    }
  }, [monsters, gameStatus]);

  const handleRestart = () => {
    setPlayer(PLAYER_INITIAL);
    setMonsters(INITIAL_MONSTERS.map(m => ({
      ...m,
      state: 'patrol' as const,
      patrolDir: { dx: Math.random() > 0.5 ? 1 : -1, dy: 0 },
      patrolTimer: 0,
      attackCooldown: 0,
    })));
    setDamages([]);
    setGameStatus('playing');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-yellow-400 mb-4">
        🎮 原神风即时战斗
      </h1>
      
      {gameStatus === 'gameover' && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <h2 className="text-5xl font-bold text-red-500 mb-8">💀 挑战失败</h2>
          <p className="text-white text-xl mb-8">你的队伍全灭了...</p>
          <button
            onClick={handleRestart}
            className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 rounded-xl text-white text-xl font-bold"
          >
            重新挑战
          </button>
        </div>
      )}
      
      {gameStatus === 'victory' && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <h2 className="text-5xl font-bold text-yellow-400 mb-8">🏆 战斗胜利!</h2>
          <p className="text-white text-xl mb-4">获得经验: +{player.exp}</p>
          <button
            onClick={handleRestart}
            className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-xl text-white text-xl font-bold"
          >
            再来一局
          </button>
        </div>
      )}
      
      <GameMap
        player={player}
        monsters={monsters}
        damages={damages}
        onPlayerMove={handlePlayerMove}
        onPlayerAttack={handlePlayerAttack}
        onPlayerSkill1={handlePlayerSkill1}
        onPlayerSkill2={handlePlayerSkill2}
        onPlayerDodge={handlePlayerDodge}
        onMonsterMove={handleMonsterMove}
        onMonsterHit={handleMonsterHit}
        onMonsterDie={handleMonsterDie}
        onPlayerHit={handlePlayerHit}
      />
      
      <div className="mt-4 text-gray-400 text-center max-w-md">
        <p>🔵 你是蓝色圆点 | 🔴👺🐺 是敌人，会追你</p>
        <p className="mt-1">靠近敌人自动攻击你，用技能消灭它们!</p>
      </div>
    </div>
  );
};

export default Game;
