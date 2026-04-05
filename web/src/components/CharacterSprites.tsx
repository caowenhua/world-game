import React from 'react';

// ============================================
// 角色建模体系 - 像素风格角色设计
// Pokemon/宝可梦风格的专业角色视觉系统
// ============================================

export type CharacterType = 'player' | 'monster' | 'npc' | 'boss';
export type CharacterState = 'idle' | 'attack' | 'hurt' | 'death' | 'skill';

// 角色设计模板接口
export interface CharacterDesign {
  type: CharacterType;
  name: string;
  bodyColor: string;       // 主身体颜色
  bodyColorDark: string;   // 阴影颜色
  accentColor: string;    // 强调色（眼睛、配饰等）
  bodyShape: 'circle' | 'oval' | 'blob' | 'humanoid';
  hasEyes: boolean;
  hasMouth: boolean;
  hasAccessories: boolean;
  hasWings: boolean;
  hasTail: boolean;
  specialFeature?: string; // 特殊标记
}

// 预设角色设计模板
export const CHARACTER_TEMPLATES: Record<string, CharacterDesign> = {
  // 玩家角色 - 蓝色勇者
  player_warrior: {
    type: 'player',
    name: '勇者',
    bodyColor: '#4a90d9',
    bodyColorDark: '#2d5a87',
    accentColor: '#ffd700',
    bodyShape: 'circle',
    hasEyes: true,
    hasMouth: false,
    hasAccessories: true,
    hasWings: false,
    hasTail: false,
    specialFeature: 'crown',
  },
  
  // 史莱姆 - 绿色果冻怪
  slime_green: {
    type: 'monster',
    name: '史莱姆',
    bodyColor: '#4ade80',
    bodyColorDark: '#22c55e',
    accentColor: '#ffffff',
    bodyShape: 'blob',
    hasEyes: true,
    hasMouth: true,
    hasAccessories: false,
    hasWings: false,
    hasTail: false,
    specialFeature: 'drip',
  },
  
  // 哥布林 - 红皮肤小怪物
  goblin: {
    type: 'monster',
    name: '哥布林',
    bodyColor: '#84cc16',
    bodyColorDark: '#4d7c0f',
    accentColor: '#ef4444',
    bodyShape: 'oval',
    hasEyes: true,
    hasMouth: true,
    hasAccessories: true,
    hasWings: false,
    hasTail: false,
    specialFeature: 'ears',
  },
  
  // 狼人 - 野兽型怪物
  werewolf: {
    type: 'monster',
    name: '狼人',
    bodyColor: '#78716c',
    bodyColorDark: '#57534e',
    accentColor: '#f97316',
    bodyShape: 'oval',
    hasEyes: true,
    hasMouth: true,
    hasAccessories: false,
    hasWings: false,
    hasTail: true,
    specialFeature: 'fur',
  },
  
  // 火焰精灵
  fire_spirit: {
    type: 'monster',
    name: '火焰精灵',
    bodyColor: '#f97316',
    bodyColorDark: '#dc2626',
    accentColor: '#fbbf24',
    bodyShape: 'blob',
    hasEyes: true,
    hasMouth: false,
    hasAccessories: false,
    hasWings: false,
    hasTail: false,
    specialFeature: 'flame',
  },
  
  // 冰霜巨人
  ice_giant: {
    type: 'boss',
    name: '冰霜巨人',
    bodyColor: '#67e8f9',
    bodyColorDark: '#06b6d4',
    accentColor: '#ffffff',
    bodyShape: 'humanoid',
    hasEyes: true,
    hasMouth: true,
    hasAccessories: false,
    hasWings: false,
    hasTail: false,
    specialFeature: 'ice_crown',
  },
  
  // 暗影刺客
  shadow_assassin: {
    type: 'npc',
    name: '暗影刺客',
    bodyColor: '#4b5563',
    bodyColorDark: '#1f2937',
    accentColor: '#a855f7',
    bodyShape: 'humanoid',
    hasEyes: true,
    hasMouth: false,
    hasAccessories: true,
    hasWings: false,
    hasTail: false,
    specialFeature: 'cloak',
  },
  
  // 森林精灵
  forest_elf: {
    type: 'npc',
    name: '森林精灵',
    bodyColor: '#86efac',
    bodyColorDark: '#22c55e',
    accentColor: '#fbbf24',
    bodyShape: 'humanoid',
    hasEyes: true,
    hasMouth: false,
    hasAccessories: true,
    hasWings: true,
    hasTail: false,
    specialFeature: 'leaf',
  },
};

// 基础角色SVG组件
interface CharacterSpriteProps {
  design: CharacterDesign;
  state: CharacterState;
  size?: number;
  facingRight?: boolean;
  level?: number;
  showLevelBadge?: boolean;
  hpPercent?: number;
  mpPercent?: number;
  buffIcons?: string[];
  debuffIcons?: string[];
  name?: string;
  isTargeted?: boolean;
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  design,
  state,
  size = 64,
  facingRight = true,
  level = 1,
  showLevelBadge = false,
  hpPercent = 100,
  mpPercent = 100,
  buffIcons = [],
  debuffIcons = [],
  name,
  isTargeted = false,
}) => {
  const scale = size / 64;
  
  // 状态动画效果
  const getStateAnimation = () => {
    switch (state) {
      case 'attack':
        return facingRight 
          ? 'transform scale-x-[-1] animate-attack-shake' 
          : 'animate-attack-shake';
      case 'hurt':
        return 'animate-hurt-flash';
      case 'death':
        return 'opacity-50 rotate-90';
      case 'skill':
        return 'animate-skill-glow';
      case 'idle':
      default:
        return 'animate-idle-bounce';
    }
  };

  return (
    <div 
      className={`relative inline-flex flex-col items-center ${getStateAnimation()}`}
      style={{ width: size, height: size }}
    >
      {/* 目标指示器 */}
      {isTargeted && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
      )}
      
      {/* 角色主体 */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className={`${!facingRight && design.bodyShape === 'humanoid' ? 'scale-x-[-1]' : ''}`}
      >
        {/* 阴影 */}
        <ellipse cx="32" cy="58" rx="16" ry="4" fill="rgba(0,0,0,0.3)" />
        
        {/* 身体 */}
        {design.bodyShape === 'blob' && <BlobBody design={design} state={state} />}
        {design.bodyShape === 'circle' && <CircleBody design={design} state={state} />}
        {design.bodyShape === 'oval' && <OvalBody design={design} state={state} />}
        {design.bodyShape === 'humanoid' && <HumanoidBody design={design} state={state} />}
      </svg>
      
      {/* 名称标签 */}
      {name && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs font-bold text-white bg-black/60 px-2 py-0.5 rounded">
            {name}
          </span>
        </div>
      )}
      
      {/* 等级徽章 */}
      {showLevelBadge && (
        <div 
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md"
          style={{ backgroundColor: level >= 10 ? '#fbbf24' : level >= 5 ? '#a855f7' : '#3b82f6' }}
        >
          {level}
        </div>
      )}
      
      {/* 状态图标区域 */}
      {(buffIcons.length > 0 || debuffIcons.length > 0) && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
          {debuffIcons.slice(0, 3).map((icon, i) => (
            <span key={`debuff-${i}`} className="text-xs filter hue-rotate-180">{icon}</span>
          ))}
          {buffIcons.slice(0, 3).map((icon, i) => (
            <span key={`buff-${i}`} className="text-xs">{icon}</span>
          ))}
        </div>
      )}
    </div>
  );
};

// 果冻/史莱姆身体
const BlobBody: React.FC<{ design: CharacterDesign; state: CharacterState }> = ({ design, state }) => {
  const bounce = state === 'idle' ? 'animate-[blob-bounce_1s_ease-in-out_infinite]' : '';
  
  return (
    <g className={bounce}>
      {/* 身体主体 */}
      <path
        d="M16 40 Q12 30 16 22 Q20 14 32 14 Q44 14 48 22 Q52 30 48 40 Q44 48 32 50 Q20 48 16 40"
        fill={design.bodyColor}
      />
      {/* 身体高光 */}
      <path
        d="M20 24 Q24 18 32 18 Q36 18 38 22"
        fill="none"
        stroke={design.accentColor}
        strokeWidth="2"
        strokeOpacity="0.6"
      />
      {/* 眼睛 */}
      <ellipse cx="26" cy="30" rx="4" ry="5" fill="white" />
      <ellipse cx="38" cy="30" rx="4" ry="5" fill="white" />
      <ellipse cx="27" cy="31" rx="2" ry="2.5" fill="#1a1a2e" />
      <ellipse cx="39" cy="31" rx="2" ry="2.5" fill="#1a1a2e" />
      {/* 眼睛高光 */}
      <circle cx="28" cy="29" r="1" fill="white" />
      <circle cx="40" cy="29" r="1" fill="white" />
      {/* 嘴巴（可选） */}
      {design.hasMouth && (
        <path
          d="M28 38 Q32 42 36 38"
          fill="none"
          stroke={design.bodyColorDark}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      {/* 水滴效果 */}
      {design.specialFeature === 'drip' && (
        <>
          <path d="M14 36 Q12 42 14 48" fill={design.bodyColor} />
          <circle cx="14" cy="50" r="3" fill={design.bodyColor} />
        </>
      )}
      {/* 火焰效果 */}
      {design.specialFeature === 'flame' && (
        <g className="animate-[flame-flicker_0.3s_ease-in-out_infinite]">
          <path d="M26 8 Q28 4 30 8 Q32 2 34 8 Q36 4 38 8" fill={design.accentColor} />
          <path d="M28 10 Q30 6 32 10" fill={design.accentColor} />
        </g>
      )}
    </g>
  );
};

// 圆形身体（玩家）
const CircleBody: React.FC<{ design: CharacterDesign; state: CharacterState }> = ({ design, state }) => {
  const pulse = state === 'idle' ? 'animate-[pulse_2s_ease-in-out_infinite]' : '';
  
  return (
    <g className={pulse}>
      {/* 外发光 */}
      <circle cx="32" cy="32" r="24" fill={design.bodyColor} opacity="0.3" />
      {/* 身体 */}
      <circle cx="32" cy="32" r="20" fill={design.bodyColor} />
      {/* 身体渐变 */}
      <circle cx="32" cy="32" r="20" fill="url(#bodyGradient)" />
      {/* 高光 */}
      <ellipse cx="26" cy="26" rx="6" ry="4" fill="white" opacity="0.4" />
      {/* 眼睛 */}
      <ellipse cx="26" cy="32" rx="4" ry="5" fill="white" />
      <ellipse cx="38" cy="32" rx="4" ry="5" fill="white" />
      <ellipse cx="27" cy="33" rx="2" ry="2.5" fill="#1a1a2e" />
      <ellipse cx="39" cy="33" rx="2" ry="2.5" fill="#1a1a2e" />
      <circle cx="28" cy="31" r="1.5" fill="white" />
      <circle cx="40" cy="31" r="1.5" fill="white" />
      {/* 王冠 */}
      {design.specialFeature === 'crown' && (
        <g transform="translate(32, 8)">
          <path d="M-8 8 L-6 0 L0 4 L6 0 L8 8 Z" fill={design.accentColor} />
          <circle cx="0" cy="2" r="2" fill={design.accentColor} />
        </g>
      )}
      {/* 渐变定义 */}
      <defs>
        <radialGradient id="bodyGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={design.accentColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={design.bodyColorDark} />
        </radialGradient>
      </defs>
    </g>
  );
};

// 椭圆形身体（哥布林/狼人）
const OvalBody: React.FC<{ design: CharacterDesign; state: CharacterState }> = ({ design, state }) => {
  const breathe = state === 'idle' ? 'animate-[breathe_2s_ease-in-out_infinite]' : '';
  
  return (
    <g className={breathe}>
      {/* 身体 */}
      <ellipse cx="32" cy="36" rx="18" ry="20" fill={design.bodyColor} />
      {/* 身体渐变 */}
      <ellipse cx="32" cy="36" rx="18" ry="20" fill="url(#ovalGradient)" />
      {/* 耳朵（哥布林） */}
      {design.specialFeature === 'ears' && (
        <>
          <path d="M10 28 Q6 20 14 24" fill={design.bodyColor} />
          <path d="M54 28 Q58 20 50 24" fill={design.bodyColor} />
        </>
      )}
      {/* 尾巴（狼人） */}
      {design.hasTail && (
        <path d="M44 48 Q52 52 56 46 Q60 40 54 38" fill={design.bodyColor} />
      )}
      {/* 眼睛 */}
      <ellipse cx="26" cy="30" rx="4" ry="5" fill={design.accentColor} />
      <ellipse cx="38" cy="30" rx="4" ry="5" fill={design.accentColor} />
      <ellipse cx="26" cy="31" rx="2" ry="2.5" fill="#1a1a2e" />
      <ellipse cx="38" cy="31" rx="2" ry="2.5" fill="#1a1a2e" />
      <circle cx="27" cy="29" r="1" fill="white" />
      <circle cx="39" cy="29" r="1" fill="white" />
      {/* 嘴巴 */}
      {design.hasMouth && (
        <path
          d="M26 42 Q32 46 38 42"
          fill="none"
          stroke={design.bodyColorDark}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      {/* 渐变 */}
      <defs>
        <radialGradient id="ovalGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={design.accentColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={design.bodyColorDark} />
        </radialGradient>
      </defs>
    </g>
  );
};

// 人形身体（NPC/Boss）
const HumanoidBody: React.FC<{ design: CharacterDesign; state: CharacterState }> = ({ design, state }) => {
  const breathe = state === 'idle' ? 'animate-[breathe_2s_ease-in-out_infinite]' : '';
  
  return (
    <g className={breathe}>
      {/* 身体 */}
      <ellipse cx="32" cy="40" rx="14" ry="16" fill={design.bodyColor} />
      {/* 头部 */}
      <circle cx="32" cy="18" r="12" fill={design.bodyColor} />
      {/* 头部高光 */}
      <ellipse cx="28" cy="14" rx="4" ry="3" fill="white" opacity="0.3" />
      {/* 斗篷 */}
      {design.specialFeature === 'cloak' && (
        <>
          <path d="M18 24 Q16 40 20 52 L32 48 L44 52 Q48 40 46 24" fill={design.bodyColorDark} />
          <path d="M18 24 Q32 20 46 24" fill={design.bodyColorDark} />
        </>
      )}
      {/* 翅膀 */}
      {design.hasWings && (
        <>
          <path d="M18 28 Q8 20 10 32 Q8 36 18 36" fill={design.accentColor} opacity="0.7" />
          <path d="M46 28 Q56 20 54 32 Q56 36 46 36" fill={design.accentColor} opacity="0.7" />
        </>
      )}
      {/* 眼睛 */}
      <ellipse cx="28" cy="18" rx="3" ry="4" fill={design.accentColor} />
      <ellipse cx="36" cy="18" rx="3" ry="4" fill={design.accentColor} />
      <ellipse cx="28" cy="19" rx="1.5" ry="2" fill="#1a1a2e" />
      <ellipse cx="36" cy="19" rx="1.5" ry="2" fill="#1a1a2e" />
      <circle cx="29" cy="17" r="1" fill="white" />
      <circle cx="37" cy="17" r="1" fill="white" />
      {/* 冰冠（冰霜巨人） */}
      {design.specialFeature === 'ice_crown' && (
        <g>
          <path d="M22 8 L24 2 L28 6 L32 0 L36 6 L40 2 L42 8" fill={design.accentColor} />
          <circle cx="32" cy="4" r="2" fill={design.accentColor} />
        </g>
      )}
      {/* 叶子（森林精灵） */}
      {design.specialFeature === 'leaf' && (
        <g transform="translate(44, 12)">
          <path d="M0 8 Q4 0 8 8 Q4 12 0 8" fill={design.accentColor} />
        </g>
      )}
    </g>
  );
};

// 导出角色模板获取函数
export const getCharacterDesign = (templateId: string): CharacterDesign => {
  return CHARACTER_TEMPLATES[templateId] || CHARACTER_TEMPLATES.slime_green;
};

// 导出创建自定义角色的函数
export const createCustomCharacter = (
  type: CharacterType,
  options: Partial<CharacterDesign>
): CharacterDesign => {
  const baseDesign = Object.values(CHARACTER_TEMPLATES).find(d => d.type === type) || CHARACTER_TEMPLATES.slime_green;
  return { ...baseDesign, ...options };
};

export default CharacterSprite;
