'use client';

import React, { useState, useEffect, useRef } from 'react';
import CharacterPortrait, { EmotionIndicator } from './CharacterPortrait';

// 对话数据类型
interface DialogueChoice {
  text: string;
  next_id: string;
  condition?: string;
  gain_item?: string;
  gain_quest?: string;
  flag?: string;
}

interface DialogueLine {
  speaker: string;
  content: string;
  emotion: string;
  show_choice: boolean;
  choices?: DialogueChoice[];
}

interface CharacterProfile {
  id: string;
  name: string;
  title: string;
  portrait_bg: string;
  portrait_fg: string;
  portrait_ltr: string;
  description: string;
  alignment: string;
  role: string;
}

interface DialogueData {
  character: CharacterProfile;
  dialogue: {
    chapter: number;
    title: string;
    location: string;
    trigger: string;
    dialogues: DialogueLine[];
  };
  current_idx: number;
}

interface DialogueBoxProps {
  dialogueData: DialogueData | null;
  onClose: () => void;
  onChoiceSelected: (choice: DialogueChoice, nextIdx: number) => void;
  onComplete?: () => void;
}

// 阵营颜色
const alignmentColors: Record<string, string> = {
  '善良': 'text-green-400',
  '中立': 'text-yellow-400',
  '灰色': 'text-orange-400',
  '邪恶': 'text-red-400',
};

// 阵营边框
const alignmentBorders: Record<string, string> = {
  '善良': 'border-green-500/50',
  '中立': 'border-yellow-500/50',
  '灰色': 'border-orange-500/50',
  '邪恶': 'border-red-500/50',
};

export default function DialogueBox({
  dialogueData,
  onClose,
  onChoiceSelected,
  onComplete,
}: DialogueBoxProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [showFullText, setShowFullText] = useState(false);
  const dialogueEndRef = useRef<HTMLDivElement>(null);
  
  const currentLine = dialogueData?.dialogue.dialogues[currentIdx];
  const speakerId = currentLine?.speaker || 'system';
  const speaker = speakerId === 'system' 
    ? { id: 'system', name: '系统', title: '', portrait_bg: '#374151', portrait_fg: '#9ca3af', portrait_ltr: 'SYS', description: '', alignment: '中立', role: '' }
    : dialogueData?.character;

  // 打字机效果
  useEffect(() => {
    if (!currentLine) return;
    
    setIsTyping(true);
    setDisplayedText('');
    setShowFullText(false);
    
    const fullText = currentLine.content;
    let charIndex = 0;
    
    const timer = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        setShowFullText(true);
        clearInterval(timer);
      }
    }, 30); // 30ms per character
    
    return () => clearInterval(timer);
  }, [currentIdx, currentLine]);

  // 自动滚动到底部
  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedText, currentIdx]);

  const handleNextLine = () => {
    if (isTyping) {
      // 跳过打字，直接显示完整文本
      setDisplayedText(currentLine?.content || '');
      setIsTyping(false);
      setShowFullText(true);
      return;
    }
    
    if (currentLine?.show_choice && currentLine.choices && currentLine.choices.length > 0) {
      return; // 显示选项，不自动下一行
    }
    
    if (currentIdx < (dialogueData?.dialogue.dialogues.length || 0) - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      onComplete?.();
    }
  };

  const handleChoiceSelect = (choice: DialogueChoice) => {
    const nextIdx = currentLine?.choices?.findIndex(c => c.text === choice.text) ?? -1;
    onChoiceSelected(choice, currentIdx + nextIdx + 1);
  };

  if (!dialogueData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      {/* 对话框 */}
      <div className={`
        w-full max-w-3xl mx-4 mb-4
        bg-gradient-to-b from-slate-800/95 to-slate-900/98
        rounded-2xl border-2 ${alignmentBorders[speaker?.alignment || '中立']}
        shadow-2xl overflow-hidden
        animate-slideUp
      `}>
        {/* 顶部装饰条 */}
        <div className={`h-1 w-full bg-gradient-to-r ${
          speaker?.alignment === '善良' ? 'from-green-500 to-emerald-400' :
          speaker?.alignment === '邪恶' ? 'from-red-600 to-rose-400' :
          speaker?.alignment === '灰色' ? 'from-orange-500 to-amber-400' :
          'from-yellow-500 to-amber-400'
        }`} />
        
        {/* 角色信息和标题 */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <CharacterPortrait 
              characterId={speaker?.id || 'system'} 
              size="lg" 
              bordered={false}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-lg">{speaker?.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full bg-slate-700 ${alignmentColors[speaker?.alignment || '中立']}`}>
                  {speaker?.alignment}
                </span>
              </div>
              <p className="text-xs text-slate-400">{speaker?.title || dialogueData.dialogue.title}</p>
            </div>
          </div>
          
          {/* 章节进度 */}
          <div className="text-right">
            <div className="text-xs text-slate-500">第{dialogueData.dialogue.chapter}章</div>
            <div className="flex gap-1 mt-1">
              {(dialogueData.dialogue.dialogues || []).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === currentIdx ? 'bg-amber-400' :
                    i < currentIdx ? 'bg-green-500' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* 对话内容区域 */}
        <div className="px-6 py-4 min-h-[120px] max-h-[300px] overflow-y-auto">
          {/* 情绪指示 */}
          <div className="flex items-center gap-2 mb-2">
            <EmotionIndicator emotion={currentLine?.emotion || 'normal'} />
            <span className="text-xs text-slate-500 italic">
              {currentLine?.emotion === 'eerie' && '（阴森森地）'}
              {currentLine?.emotion === 'happy' && '（微笑着）'}
              {currentLine?.emotion === 'angry' && '（愤怒地）'}
              {currentLine?.emotion === 'sad' && '（悲伤地）'}
              {currentLine?.emotion === 'warning' && '（严肃警告）'}
            </span>
          </div>
          
          {/* 对话文字 */}
          <div className="text-base leading-relaxed text-slate-100 whitespace-pre-wrap">
            <span className="text-amber-300 font-medium">{speaker?.name}：</span>
            <span className="text-slate-200">{displayedText}</span>
            {isTyping && (
              <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse ml-1" />
            )}
          </div>
          
          {/* 选项 */}
          {currentLine?.show_choice && currentLine.choices && showFullText && (
            <div className="mt-4 space-y-2">
              <div className="text-xs text-slate-500 mb-2">—— 请选择 ——</div>
              {currentLine.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => handleChoiceSelect(choice)}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-gradient-to-r from-slate-700/80 to-slate-800/80
                    border border-slate-600/50
                    text-left text-slate-100
                    hover:from-amber-900/60 hover:to-slate-800/80
                    hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/20
                    transition-all duration-200
                    group
                  "
                >
                  <span className="text-amber-400 mr-2 group-hover:mr-4 transition-all">▸</span>
                  {choice.text}
                  {choice.gain_quest && (
                    <span className="ml-2 text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      ✦ 新任务
                    </span>
                  )}
                  {choice.gain_item && (
                    <span className="ml-2 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      ✦ 获得物品
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          
          <div ref={dialogueEndRef} />
        </div>
        
        {/* 底部操作栏 */}
        <div className="px-6 py-3 flex items-center justify-between bg-slate-800/50 border-t border-slate-700/50">
          <div className="text-xs text-slate-500">
            {currentIdx + 1} / {dialogueData.dialogue.dialogues?.length || 0}
          </div>
          
          <div className="flex gap-2">
            {!currentLine?.show_choice && (
              <button
                onClick={handleNextLine}
                className="
                  px-4 py-1.5 rounded-lg text-sm
                  bg-slate-700 hover:bg-slate-600
                  text-slate-300 hover:text-white
                  transition-colors
                  flex items-center gap-2
                "
              >
                {isTyping ? '跳过' : '继续'}
                {!isTyping && <span className="text-xs">→</span>}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="
                px-4 py-1.5 rounded-lg text-sm
                bg-red-900/50 hover:bg-red-800/60
                text-red-300 hover:text-red-200
                border border-red-800/50
                transition-colors
              "
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 剧情提示条（底部显示当前任务/剧情进度）
export function StoryBanner({
  chapter,
  title,
  location,
}: {
  chapter: number;
  title: string;
  location: string;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-amber-900/90 via-yellow-900/80 to-amber-900/90 text-amber-100 text-xs py-1 px-4 text-center border-b border-amber-700/50">
      <span className="font-bold text-amber-300">第{chapter}章</span>
      <span className="mx-2 text-amber-600/50">|</span>
      <span>{title}</span>
      <span className="mx-2 text-amber-600/50">|</span>
      <span className="text-amber-400/70">📍 {location}</span>
    </div>
  );
}
