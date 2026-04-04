'use client';

import { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  onRegister: (username: string, password: string, email: string) => void;
  loading: boolean;
}

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: `${Math.random() * 2}s`,
  duration: `${3 + Math.random() * 2}s`,
}));

export default function Login({ onLogin, onRegister, loading }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      onRegister(username, password, email);
    } else {
      onLogin(username, password);
    }
  };

  return (
    <>
      <style>{`
        @keyframes particleFloat {
          0%, 100% { transform: translateY(-20px); opacity: 0.2; }
          50% { transform: translateY(20px); opacity: 0.5; }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: scale(1.2); }
          50% { transform: scale(1); }
        }
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoEntrance {
          from { transform: scale(0.8); }
          to { transform: scale(1); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes emailSlideIn {
          from { opacity: 0; height: 0; }
          to { opacity: 1; height: auto; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .particle {
          animation: particleFloat var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
        }
        .orb1 {
          animation: orbFloat1 4s ease-in-out infinite;
        }
        .orb2 {
          animation: orbFloat2 5s ease-in-out infinite;
        }
        .card-enter {
          animation: cardEntrance 0.6s ease-out forwards;
        }
        .logo-enter {
          animation: logoEntrance 0.4s ease-out forwards;
        }
        .gradient-text {
          background-size: 200% auto;
          animation: gradientShift 3s ease infinite;
        }
        .email-field {
          animation: emailSlideIn 0.3s ease-out forwards;
        }
        .submit-btn:hover {
          transform: scale(1.02);
        }
        .submit-btn:active {
          transform: scale(0.98);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
           style={{
             background: 'linear-gradient(135deg, #0a0f1a 0%, #1e293b 50%, #0a0f1a 100%)',
           }}>
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-2 rounded-full bg-amber-500/20 particle"
              style={{
                left: p.left,
                top: p.top,
                '--delay': p.delay,
                '--duration': p.duration,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl orb1" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl orb2" />

        {/* Login card */}
        <div
          className={`relative z-10 w-full max-w-md px-8 ${mounted ? 'card-enter' : 'opacity-0'}`}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-30" />
            
            <div className="relative bg-dark-200/90 backdrop-blur-xl rounded-2xl p-8 border border-amber-500/20">
              {/* Logo */}
              <div className={`text-center mb-8 ${mounted ? 'logo-enter' : 'opacity-0'}`}>
                <h1
                  className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent gradient-text"
                >
                  羊蹄山之魂
                </h1>
                <p className="text-gray-400 mt-2 text-sm">AI驱动的开放世界RPG</p>
              </div>

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
                  <div className="email-field">
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
                  </div>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="submit-btn w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600
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
                </button>
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
        </div>
      </div>
    </>
  );
}
