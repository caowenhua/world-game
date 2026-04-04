'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  onRegister: (username: string, password: string, email: string) => void;
  loading: boolean;
}

export default function Login({ onLogin, onRegister, loading }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      onRegister(username, password, email);
    } else {
      onLogin(username, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{
           background: 'linear-gradient(135deg, #0a0f1a 0%, #1e293b 50%, #0a0f1a 100%)',
         }}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-amber-500/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-8"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-30" />
          
          <div className="relative bg-dark-200/90 backdrop-blur-xl rounded-2xl p-8 border border-amber-500/20">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-center mb-8"
            >
              <motion.h1
                className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent"
                animate={{ backgroundPosition: ['0%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                style={{ backgroundSize: '200%' }}
              >
                羊蹄山之魂
              </motion.h1>
              <p className="text-gray-400 mt-2 text-sm">AI驱动的开放世界RPG</p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  角色名称
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-300/50 border border-gray-700 rounded-lg
                           text-gray-100 placeholder-gray-500
                           focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20
                           transition-all duration-200"
                  placeholder="输入你的名字"
                  required
                />
              </div>

              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    电子邮箱
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-300/50 border border-gray-700 rounded-lg
                             text-gray-100 placeholder-gray-500
                             focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20
                             transition-all duration-200"
                    placeholder="your@email.com"
                    required
                  />
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-300/50 border border-gray-700 rounded-lg
                           text-gray-100 placeholder-gray-500
                           focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20
                           transition-all duration-200"
                  placeholder="••••••••"
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600
                         text-white font-semibold rounded-lg
                         shadow-lg shadow-amber-500/30
                         hover:from-amber-500 hover:to-orange-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    处理中...
                  </span>
                ) : (
                  isRegister ? '创建角色' : '进入世界'
                )}
              </motion.button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm text-amber-400/80 hover:text-amber-400 transition-colors"
              >
                {isRegister ? '已有账号？登录' : '没有账号？注册'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
