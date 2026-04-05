import { Character, GameEvent, ChatMessage, InteractResponse } from '@/types';

// Use relative URL to work with reverse proxy on any host
function getBaseUrl() {
  // Use relative URLs for proxy - Next.js rewrites /api/* to backend
  if (typeof window !== 'undefined' && window.location.origin) {
    return '';  // Use relative URL, let Next.js rewrite handle it
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
}

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const baseUrl = getBaseUrl();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const auth = {
  register: async (username: string, password: string, email: string) => {
    return fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
  },

  login: async (username: string, password: string) => {
    const data = await fetchApi<{ token: string; player_id: string; username: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('token', data.token);
    return data;
  },
};

// Characters API
export const characters = {
  list: async (): Promise<Character[]> => {
    return fetchApi<Character[]>('/api/characters');
  },

  create: async (data: {
    name: string;
    background?: string;
    traits?: string[];
    alignment?: string;
  }): Promise<Character> => {
    return fetchApi<Character>('/api/characters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  get: async (id: string): Promise<Character> => {
    return fetchApi<Character>(`/api/characters/${id}`);
  },

  move: async (id: string, region: string, x: number = 0, y: number = 0, z: number = 0): Promise<Character> => {
    return fetchApi<Character>(`/api/characters/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ region, x, y, z }),
    });
  },

  interact: async (id: string, dealerId: string, dealerType: string): Promise<InteractResponse> => {
    return fetchApi<InteractResponse>(`/api/characters/${id}/interact`, {
      method: 'POST',
      body: JSON.stringify({ dealer_id: dealerId, dealer_type: dealerType }),
    });
  },

  events: async (id: string): Promise<GameEvent[]> => {
    return fetchApi<GameEvent[]>(`/api/characters/${id}/events`);
  },

  chat: async (id: string): Promise<ChatMessage[]> => {
    return fetchApi<ChatMessage[]>(`/api/characters/${id}/chat`);
  },

  equip: async (id: string, itemId: string, equipped: boolean): Promise<Character> => {
    return fetchApi<Character>(`/api/characters/${id}/equip`, {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, equipped }),
    });
  },

  combatStart: async (id: string) => {
    return fetchApi(`/api/characters/${id}/combat/start`, { method: 'POST' });
  },

  combatAction: async (id: string, action: string, skillId?: string) => {
    return fetchApi(`/api/characters/${id}/combat/action`, {
      method: 'POST',
      body: JSON.stringify({ action, skill_id: skillId }),
    });
  },
};

// Regions/MAP API
export const regions = {
  getRegionInfo: async (characterId: string): Promise<any> => {
    return fetchApi(`/api/characters/${characterId}/region`);
  },
  list: async () => {
    return fetchApi('/api/regions/list');
  },
  move: async (characterId: string, regionId: string) => {
    return fetchApi(`/api/characters/${characterId}/move`, {
      method: 'POST',
      body: JSON.stringify({ region: regionId, x: 0, y: 0, z: 0 }),
    });
  },
};

// WebSocket
export function createWebSocket(characterId: string, onMessage: (data: unknown) => void) {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:8080';
  const wsBaseUrl = protocol === 'wss:' 
    ? `wss://${host}` 
    : `ws://${host}`;
  const token = getToken();
  
  const ws = new WebSocket(`${wsBaseUrl}/ws/${characterId}`);
  
  ws.onopen = () => {
    // Send auth on connect
    ws.send(JSON.stringify({ type: 'auth', token }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
}

// 对话系统API
export const dialogues = {
  // 获取当前区域的对话（自动根据角色位置和进度返回）
  getRegionDialogue: async (characterId: string) => {
    return fetchApi(`/api/dialogue/region`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  // 获取指定章节的对话
  getChapterDialogue: async (characterId: string, chapter: number) => {
    return fetchApi(`/api/dialogue/chapter/${chapter}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  // 获取指定NPC的对话
  getNPCDialogue: async (characterId: string, npcId: string) => {
    return fetchApi(`/api/dialogue/npc/${npcId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  },

  // 提交对话选择
  submitChoice: async (characterId: string, dialogueId: string, choiceIdx: number, flag?: string, quest?: string, item?: string) => {
    return fetchApi(`/api/dialogue/choice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ characterId, dialogueId, choiceIdx, flag: flag || '', quest: quest || '', item: item || '' }),
    });
  },
};

// 角色资料API
export const characterProfiles = {
  // 获取所有角色资料
  list: async () => {
    return fetchApi('/api/characters/profiles');
  },

  // 获取指定角色资料
  get: async (npcId: string) => {
    return fetchApi(`/api/characters/profiles/${npcId}`);
  },
};

// 角色存档API
export const characterSave = {
  // 保存角色游戏状态
  save: async (characterId: string, state: {
    x?: number; y?: number;
    hp?: number; maxHp?: number;
    mp?: number; maxMp?: number;
    level?: number; exp?: number;
    gold?: number; attack?: number; defense?: number;
    facing?: string; hasSeenIntro?: boolean;
  }) => {
    return fetchApi(`/api/characters/${characterId}/save`, {
      method: 'PUT',
      body: JSON.stringify(state),
    });
  },
};

// API object for default export
export const api = {
  register: auth.register,
  login: auth.login,
};
