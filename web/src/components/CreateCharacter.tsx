'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Character } from '@/types';
import { characters } from '@/lib/api';
import { ArrowLeft, Swords, Sparkles, Heart, Zap, User, Sparkle } from 'lucide-react';

interface CreateCharacterProps {
  onCreated: (character: Character) => void;
  onBack: () => void;
}

const BACKGROUNDS = [
  { id: 'warrior', name: '没落贵族', desc: '家族曾显赫一时，如今誓要重振荣光', icon: '⚔️' },
  { id: 'wanderer', name: '流浪剑客', desc: '漂泊四方，只为寻找传说中的武学秘籍', icon: '🌙' },
  { id: 'seeker', name: '赏金猎人', desc: '为金钱与荣誉而战，见钱开眼', icon: '💰' },
  { id: 'scholar', name: '考古学者', desc: '痴迷古代遗迹中的秘密', icon: '📚' },
];

const TRAITS = [
  { id: 'brave', name: '勇敢', icon: Swords, color: 'text-red-400' },
  { id: 'wise', name: '睿智', icon: Sparkles, color: 'text-blue-400' },
  { id: 'charismatic', name: '魅力', icon: Heart, color: 'text-pink-400' },
  { id: 'agile', name: '敏捷', icon: Zap, color: 'text-green-400' },
];

export default function CreateCharacter({ onCreated, onBack }: CreateCharacterProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [background, setBackground] = useState('');
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || selectedTraits.length === 0) return;
    setLoading(true);
    try {
      const char = await characters.create({
        name: name.trim(),
        background: BACKGROUNDS.find(b => b.id === background)?.name || '神秘冒险者',
        traits: selectedTraits,
        alignment: 'neutral',
      });
      onCreated(char);
    } catch (err) {
      console.error('Failed to create character:', err);
      alert('创建失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleTrait = (id: string) => {
    setSelectedTraits(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      {/* Header */}
      <header className="h-16 px-6 flex items-center gap-4 bg-dark-200/80 border-b border-gray-800">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h2 className="font-bold text-amber-400">创建角色</h2>
          <p className="text-xs text-gray-400">第 {step} / 3 步</p>
        </div>
      </header>

      {/* Progress */}
      <div className="h-1 bg-gray-800">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
          initial={{ width: '33%' }}
          animate={{ width: `${step * 33}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        {/* Step 1: Name */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
              >
                <User className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">为你的角色命名</h2>
              <p className="text-gray-400">这个名字将伴随你的整个冒险旅程</p>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入角色名称..."
              className="w-full px-6 py-4 text-center text-xl bg-dark-200 border border-gray-700 rounded-xl
                       text-gray-100 placeholder-gray-500
                       focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              maxLength={12}
            />

            <motion.button
              onClick={() => name.trim() && setStep(2)}
              disabled={!name.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl
                       text-white font-semibold text-lg
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步 →
            </motion.button>
          </motion.div>
        )}

        {/* Step 2: Background */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-100 mb-2">选择你的背景故事</h2>
              <p className="text-gray-400">这将影响NPC对你的初始态度</p>
            </div>

            <div className="space-y-3">
              {BACKGROUNDS.map((bg) => (
                <motion.button
                  key={bg.id}
                  onClick={() => setBackground(bg.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${
                    background === bg.id
                      ? 'bg-amber-500/10 border-amber-500/50'
                      : 'bg-dark-200 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{bg.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-100">{bg.name}</p>
                      <p className="text-sm text-gray-400">{bg.desc}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-gray-700 rounded-xl text-gray-300 font-medium"
              >
                上一步
              </button>
              <motion.button
                onClick={() => setStep(3)}
                disabled={!background}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl
                         text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步 →
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Traits */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-100 mb-2">选择性格特征</h2>
              <p className="text-gray-400">选择最多 3 个特征（已选 {selectedTraits.length} 个）</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TRAITS.map(({ id, name, icon: Icon, color }) => {
                const isSelected = selectedTraits.includes(id);
                return (
                  <motion.button
                    key={id}
                    onClick={() => toggleTrait(id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-dark-200 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
                    <p className="font-medium text-gray-100">{name}</p>
                  </motion.button>
                );
              })}
            </div>

            {/* Preview */}
            {name && selectedTraits.length > 0 && (
              <div className="p-4 rounded-xl bg-dark-200 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-3">角色预览</h3>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-100">{name}</p>
                    <p className="text-sm text-gray-400">
                      {BACKGROUNDS.find(b => b.id === background)?.name} · Lv.1
                    </p>
                    <div className="flex gap-1 mt-1">
                      {selectedTraits.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                          {TRAITS.find(tr => tr.id === t)?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 bg-gray-700 rounded-xl text-gray-300 font-medium"
              >
                上一步
              </button>
              <motion.button
                onClick={handleCreate}
                disabled={selectedTraits.length === 0 || loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl
                         text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    创建中...
                  </>
                ) : (
                  <>
                    <Sparkle className="w-5 h-5" />
                    开始冒险
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
