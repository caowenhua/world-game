'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Character } from '@/types';
import { characters } from '@/lib/api';
import { User, Plus, Swords, Shield, Heart, Sparkles, LogOut, Crown } from 'lucide-react';

interface CharacterSelectProps {
  onSelect: (character: Character) => void;
  onCreate: () => void;
  onLogout: () => void;
}

export default function CharacterSelect({ onSelect, onCreate, onLogout }: CharacterSelectProps) {
  const [charactersList, setCharactersList] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const chars = await characters.list();
      setCharactersList(chars);
    } catch (err) {
      console.error('Failed to load characters:', err);
    } finally {
      setLoading(false);
    }
  };

  const rarityGlow: Record<string, string> = {
    common: 'from-gray-500/20 to-gray-600/20 border-gray-600/30',
    uncommon: 'from-green-500/20 to-green-600/20 border-green-600/30',
    rare: 'from-blue-500/20 to-blue-600/20 border-blue-600/30',
    epic: 'from-purple-500/20 to-purple-600/20 border-purple-600/30',
    legendary: 'from-orange-500/20 to-orange-600/20 border-orange-600/30',
  };

  return (
    <div className="min-h-screen bg-dark-300">
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between bg-dark-200/80 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-amber-400">选择角色</h2>
            <p className="text-xs text-gray-400">选择你的冒险者</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          退出
        </button>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full"
            />
          </div>
        ) : charactersList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-2 border-amber-500/30 flex items-center justify-center">
              <Swords className="w-12 h-12 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-200 mb-2">还没有角色</h2>
            <p className="text-gray-400 mb-8">创建你的第一个角色，开始冒险</p>
            <motion.button
              onClick={onCreate}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg text-white font-semibold"
            >
              创建角色
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {charactersList.map((char, index) => (
              <motion.div
                key={char.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSelect(char)}
                className={`relative p-6 rounded-2xl bg-gradient-to-br ${rarityGlow.common} cursor-pointer
                         hover:scale-[1.02] transition-transform`}
              >
                {/* Character card */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-100">{char.name}</h3>
                      {char.level >= 10 && <Crown className="w-4 h-4 text-amber-400" />}
                    </div>
                    <p className="text-sm text-gray-400">{char.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{char.background}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded bg-dark-300/50">
                    <div className="flex items-center justify-center gap-1 text-red-400 mb-1">
                      <Heart className="w-3 h-3" />
                      <span className="text-xs font-medium">HP</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-200">{char.health.current}/{char.health.max}</p>
                  </div>
                  <div className="text-center p-2 rounded bg-dark-300/50">
                    <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                      <Shield className="w-3 h-3" />
                      <span className="text-xs font-medium">LV</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-200">{char.level}</p>
                  </div>
                  <div className="text-center p-2 rounded bg-dark-300/50">
                    <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-xs font-medium">SP</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-200">{char.spirit.current}/{char.spirit.max}</p>
                  </div>
                </div>

                {/* Traits */}
                {char.traits && char.traits.length > 0 && (
                  <div className="mt-3 flex gap-1 flex-wrap">
                    {char.traits.slice(0, 3).map((trait) => (
                      <span key={trait} className="px-2 py-0.5 rounded text-xs bg-gray-700/50 text-gray-300">
                        {trait}
                      </span>
                    ))}
                  </div>
                )}

                {/* Play button */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {char.discovered_locations.length} 个已探索区域
                  </span>
                  <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">
                    进入游戏 →
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Create new character card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: charactersList.length * 0.1 }}
              onClick={onCreate}
              className="p-6 rounded-2xl border-2 border-dashed border-gray-700 cursor-pointer
                       hover:border-amber-500/50 hover:bg-amber-500/5 transition-all flex flex-col items-center justify-center min-h-[200px]"
            >
              <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 font-medium">创建新角色</p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
