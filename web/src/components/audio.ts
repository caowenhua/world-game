// ============================================================
//  Audio System - Web Audio API 8-bit style sound effects
// ============================================================

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

// Resume audio context on user interaction (required by browsers)
export function resumeAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (e) {
    // Audio not available
  }
}

// Create an oscillator-based sound effect
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'square',
  volume: number = 0.15,
  startDelay: number = 0,
  frequencyEnd?: number
): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay);
    if (frequencyEnd !== undefined) {
      osc.frequency.linearRampToValueAtTime(frequencyEnd, ctx.currentTime + startDelay + duration);
    }
    
    gain.gain.setValueAtTime(volume, ctx.currentTime + startDelay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
    
    osc.start(ctx.currentTime + startDelay);
    osc.stop(ctx.currentTime + startDelay + duration);
  } catch (e) {
    // Audio not available
  }
}

// Move sound - quick footstep
export function playMoveSound(): void {
  playTone(220, 0.05, 'square', 0.08);
  playTone(180, 0.04, 'square', 0.06, 0.03);
}

// Attack sound - sword swing
export function playAttackSound(): void {
  playTone(300, 0.08, 'sawtooth', 0.12);
  playTone(200, 0.1, 'square', 0.1, 0.02);
  playTone(150, 0.06, 'square', 0.08, 0.05);
}

// Light damage sound
export function playHurtLightSound(): void {
  playTone(400, 0.1, 'square', 0.1);
  playTone(300, 0.08, 'square', 0.08, 0.06);
}

// Heavy damage sound
export function playHurtHeavySound(): void {
  playTone(200, 0.15, 'sawtooth', 0.15);
  playTone(150, 0.12, 'square', 0.12, 0.08);
  playTone(100, 0.2, 'sawtooth', 0.1, 0.15);
}

// Level up - ascending triumphant notes
export function playLevelUpSound(): void {
  playTone(330, 0.1, 'square', 0.12);
  playTone(440, 0.1, 'square', 0.12, 0.1);
  playTone(550, 0.1, 'square', 0.12, 0.2);
  playTone(660, 0.15, 'square', 0.15, 0.3);
  playTone(880, 0.2, 'square', 0.18, 0.4);
}

// Get item sound - sparkle
export function playItemSound(): void {
  playTone(600, 0.08, 'sine', 0.1);
  playTone(800, 0.08, 'sine', 0.1, 0.06);
  playTone(1000, 0.1, 'sine', 0.1, 0.12);
}

// Save game sound - soft confirmation
export function playSaveSound(): void {
  playTone(440, 0.1, 'sine', 0.08);
  playTone(550, 0.08, 'sine', 0.08, 0.08);
  playTone(660, 0.12, 'sine', 0.1, 0.16);
}

// Open chest sound
export function playChestSound(): void {
  playTone(200, 0.1, 'square', 0.1);
  playTone(300, 0.08, 'square', 0.1, 0.05);
  playTone(400, 0.1, 'square', 0.12, 0.1);
  playTone(600, 0.15, 'sine', 0.1, 0.15);
}

// Monster cry (varies by type)
// MP insufficient sound - short "beep beep" warning
export function playMPInsufficientSound(): void {
  playTone(440, 0.1, 'square', 0.3);
  playTone(330, 0.1, 'square', 0.3, 0.1);
}

export function playMonsterCry(type: string): void {
  if (type === 'slime') {
    playTone(250, 0.15, 'sine', 0.1);
    playTone(200, 0.2, 'sine', 0.1, 0.1);
  } else if (type === 'wolf') {
    playTone(150, 0.2, 'sawtooth', 0.12);
    playTone(180, 0.15, 'sawtooth', 0.1, 0.15);
  } else if (type === 'goblin') {
    playTone(400, 0.08, 'square', 0.1);
    playTone(350, 0.08, 'square', 0.1, 0.06);
    playTone(300, 0.1, 'square', 0.1, 0.12);
  } else {
    playTone(300, 0.15, 'square', 0.1);
  }
}

// BGM - simple 8-bit loop (call startBGM / stopBGM)
// ============================================================
let bgmGain: GainNode | null = null;
let bgmInterval: ReturnType<typeof setInterval> | null = null;

const BGM_NOTES = [
  // Simple chiptune melody - C major pentatonic loop
  { freq: 262, dur: 0.2 }, // C
  { freq: 294, dur: 0.2 }, // D
  { freq: 330, dur: 0.2 }, // E
  { freq: 392, dur: 0.2 }, // G
  { freq: 440, dur: 0.2 }, // A
  { freq: 392, dur: 0.2 }, // G
  { freq: 330, dur: 0.2 }, // E
  { freq: 294, dur: 0.2 }, // D
  { freq: 262, dur: 0.2 }, // C
  { freq: 294, dur: 0.2 }, // D
  { freq: 330, dur: 0.4 }, // E
  { freq: 0,   dur: 0.2 }, // rest
  { freq: 392, dur: 0.2 }, // G
  { freq: 440, dur: 0.2 }, // A
  { freq: 523, dur: 0.4 }, // C
  { freq: 0,   dur: 0.2 }, // rest
];

export function startBGM(volume: number = 0.05): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') return;
    
    stopBGM();
    
    bgmGain = ctx.createGain();
    bgmGain.gain.setValueAtTime(volume, ctx.currentTime);
    bgmGain.connect(ctx.destination);
    
    let noteIdx = 0;
    const playNextNote = () => {
      if (!bgmGain) return;
      const note = BGM_NOTES[noteIdx % BGM_NOTES.length];
      if (note.freq > 0) {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.connect(noteGain);
        noteGain.connect(bgmGain!);
        osc.type = 'square';
        osc.frequency.setValueAtTime(note.freq, ctx.currentTime);
        noteGain.gain.setValueAtTime(0.8, ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.dur * 0.9);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + note.dur);
      }
      noteIdx++;
    };
    
    playNextNote();
    bgmInterval = setInterval(playNextNote, 250);
  } catch (e) {
    // Audio not available
  }
}

export function stopBGM(): void {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
  if (bgmGain) {
    try {
      bgmGain.disconnect();
    } catch (e) {}
    bgmGain = null;
  }
  // Bug #12: Ensure AudioContext is resumed after BGM stops
  resumeAudio();
}

// P2-1: Set BGM volume (for MOOD ambient effect)
export function setBGMVolume(volume: number): void {
  try {
    const ctx = getAudioContext();
    if (bgmGain && ctx) {
      bgmGain.gain.setValueAtTime(volume, ctx.currentTime);
    }
  } catch (e) {
    // Audio not available
  }
}

// Get audio context for external use (P2-1)
export function getAudioCtx(): AudioContext | null {
  return audioCtx;
}

// Get BGM gain node for external use (P2-1)
export function getBGMGain(): GainNode | null {
  return bgmGain;
}
