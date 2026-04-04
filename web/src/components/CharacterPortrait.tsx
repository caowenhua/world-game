'use client';

import React from 'react';

// 14个主要角色的头像配置
const CHARACTER_PORTRAITS: Record<string, {
  bg: string;
  border: string;
  letter: string;
  gradient?: string;
}> = {
  chen_yue: { bg: '#1a365d', border: '#60a5fa', letter: 'CY', gradient: 'from-blue-900 to-blue-700' },
  su_waner: { bg: '#7c3aed', border: '#c4b5fd', letter: 'SW', gradient: 'from-purple-900 to-purple-700' },
  lao_lieren: { bg: '#065f46', border: '#34d399', letter: 'LL', gradient: 'from-emerald-900 to-emerald-700' },
  heiying: { bg: '#1f2937', border: '#6b7280', letter: 'HY', gradient: 'from-gray-900 to-gray-700' },
  tie_mian: { bg: '#92400e', border: '#fbbf24', letter: 'TM', gradient: 'from-amber-900 to-amber-700' },
  honghu: { bg: '#991b1b', border: '#f87171', letter: 'HH', gradient: 'from-red-900 to-red-700' },
  mo_qingshu: { bg: '#581c87', border: '#c084fc', letter: 'MQ', gradient: 'from-violet-900 to-violet-700' },
  yueying: { bg: '#0f766e', border: '#2dd4bf', letter: 'YY', gradient: 'from-teal-900 to-teal-700' },
  alian_zu: { bg: '#15803d', border: '#86efac', letter: 'AL', gradient: 'from-green-900 to-green-700' },
  han_feng: { bg: '#1e3a5f', border: '#38bdf8', letter: 'HF', gradient: 'from-sky-900 to-sky-700' },
  ming_yue: { bg: '#312e81', border: '#818cf8', letter: 'MY', gradient: 'from-indigo-900 to-indigo-700' },
  lin_yuan: { bg: '#0c4a6e', border: '#38bdf8', letter: 'LY', gradient: 'from-cyan-900 to-cyan-700' },
  yang_ti: { bg: '#164e63', border: '#22d3ee', letter: 'YT', gradient: 'from-cyan-800 to-sky-700' },
  xu_yuan: { bg: '#450a0a', border: '#fca5a5', letter: 'XY', gradient: 'from-red-950 to-red-900' },
  gui_wang: { bg: '#292524', border: '#a8a29e', letter: 'GW', gradient: 'from-stone-900 to-stone-700' },
  zan_da: { bg: '#78350f', border: '#fcd34d', letter: 'ZD', gradient: 'from-yellow-900 to-yellow-700' },
  zhao_shen: { bg: '#9a3412', border: '#fdba74', letter: 'ZS', gradient: 'from-orange-900 to-orange-700' },
  zhou_hai: { bg: '#1e40af', border: '#93c5fd', letter: 'ZH', gradient: 'from-blue-900 to-blue-700' },
  system: { bg: '#374151', border: '#9ca3af', letter: 'SYS', gradient: 'from-gray-700 to-gray-600' },
  mysterious: { bg: '#111827', border: '#6b7280', letter: '?', gradient: 'from-gray-950 to-gray-800' },
};

interface CharacterPortraitProps {
  characterId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  name?: string;
  className?: string;
  bordered?: boolean;
}

const sizeMap = {
  xs: { outer: 'w-6 h-6', inner: 'w-4 h-4 text-[8px]', gap: 'gap-1' },
  sm: { outer: 'w-8 h-8', inner: 'w-6 h-6 text-[10px]', gap: 'gap-1.5' },
  md: { outer: 'w-10 h-10', inner: 'w-8 h-8 text-xs', gap: 'gap-2' },
  lg: { outer: 'w-14 h-14', inner: 'w-12 h-12 text-sm', gap: 'gap-2' },
  xl: { outer: 'w-20 h-20', inner: 'w-16 h-16 text-lg', gap: 'gap-3' },
};

export default function CharacterPortrait({
  characterId,
  size = 'md',
  showName = false,
  name,
  className = '',
  bordered = true,
}: CharacterPortraitProps) {
  const portrait = CHARACTER_PORTRAITS[characterId] || CHARACTER_PORTRAITS.mysterious;
  const s = sizeMap[size];
  const borderClass = bordered ? `ring-2 ring-offset-2 ring-offset-slate-900` : '';

  return (
    <div className={`flex flex-col items-center ${s.gap} ${className}`}>
      {/* 头像主体 */}
      <div
        className={`
          ${s.outer} rounded-full flex items-center justify-center
          bg-gradient-to-br ${portrait.gradient}
          ${bordered ? `ring-2` : ''}
          shadow-lg overflow-hidden
          transition-all duration-200 hover:scale-105 cursor-pointer
        `}
        style={{ 
          boxShadow: `0 0 12px ${portrait.bg}40`,
          ...(bordered ? { ['--tw-ring-color' as string]: portrait.border } : {})
        }}
      >
        {/* 外圈装饰 */}
        <div className="absolute inset-0 rounded-full border-2 opacity-30"
          style={{ borderColor: portrait.border }} />
        
        {/* 字母 */}
        <span 
          className={`
            ${s.inner} font-bold text-white
            flex items-center justify-center
            drop-shadow-lg
          `}
          style={{
            textShadow: `0 0 8px ${portrait.border}`,
            color: portrait.border,
          }}
        >
          {portrait.letter}
        </span>

        {/* 职业图标装饰 */}
        {characterId === 'mo_qingshu' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-xs">👑</div>
        )}
        {characterId === 'honghu' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-xs">🏴</div>
        )}
        {characterId === 'xu_yuan' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-800 flex items-center justify-center text-xs animate-pulse">⚡</div>
        )}
        {characterId === 'yang_ti' && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center text-xs">❄️</div>
        )}
      </div>

      {/* 名字 */}
      {showName && (
        <span className="text-xs text-slate-300 font-medium text-center max-w-[80px] truncate">
          {name || characterId}
        </span>
      )}
    </div>
  );
}

// 角色头像网格 - 显示多个头像
export function CharacterPortraitGrid({
  characters,
  size = 'sm',
  maxVisible = 5,
}: {
  characters: Array<{ id: string; name: string; title?: string }>;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  maxVisible?: number;
}) {
  const visible = characters.slice(0, maxVisible);
  const remaining = characters.length - maxVisible;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((char, i) => (
        <div key={char.id} className="relative group">
          <CharacterPortrait
            characterId={char.id}
            size={size}
            bordered={true}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            <span className="font-medium">{char.name}</span>
            {char.title && <span className="text-slate-400 ml-1">{char.title}</span>}
          </div>
        </div>
      ))}
      {remaining > 0 && (
        <div className={`${sizeMap[size].outer} rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 ring-2 ring-slate-600`}>
          +{remaining}
        </div>
      )}
    </div>
  );
}

// 情绪图标
const emotionIcons: Record<string, string> = {
  normal: '💬',
  eerie: '🌙',
  happy: '😊',
  angry: '😠',
  sad: '😢',
  warning: '⚠️',
  boss: '💀',
};

export function EmotionIndicator({ emotion }: { emotion: string }) {
  return (
    <span className="text-sm" title={emotion}>
      {emotionIcons[emotion] || emotionIcons.normal}
    </span>
  );
}
