'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Character, InteractResponse } from '@/types';
import { useGameStore, selectHealthPercent, selectSpiritPercent, selectXPProgress } from '@/lib/store';
import { characters, createWebSocket } from '@/lib/api';
import {
  Heart, Sparkles, Swords, Map, Backpack, MessageSquare,
  ChevronRight, LogOut, User, Shield, Zap, TreePine, Castle,
  Coins, Star, TrendingUp, Menu, X, Settings, Info,
  Mountain, Compass, Skull, Package, Users
} from 'lucide-react';

interface GameUIProps {
  character: Character;
  onLogout: () => void;
}

export default function GameUI({ character, onLogout }: GameUIProps) {
  const {
    setCharacter, currentEvent, setCurrentEvent,
    events, setEvents, chatMessages, setChatMessages,
    isLoading, setLoading, activeTab, setActiveTab,
  } = useGameStore();

  const [showMenu, setShowMenu] = useState(false);
  const [dealerType, setDealerType] = useState('npc');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = createWebSocket(character.id, (data: unknown) => {
      const msg = data as { type: string; data: unknown };
      if (msg.type === 'event') {
        const event = msg.data as InteractResponse;
        setCurrentEvent(event);
        setCharacter(event.character);
      }
    });
    wsRef.current = ws;
    characters.events(character.id).then(setEvents).catch(console.error);
    characters.chat(character.id).then(setChatMessages).catch(console.error);
    return () => { ws.close(); };
  }, [character.id]);

  const handleInteract = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await characters.interact(character.id, 'npc_1', dealerType);
      setCurrentEvent(resp);
      setCharacter(resp.character);
    } catch (err) {
      console.error('Interact failed:', err);
    } finally {
      setLoading(false);
    }
  }, [character.id, dealerType, setCurrentEvent, setCharacter, setLoading]);

  const healthPercent = useGameStore(selectHealthPercent);
  const spiritPercent = useGameStore(selectSpiritPercent);
  const xpProgress = useGameStore(selectXPProgress);

  const rarityColors: Record<string, string> = {
    common: 'text-gray-400', uncommon: 'text-green-400',
    rare: 'text-blue-400', epic: 'text-purple-400', legendary: 'text-orange-400',
  };
  const rarityBg: Record<string, string> = {
    common: 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
    uncommon: 'from-green-500/20 to-green-600/20 border-green-500/30',
    rare: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    epic: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    legendary: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
  };
  const regionNames: Record<string, string> = {
    starting_village: '初始村庄', forest: '迷雾森林', mountain: '羊蹄山',
    ruins: '古代遗迹', town: '边境小镇', dungeon: '地下城',
  };

  const dealers = [
    { id: 'npc', label: 'NPC对话', icon: <Users className="w-4 h-4" />, c: 'text-blue-400', ab: 'bg-blue-500/20', bb: 'border-blue-500/60', ib: 'bg-blue-500/10', oib: 'border-blue-500/30' },
    { id: 'board', label: '悬赏板', icon: <Map className="w-4 h-4" />, c: 'text-amber-400', ab: 'bg-amber-500/20', bb: 'border-amber-500/60', ib: 'bg-amber-500/10', oib: 'border-amber-500/30' },
    { id: 'camp', label: '营地', icon: <TreePine className="w-4 h-4" />, c: 'text-emerald-400', ab: 'bg-emerald-500/20', bb: 'border-emerald-500/60', ib: 'bg-emerald-500/10', oib: 'border-emerald-500/30' },
    { id: 'merchant', label: '商人', icon: <Coins className="w-4 h-4" />, c: 'text-yellow-400', ab: 'bg-yellow-500/20', bb: 'border-yellow-500/60', ib: 'bg-yellow-500/10', oib: 'border-yellow-500/30' },
  ];

  const cardTypeStyle: Record<string, string> = {
    main_story: 'bg-red-500/20 text-red-400 border-red-500/40',
    side_story: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    discovery: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    growth: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    challenge: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    mood: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    empty: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Atmospheric layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-40 opacity-[0.07]">
          <svg viewBox="0 0 1440 200" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,200 L180,90 L360,140 L540,50 L720,110 L900,30 L1080,90 L1260,60 L1440,100 L1440,200 Z" fill="currentColor" className="text-amber-500"/>
          </svg>
        </div>
        {[...Array(15)].map((_, i) => (
          <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-amber-400/20"
            style={{ left: `${(i * 7 + 3) % 100}%`, top: `${(i * 13 + 8) % 75}%` }}
            animate={{ y: [-12, 12, -12], opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 3.5 + i * 0.2, repeat: Infinity, delay: i * 0.15 }} />
        ))}
        <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-amber-500/[0.03] blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full bg-blue-500/[0.03] blur-3xl" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 h-16 px-5 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/25 rounded-full blur-md animate-pulse" />
            <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-amber-400 text-lg leading-tight">{character.name}</h2>
            <p className="text-xs text-slate-500">{character.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/35">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-bold text-sm">Lv.{character.level}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/25">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 font-semibold text-sm">{character.gold}</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
            <span className="text-emerald-400"><Mountain className="w-3.5 h-3.5" /></span>
            <span className="text-emerald-300 text-sm">{regionNames[character.current_region] || character.current_region}</span>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
            {showMenu ? <X className="w-5 h-5 text-slate-300" /> : <Menu className="w-5 h-5 text-slate-300" />}
          </button>
        </div>
      </header>

      {/* Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="absolute right-5 top-16 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-1">
              <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700/50 text-left text-slate-300 transition-colors rounded-lg"><Settings className="w-4 h-4 text-slate-400" /> 设置</button>
              <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700/50 text-left text-slate-300 transition-colors rounded-lg"><Info className="w-4 h-4 text-slate-400" /> 关于游戏</button>
            </div>
            <div className="border-t border-slate-700/50 p-1">
              <button onClick={onLogout} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 text-left text-red-400 transition-colors rounded-lg"><LogOut className="w-4 h-4" /> 退出登录</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-64 bg-slate-900/50 backdrop-blur-md border-r border-slate-700/30 p-4 space-y-4 overflow-y-auto scrollbar-thin">
          {/* HP */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-red-400"><Heart className="w-4 h-4" /><span className="font-medium">生命</span></div>
              <span className="text-slate-300 font-mono text-xs">{character.health.current}/{character.health.max}</span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner"><motion.div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" animate={{ width: `${healthPercent}%` }} transition={{ duration: 0.5 }} /></div>
          </div>
          {/* SP */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-blue-400"><Sparkles className="w-4 h-4" /><span className="font-medium">精神</span></div>
              <span className="text-slate-300 font-mono text-xs">{character.spirit.current}/{character.spirit.max}</span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner"><motion.div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" animate={{ width: `${spiritPercent}%` }} transition={{ duration: 0.5 }} /></div>
          </div>
          {/* XP */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-amber-400"><TrendingUp className="w-4 h-4" /><span className="font-medium">经验</span></div>
              <span className="text-slate-300 font-mono text-xs">{character.xp}/{character.level * 100}</span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner"><motion.div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" animate={{ width: `${xpProgress}%` }} transition={{ duration: 0.5 }} /></div>
          </div>

          {/* Attributes */}
          <div className="pt-4 border-t border-slate-700/40">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3">属性</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { l: '力量', v: character.strength, i: Swords, c: 'text-red-400', bg: 'bg-red-500/10' },
                { l: '智力', v: character.intelligence, i: Sparkles, c: 'text-blue-400', bg: 'bg-blue-500/10' },
                { l: '魅力', v: character.charisma, i: Heart, c: 'text-pink-400', bg: 'bg-pink-500/10' },
                { l: '敏捷', v: character.agility, i: Zap, c: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              ].map(({ l, v, i: Icon, c, bg }) => (
                <div key={l} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg ${bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${c}`} /><span className="text-slate-500 text-[11px]">{l}</span><span className="ml-auto text-white font-bold text-sm">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deck */}
          <div className="pt-4 border-t border-slate-700/40">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3">事件卡组</h3>
            <div className="flex gap-1 flex-wrap">
              {character.deck_state.cards.slice(0, 8).map((card, i) => (
                <motion.div key={card.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }}
                  className="w-7 h-9 rounded-md bg-gradient-to-b from-amber-600 to-amber-800 border border-amber-500/50 shadow-md flex items-center justify-center"
                  title={card.name}>
                  <span className="text-[7px] text-amber-200 font-bold">{card.type.slice(0, 3).toUpperCase()}</span>
                </motion.div>
              ))}
              {character.deck_state.cards.length > 8 && <div className="w-7 h-9 rounded-md bg-slate-700/50 border border-slate-600/30 flex items-center justify-center"><span className="text-[7px] text-slate-400">+{character.deck_state.cards.length - 8}</span></div>}
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5">第{character.deck_state.cycle_count + 1}轮 · 剩余{character.deck_state.cards.length - character.deck_state.current_index}张</p>
          </div>

          {/* Quick */}
          <div className="pt-4 border-t border-slate-700/40 space-y-1.5">
            <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-2">快捷</h3>
            <button onClick={() => setActiveTab('inventory')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 text-slate-300 text-xs transition-colors">
              <Package className="w-3.5 h-3.5 text-amber-400" />背包 <span className="ml-auto text-slate-500">{character.inventory.length}</span>
            </button>
            <button onClick={() => setActiveTab('map')} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 text-slate-300 text-xs transition-colors">
              <Map className="w-3.5 h-3.5 text-emerald-400" />探索 <span className="ml-auto text-slate-500">{character.discovered_locations.length}</span>
            </button>
          </div>
        </aside>

        {/* Center */}
        <main className="flex-1 flex flex-col relative">
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
            <AnimatePresence mode="wait">
              {currentEvent ? (
                <motion.div key="event" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="mb-5">
                  {/* Card badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cardTypeStyle[currentEvent.card.type] || cardTypeStyle.empty}`}>{currentEvent.card.name}</span>
                    {currentEvent.card.is_urgent && <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/40 font-medium animate-pulse">⚡ 紧急</span>}
                    <span className="text-xs text-slate-600 ml-auto font-mono">{currentEvent.card.occurrence_num}/{character.deck_state.cards.length}</span>
                  </div>

                  {/* Dialogue */}
                  {currentEvent.content.dialogue && (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                      className="bg-slate-800/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/40 mb-4 shadow-xl">
                      <div className="flex items-start gap-4">
                        <div className="relative flex-shrink-0">
                          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-lg" />
                          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg">
                            <User className="w-7 h-7 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 pt-1.5">
                          <p className="text-slate-200 leading-relaxed text-lg font-light">{currentEvent.content.dialogue}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Scene */}
                  {currentEvent.content.scene && (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                      className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/30 mb-4">
                      <p className="text-slate-400 italic leading-relaxed text-sm">{currentEvent.content.scene}</p>
                    </motion.div>
                  )}

                  {/* Item */}
                  {currentEvent.content.item && (
                    <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-4 p-4 bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-700/40 mb-4 shadow-xl">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${rarityBg[currentEvent.content.item.rarity]} border flex items-center justify-center shadow-lg`}>
                        <Backpack className={`w-7 h-7 ${rarityColors[currentEvent.content.item.rarity]}`} />
                      </div>
                      <div>
                        <p className={`font-semibold text-lg ${rarityColors[currentEvent.content.item.rarity]}`}>{currentEvent.content.item.name}</p>
                        <p className="text-sm text-slate-400">{currentEvent.content.item.description}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* State changes */}
                  {Object.keys(currentEvent.state_changes).length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(currentEvent.state_changes).map(([k, v]) => (
                        <motion.span key={k} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                          className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs border border-emerald-500/30 font-medium">
                          {k} +{String(v)}
                        </motion.span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center py-12">
                  <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative mb-8">
                    <div className="absolute inset-0 bg-amber-500/15 rounded-full blur-2xl animate-pulse" />
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/60 flex items-center justify-center shadow-2xl">
                      <Mountain className="w-14 h-14 text-amber-500/50" />
                    </div>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-slate-100 mb-3 tracking-tight">探索<span className="text-amber-400">羊蹄山</span>之魂</h2>
                  <p className="text-slate-500 max-w-md leading-relaxed text-sm mb-1">选择下方交互方式，开启你的冒险</p>
                  <p className="text-slate-600 text-xs">每次互动从卡组抽牌，驱动故事发展</p>
                  <div className="flex items-center gap-3 mt-8">
                    <div className="w-14 h-px bg-gradient-to-r from-transparent to-slate-700" />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                    <div className="w-14 h-px bg-gradient-to-l from-transparent to-slate-700" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action bar */}
          <div className="p-4 border-t border-slate-700/40 bg-slate-900/50 backdrop-blur-md">
            <div className="flex gap-2 mb-3">
              {dealers.map(({ id, label, icon, c, ab, bb, ib, oib }) => (
                <button key={id} onClick={() => setDealerType(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all text-xs font-semibold ${
                    dealerType === id ? `${ab} ${bb} ${c}` : `${ib} ${oib} text-slate-400`
                  }`}>
                  {icon}<span>{label}</span>
                </button>
              ))}
            </div>
            <motion.button onClick={handleInteract} disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }} whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 rounded-xl text-white font-bold text-lg
                shadow-lg shadow-amber-500/25 hover:from-amber-500 hover:via-orange-500 hover:to-amber-500
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all">
              {isLoading ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /><span>抽牌中...</span></>
              ) : (
                <><Swords className="w-5 h-5" /><span>与{dealers.find(d => d.id === dealerType)?.label}互动</span><ChevronRight className="w-5 h-5" /></>
              )}
            </motion.button>
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="w-72 bg-slate-900/50 backdrop-blur-md border-l border-slate-700/30 flex flex-col">
          <div className="flex border-b border-slate-700/40">
            {[
              { id: 'inventory', l: '背包', i: <Backpack className="w-4 h-4" /> },
              { id: 'quests', l: '任务', i: <Map className="w-4 h-4" /> },
              { id: 'map', l: '地图', i: <Mountain className="w-4 h-4" /> },
              { id: 'social', l: '社交', i: <Users className="w-4 h-4" /> },
            ].map(({ id, l, i }) => (
              <button key={id} onClick={() => setActiveTab(id as 'inventory' | 'quests' | 'map' | 'social')}
                className={`flex-1 py-3 flex flex-col items-center gap-1 text-[11px] transition-colors ${
                  activeTab === id ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-500/5' : 'text-slate-500 hover:text-slate-300'
                }`}>{i}<span>{l}</span></button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            {activeTab === 'inventory' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-500">物品栏</h3>
                  <span className="text-[10px] text-slate-600">{character.inventory.length}件</span>
                </div>
                {character.inventory.length === 0 ? (
                  <div className="text-center py-10 text-slate-600"><Backpack className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">背包空空</p></div>
                ) : character.inventory.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 hover:border-slate-600/50 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.equipped ? 'bg-amber-500/15' : 'bg-slate-700/50'}`}>
                      <Backpack className={`w-5 h-5 ${rarityColors[item.rarity]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`font-semibold text-sm truncate ${rarityColors[item.rarity]}`}>{item.name}</p>
                        {item.equipped && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">已装备</span>}
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'quests' && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-500 mb-2">进行中的任务</h3>
                {character.active_quests.length === 0 ? (
                  <div className="text-center py-10 text-slate-600"><Map className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">暂无任务</p></div>
                ) : character.active_quests.map((q) => (
                  <div key={q.quest_id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                    <p className="font-semibold text-sm text-slate-200">{q.name}</p>
                    <div className="mt-1.5 h-1.5 bg-slate-700/50 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: `${q.progress * 100}%` }} /></div>
                    <p className="text-[10px] text-slate-600 mt-1">{Math.round(q.progress * 100)}%</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'map' && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 mb-2">已探索区域</h3>
                {character.discovered_locations.map((loc) => (
                  <div key={loc} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
                    <span className="text-emerald-500"><Map className="w-4 h-4" /></span>
                    <span className="text-sm text-slate-300">{regionNames[loc] || loc}</span>
                    {loc === character.current_region && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">当前</span>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-500 mb-2">人际关系</h3>
                {Object.entries(character.relationships).map(([id, rel]) => (
                  <div key={id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-semibold text-sm text-slate-200">{rel.name}</p>
                      <span className={`text-[10px] font-medium ${rel.reputation > 0 ? 'text-emerald-400' : rel.reputation < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {rel.reputation > 0 ? '+' : ''}{rel.reputation}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div className="flex justify-between"><span className="text-slate-600">好感</span><span className="text-slate-300">{rel.affection}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">信任</span><span className="text-slate-300">{rel.trust}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
