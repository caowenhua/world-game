import React, { useEffect, useState, useRef } from 'react';
import { CharacterSprite, CharacterDesign, CharacterType, CharacterState, getCharacterDesign, CHARACTER_TEMPLATES } from './CharacterSprites';

// ============================================
// 角色模型组件 - 带动画和状态管理的完整角色渲染
// ============================================

export interface CharacterModelProps {
  // 角色标识
  id: string;
  type: CharacterType;
  templateId?: string;
  customDesign?: CharacterDesign;
  
  // 位置（用于地图定位）
  x: number;
  y: number;
  
  // 战斗属性
  hp: number;
  maxHp: number;
  mp?: number;
  maxMp?: number;
  level?: number;
  
  // 状态
  state?: CharacterState;
  facingRight?: boolean;
  
  // 显示选项
  showName?: boolean;
  showLevel?: boolean;
  showHpBar?: boolean;
  showMpBar?: boolean;
  showBuffIcons?: boolean;
  
  // buff/debuff
  buffs?: { icon: string; name: string; duration: number }[];
  debuffs?: { icon: string; name: string; duration: number }[];
  
  // 尺寸
  size?: number;
  
  // 是否被选中
  isTargeted?: boolean;
  
  // 自定义样式
  className?: string;
  
  // 动画回调
  onAttackComplete?: () => void;
  onHurtComplete?: () => void;
  onDeathComplete?: () => void;
}

interface DamagePopup {
  id: number;
  value: number;
  isCritical: boolean;
  isHeal: boolean;
}

export const CharacterModel: React.FC<CharacterModelProps> = ({
  id,
  type,
  templateId,
  customDesign,
  x,
  y,
  hp,
  maxHp,
  mp = 0,
  maxMp = 0,
  level = 1,
  state = 'idle',
  facingRight = true,
  showName = false,
  showLevel = false,
  showHpBar = true,
  showMpBar = false,
  showBuffIcons = false,
  buffs = [],
  debuffs = [],
  size = 64,
  isTargeted = false,
  className = '',
  onAttackComplete,
  onHurtComplete,
  onDeathComplete,
}) => {
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [currentState, setCurrentState] = useState<CharacterState>(state);
  const damageIdRef = useRef(0);
  
  // 获取角色设计
  const design = customDesign || getCharacterDesign(templateId || `${type}_warrior`);
  
  // 同步外部状态
  useEffect(() => {
    setCurrentState(state);
  }, [state]);
  
  // 状态动画完成回调
  useEffect(() => {
    if (currentState === 'attack') {
      const timer = setTimeout(() => {
        setCurrentState('idle');
        onAttackComplete?.();
      }, 300);
      return () => clearTimeout(timer);
    }
    if (currentState === 'hurt') {
      const timer = setTimeout(() => {
        setCurrentState('idle');
        onHurtComplete?.();
      }, 200);
      return () => clearTimeout(timer);
    }
    if (currentState === 'death') {
      const timer = setTimeout(() => {
        onDeathComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentState, onAttackComplete, onHurtComplete, onDeathComplete]);
  
  // 伤害数字弹出
  const showDamage = (value: number, isCritical = false, isHeal = false) => {
    const newPopup: DamagePopup = {
      id: damageIdRef.current++,
      value,
      isCritical,
      isHeal,
    };
    setDamagePopups(prev => [...prev, newPopup]);
    setTimeout(() => {
      setDamagePopups(prev => prev.filter(p => p.id !== newPopup.id));
    }, 1000);
  };
  
  // 暴露伤害方法
  useEffect(() => {
    (window as any)[`character_${id}_showDamage`] = showDamage;
    return () => {
      delete (window as any)[`character_${id}_showDamage`];
    };
  }, [id]);
  
  // HP/MP百分比
  const hpPercent = (hp / maxHp) * 100;
  const mpPercent = maxMp > 0 ? (mp / maxMp) * 100 : 0;
  
  // 获取血条颜色
  const getHpColor = () => {
    if (hpPercent > 50) return '#4ade80';
    if (hpPercent > 25) return '#fbbf24';
    return '#ef4444';
  };
  
  return (
    <div 
      className={`absolute transition-all duration-200 ${className}`}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
      }}
    >
      {/* 角色精灵 */}
      <CharacterSprite
        design={design}
        state={currentState}
        size={size}
        facingRight={facingRight}
        level={level}
        showLevelBadge={showLevel}
        hpPercent={hpPercent}
        mpPercent={mpPercent}
        buffIcons={showBuffIcons ? buffs.map(b => b.icon) : []}
        debuffIcons={showBuffIcons ? debuffs.map(d => d.icon) : []}
        name={showName ? design.name : undefined}
        isTargeted={isTargeted}
      />
      
      {/* 血条 */}
      {showHpBar && maxHp > 0 && (
        <div 
          className="absolute left-0 right-0 mx-auto rounded-full overflow-hidden border border-black/30"
          style={{
            bottom: -8,
            width: size * 0.9,
            height: 6,
            backgroundColor: '#1a1a1a',
          }}
        >
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${hpPercent}%`,
              backgroundColor: getHpColor(),
              boxShadow: `0 0 4px ${getHpColor()}`,
            }}
          />
        </div>
      )}
      
      {/* MP条 */}
      {showMpBar && maxMp > 0 && (
        <div 
          className="absolute left-0 right-0 mx-auto rounded-full overflow-hidden border border-black/30"
          style={{
            bottom: -14,
            width: size * 0.9,
            height: 4,
            backgroundColor: '#1a1a1a',
          }}
        >
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${mpPercent}%`,
              backgroundColor: '#3b82f6',
              boxShadow: '0 0 4px #3b82f6',
            }}
          />
        </div>
      )}
      
      {/* 状态图标 */}
      {showBuffIcons && (buffs.length > 0 || debuffs.length > 0) && (
        <div 
          className="absolute left-0 right-0 mx-auto flex justify-center gap-0.5"
          style={{
            bottom: -22,
          }}
        >
          {debuffs.slice(0, 2).map((debuff, i) => (
            <div 
              key={`debuff-${i}`}
              className="w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center text-[8px]"
              title={`${debuff.name} (${debuff.duration}s)`}
            >
              {debuff.icon}
            </div>
          ))}
          {buffs.slice(0, 2).map((buff, i) => (
            <div 
              key={`buff-${i}`}
              className="w-4 h-4 rounded-full bg-green-500/80 flex items-center justify-center text-[8px]"
              title={`${buff.name} (${buff.duration}s)`}
            >
              {buff.icon}
            </div>
          ))}
        </div>
      )}
      
      {/* 伤害/治疗数字弹出 */}
      {damagePopups.map(popup => (
        <div
          key={popup.id}
          className={`absolute left-1/2 -translate-x-1/1 font-bold pointer-events-none ${
            popup.isHeal ? 'text-green-400' : 
            popup.isCritical ? 'text-orange-400' : 'text-white'
          }`}
          style={{
            top: -20,
            animation: 'damage-float 1s ease-out forwards',
            textShadow: '0 0 4px rgba(0,0,0,0.8)',
            fontSize: popup.isCritical ? 18 : 14,
          }}
        >
          {popup.isHeal ? '+' : '-'}{popup.value}
          {popup.isCritical && <span className="text-yellow-300 text-xs">!</span>}
        </div>
      ))}
    </div>
  );
};

// ============================================
// Canvas渲染的批量角色组件（用于性能优化）
// ============================================

export interface BatchCharacterRenderProps {
  characters: {
    id: string;
    x: number;
    y: number;
    type: CharacterType;
    templateId?: string;
    hp: number;
    maxHp: number;
    state: CharacterState;
    facingRight: boolean;
    level?: number;
    name?: string;
  }[];
  tileSize: number;
  canvasWidth: number;
  canvasHeight: number;
}

export const BatchCharacterRenderer: React.FC<BatchCharacterRenderProps> = ({
  characters,
  tileSize,
  canvasWidth,
  canvasHeight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [time, setTime] = useState(0);
  
  // 动画循环
  useEffect(() => {
    let lastTime = 0;
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= 50) {
        setTime(currentTime);
        lastTime = currentTime;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Canvas渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // 清空画布（透明背景，让地图显示）
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 渲染每个角色
    characters.forEach(char => {
      const design = getCharacterDesign(char.templateId || `${char.type}_warrior`);
      const screenX = char.x * tileSize;
      const screenY = char.y * tileSize;
      
      renderCharacterToCanvas(ctx, design, char, screenX, screenY, tileSize, time);
    });
  }, [characters, tileSize, canvasWidth, canvasHeight, time]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: canvasWidth, height: canvasHeight }}
    />
  );
};

// Canvas渲染单个角色
const renderCharacterToCanvas = (
  ctx: CanvasRenderingContext2D,
  design: CharacterDesign,
  char: {
    id: string;
    x: number;
    y: number;
    type: CharacterType;
    hp: number;
    maxHp: number;
    state: CharacterState;
    facingRight: boolean;
    level?: number;
    name?: string;
  },
  screenX: number,
  screenY: number,
  tileSize: number,
  time: number
) => {
  const centerX = screenX + tileSize / 2;
  const centerY = screenY + tileSize / 2;
  const scale = tileSize / 64;
  
  ctx.save();
  
  // 死亡状态
  if (char.state === 'death') {
    ctx.globalAlpha = 0.5;
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.PI / 2);
    ctx.translate(-centerX, -centerY);
  }
  
  // 受伤闪烁
  if (char.state === 'hurt' && Math.floor(time / 100) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }
  
  // idle动画
  let bounceOffset = 0;
  if (char.state === 'idle') {
    bounceOffset = Math.sin(time / 300) * 2 * scale;
  }
  
  // 绘制阴影
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(centerX, screenY + tileSize - 6 * scale, 12 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 根据身体类型绘制
  const bodySize = tileSize * 0.6;
  
  // 外发光
  const glowColor = design.type === 'boss' ? 'rgba(255, 100, 100, 0.4)' : 
                     design.type === 'player' ? 'rgba(100, 150, 255, 0.4)' :
                     'rgba(200, 200, 200, 0.3)';
  const gradient = ctx.createRadialGradient(centerX, centerY + bounceOffset, bodySize * 0.3, centerX, centerY + bounceOffset, bodySize);
  gradient.addColorStop(0, glowColor);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY + bounceOffset, bodySize, 0, Math.PI * 2);
  ctx.fill();
  
  // 身体
  ctx.fillStyle = design.bodyColor;
  ctx.beginPath();
  
  if (design.bodyShape === 'blob' || design.bodyShape === 'circle' || design.bodyShape === 'oval') {
    // 圆形/椭圆形身体
    const rx = design.bodyShape === 'oval' ? bodySize * 0.8 : bodySize * 0.7;
    const ry = design.bodyShape === 'blob' ? bodySize * 0.6 : bodySize * 0.7;
    ctx.ellipse(centerX, centerY + bounceOffset, rx, ry, 0, 0, Math.PI * 2);
  } else {
    // 人形身体
    // 身体
    ctx.ellipse(centerX, centerY + bounceOffset + 8 * scale, bodySize * 0.5, bodySize * 0.6, 0, 0, Math.PI * 2);
  }
  ctx.fill();
  
  // 身体渐变高光
  const highlight = ctx.createRadialGradient(
    centerX - bodySize * 0.2, 
    centerY + bounceOffset - bodySize * 0.2, 
    0, 
    centerX, 
    centerY + bounceOffset, 
    bodySize
  );
  highlight.addColorStop(0, 'rgba(255,255,255,0.4)');
  highlight.addColorStop(0.5, 'rgba(255,255,255,0.1)');
  highlight.addColorStop(1, 'transparent');
  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.arc(centerX, centerY + bounceOffset, bodySize * 0.7, 0, Math.PI * 2);
  ctx.fill();
  
  // 眼睛
  const eyeY = centerY + bounceOffset - 2 * scale;
  const eyeSpacing = bodySize * 0.35;
  const eyeSize = bodySize * 0.18;
  
  // 左眼
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.ellipse(centerX - eyeSpacing, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 右眼
  ctx.beginPath();
  ctx.ellipse(centerX + eyeSpacing, eyeY, eyeSize, eyeSize * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // 瞳孔
  ctx.fillStyle = design.accentColor;
  ctx.beginPath();
  ctx.arc(centerX - eyeSpacing + (char.facingRight ? 1 : -1) * eyeSize * 0.3, eyeY, eyeSize * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX + eyeSpacing + (char.facingRight ? 1 : -1) * eyeSize * 0.3, eyeY, eyeSize * 0.6, 0, Math.PI * 2);
  ctx.fill();
  
  // 眼睛高光
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(centerX - eyeSpacing - eyeSize * 0.2, eyeY - eyeSize * 0.3, eyeSize * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX + eyeSpacing - eyeSize * 0.2, eyeY - eyeSize * 0.3, eyeSize * 0.25, 0, Math.PI * 2);
  ctx.fill();
  
  // 嘴巴
  if (design.hasMouth) {
    ctx.strokeStyle = design.bodyColorDark;
    ctx.lineWidth = 2 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(centerX, centerY + bounceOffset + bodySize * 0.2, bodySize * 0.25, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }
  
  // 特殊特征
  if (design.specialFeature === 'crown') {
    ctx.fillStyle = design.accentColor;
    ctx.beginPath();
    const crownY = centerY + bounceOffset - bodySize * 0.9;
    ctx.moveTo(centerX - 10 * scale, crownY + 8 * scale);
    ctx.lineTo(centerX - 7 * scale, crownY);
    ctx.lineTo(centerX, crownY + 5 * scale);
    ctx.lineTo(centerX + 7 * scale, crownY);
    ctx.lineTo(centerX + 10 * scale, crownY + 8 * scale);
    ctx.closePath();
    ctx.fill();
  }
  
  if (design.specialFeature === 'ears') {
    ctx.fillStyle = design.bodyColor;
    // 左耳
    ctx.beginPath();
    ctx.moveTo(centerX - bodySize * 0.8, centerY - bodySize * 0.2);
    ctx.lineTo(centerX - bodySize * 1.1, centerY - bodySize * 0.6);
    ctx.lineTo(centerX - bodySize * 0.6, centerY - bodySize * 0.4);
    ctx.closePath();
    ctx.fill();
    // 右耳
    ctx.beginPath();
    ctx.moveTo(centerX + bodySize * 0.8, centerY - bodySize * 0.2);
    ctx.lineTo(centerX + bodySize * 1.1, centerY - bodySize * 0.6);
    ctx.lineTo(centerX + bodySize * 0.6, centerY - bodySize * 0.4);
    ctx.closePath();
    ctx.fill();
  }
  
  if (design.hasTail) {
    ctx.fillStyle = design.bodyColor;
    ctx.beginPath();
    ctx.moveTo(centerX + bodySize * 0.5, centerY + bodySize * 0.3);
    ctx.quadraticCurveTo(
      centerX + bodySize * 0.9, centerY + bodySize * 0.5,
      centerX + bodySize * 0.8, centerY + bodySize * 0.2
    );
    ctx.quadraticCurveTo(
      centerX + bodySize * 0.9, centerY + bodySize * 0.1,
      centerX + bodySize * 0.5, centerY + bodySize * 0.3
    );
    ctx.fill();
  }
  
  if (design.hasWings) {
    ctx.fillStyle = design.accentColor;
    ctx.globalAlpha = 0.7;
    // 左翼
    ctx.beginPath();
    const wingY = centerY + bounceOffset - 5 * scale;
    ctx.moveTo(centerX - bodySize * 0.5, wingY);
    ctx.quadraticCurveTo(centerX - bodySize * 1.2, wingY - 10 * scale, centerX - bodySize * 0.9, wingY + 5 * scale);
    ctx.quadraticCurveTo(centerX - bodySize * 0.8, wingY + 10 * scale, centerX - bodySize * 0.5, wingY + 5 * scale);
    ctx.fill();
    // 右翼
    ctx.beginPath();
    ctx.moveTo(centerX + bodySize * 0.5, wingY);
    ctx.quadraticCurveTo(centerX + bodySize * 1.2, wingY - 10 * scale, centerX + bodySize * 0.9, wingY + 5 * scale);
    ctx.quadraticCurveTo(centerX + bodySize * 0.8, wingY + 10 * scale, centerX + bodySize * 0.5, wingY + 5 * scale);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  // 攻击动画效果
  if (char.state === 'attack') {
    const attackPhase = (time % 300) / 300;
    ctx.strokeStyle = design.accentColor;
    ctx.lineWidth = 3 * scale;
    ctx.globalAlpha = 1 - attackPhase;
    ctx.beginPath();
    const attackRadius = bodySize * (1 + attackPhase * 0.5);
    ctx.arc(centerX, centerY + bounceOffset, attackRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  
  ctx.restore();
  
  // 血条
  if (char.maxHp > 0) {
    const hpBarWidth = tileSize * 0.8;
    const hpBarHeight = 4 * scale;
    const hpBarX = screenX + (tileSize - hpBarWidth) / 2;
    const hpBarY = screenY + tileSize - 12 * scale;
    const hpPercent = char.hp / char.maxHp;
    
    // 血条背景
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight, 2);
    ctx.fill();
    
    // 血条
    const hpColor = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillStyle = hpColor;
    ctx.beginPath();
    ctx.roundRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight, 2);
    ctx.fill();
  }
  
  // 名称
  if (char.name) {
    ctx.font = `bold ${10 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(char.name, centerX, screenY - 4);
    ctx.shadowBlur = 0;
  }
  
  // 等级徽章
  if (char.level) {
    const badgeSize = 14 * scale;
    const badgeX = screenX + tileSize - badgeSize / 2;
    const badgeY = screenY - badgeSize / 2;
    ctx.fillStyle = char.level >= 10 ? '#fbbf24' : char.level >= 5 ? '#a855f7' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `bold ${8 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(String(char.level), badgeX, badgeY);
  }
};

// 预设怪物模板映射
export const MONSTER_TEMPLATES: Record<string, string> = {
  slime: 'slime_green',
  goblin: 'goblin',
  wolfman: 'werewolf',
  fire_spirit: 'fire_spirit',
  ice_giant: 'ice_giant',
  shadow: 'shadow_assassin',
  elf: 'forest_elf',
};

export default CharacterModel;
