'use client';

import { useState, useEffect, useCallback } from 'react';
import { Character, GameEvent, InteractResponse } from '@/types';
import { api, auth } from '@/lib/api';
import { useGameStore } from '@/lib/store';

// Components
import Login from '@/components/Login';
import CharacterSelect from '@/components/CharacterSelect';
import CreateCharacter from '@/components/CreateCharacter';
import GameUI from '@/components/GameUI';
import GameMap from '@/components/GameMap';
import ImprovedRPG from '@/components/ImprovedRPG';

export default function Home() {
  const { user, character, setUser, setCharacter, setToken } = useGameStore();
  const [view, setView] = useState<'login' | 'select' | 'create' | 'game'>('login');
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setToken(token);
      setView('select');
    }
  }, [setToken]);

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    try {
      const data = await auth.login(username, password);
      setToken(data.token);
      setUser({ id: data.player_id, username: data.username });
      setView('select');
    } catch (err) {
      alert('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (username: string, password: string, email: string) => {
    setLoading(true);
    try {
      await api.register(username, password, email);
      // After register, login to get token and update store
      const data = await auth.login(username, password);
      setToken(data.token);
      setUser({ id: data.player_id, username: data.username });
      setView('select');
    } catch (err) {
      alert('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterSelect = (char: Character) => {
    setCharacter(char);
    setView('game');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCharacter(null);
    setView('login');
  };

  return (
    <div className="min-h-screen bg-dark-300 text-gray-100">
      {view === 'login' && (
        <Login 
          onLogin={handleLogin} 
          onRegister={handleRegister}
          loading={loading}
        />
      )}
      {view === 'select' && (
        <CharacterSelect
          onSelect={handleCharacterSelect}
          onCreate={() => setView('create')}
          onLogout={handleLogout}
        />
      )}
      {view === 'create' && (
        <CreateCharacter
          onCreated={handleCharacterSelect}
          onBack={() => setView('select')}
        />
      )}
      {view === 'game' && character && (
        <div className="w-full h-screen">
          <ImprovedRPG character={character} />
        </div>
      )}
    </div>
  );
}
