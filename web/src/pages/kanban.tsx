'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: string;
  state: string;
  title: string;
  org?: string;
  official?: string;
  created_at?: string;
  updated_at?: string;
  flow?: Array<{ from: string; to: string; remark: string; timestamp: string }>;
  output?: string;
  summary?: string;
  progress?: { current: string; plan: string[] };
  todos?: Array<{ text: string; status: string }>;
}

const STATE_COLORS: Record<string, string> = {
  Zhongshu: 'bg-purple-900 border-purple-500',
  Taizi: 'bg-amber-900 border-amber-500',
  Assigned: 'bg-blue-900 border-blue-500',
  Doing: 'bg-green-900 border-green-500',
  Review: 'bg-yellow-900 border-yellow-500',
  Done: 'bg-slate-800 border-slate-500',
  Blocked: 'bg-red-900 border-red-500',
};

const STATE_LABELS: Record<string, string> = {
  Zhongshu: '中书省',
  Taizi: '太子',
  Assigned: '尚书省',
  Doing: '执行中',
  Review: '审核中',
  Done: '✅ 已完成',
  Blocked: '⛔ 阻塞',
};

const ORG_COLORS: Record<string, string> = {
  '太子': 'text-amber-400',
  '中书省': 'text-purple-400',
  '尚书省': 'text-blue-400',
  '门下省': 'text-green-400',
};

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetch('/api/kanban/tasks')
      .then(r => r.json())
      .then(d => { setTasks(d.tasks || []); setLoading(false); })
      .catch(() => {
        // fallback: direct import if API not available
        setLoading(false);
      });
  }, []);

  const tasksByState = (state: string) => tasks.filter(t => t.state === state);

  const states = ['Zhongshu', 'Doing', 'Review', 'Done'];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border-b border-amber-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-amber-400">🏛️ 三省六部 · 政务看板</h1>
        <p className="text-slate-400 text-sm mt-1">任务总数：{tasks.length} | 最后更新：{new Date().toLocaleString('zh-CN')}</p>
      </div>

      {/* 三省六部架构图 */}
      <div className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="flex flex-wrap gap-6 justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/50 border border-amber-600 rounded-xl">
            <span className="text-2xl">👑</span>
            <div>
              <div className="text-amber-400 font-bold">皇上</div>
              <div className="text-amber-300 text-xs">最高决策</div>
            </div>
          </div>
          <div className="text-slate-600 text-3xl flex items-center">→</div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/50 border border-amber-600 rounded-xl">
            <span className="text-2xl">👑</span>
            <div>
              <div className="text-amber-400 font-bold">太子</div>
              <div className="text-amber-300 text-xs">旨意传达</div>
            </div>
          </div>
          <div className="text-slate-600 text-3xl flex items-center">→</div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-900/50 border border-purple-600 rounded-xl">
            <span className="text-2xl">📝</span>
            <div>
              <div className="text-purple-400 font-bold">中书省</div>
              <div className="text-purple-300 text-xs">规划执行</div>
            </div>
          </div>
          <div className="text-slate-600 text-3xl flex items-center">→</div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/50 border border-blue-600 rounded-xl">
            <span className="text-2xl">⚔️</span>
            <div>
              <div className="text-blue-400 font-bold">尚书省</div>
              <div className="text-blue-300 text-xs">执行落地</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 px-6 py-3 bg-slate-900/50">
        {states.map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${STATE_COLORS[s]?.split(' ')[0]?.replace('bg-', 'bg-')}`} 
                 style={{ backgroundColor: s === 'Zhongshu' ? '#581c87' : s === 'Done' ? '#1e293b' : s === 'Doing' ? '#166534' : '#854d0e' }} />
            <span className="text-sm text-slate-400">{STATE_LABELS[s] || s}: <b className="text-white">{tasksByState(s).length}</b></span>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 animate-pulse">加载中...</div>
        </div>
      ) : (
        <div className="flex gap-4 p-4 overflow-x-auto" style={{ minHeight: 'calc(100vh - 180px)' }}>
          {states.map(state => (
            <div key={state} className={`flex-shrink-0 w-80 rounded-xl border-t-4 ${STATE_COLORS[state] || 'bg-slate-800 border-slate-500'} bg-slate-900/80 flex flex-col`}>
              <div className="px-4 py-3 border-b border-slate-700">
                <h2 className="font-bold text-white">{STATE_LABELS[state] || state}</h2>
                <span className="text-xs text-slate-400">{tasksByState(state).length} 个任务</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                {tasksByState(state).map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="bg-slate-800/80 rounded-lg p-3 border border-slate-700 hover:border-amber-500 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10"
                  >
                    <div className="text-xs text-amber-400 font-mono mb-1">{task.id}</div>
                    <div className="text-sm text-slate-200 leading-relaxed">{task.title}</div>
                    {task.org && (
                      <div className="mt-2 text-xs text-slate-500">
                        <span className={ORG_COLORS[task.org] || 'text-slate-400'}>{task.org}</span>
                        {task.official && <span className="text-slate-600"> · {task.official}</span>}
                      </div>
                    )}
                    {task.progress && (
                      <div className="mt-2">
                        <div className="text-xs text-slate-500 mb-1">{task.progress.current}</div>
                        <div className="flex gap-1 flex-wrap">
                          {(task.progress.plan || []).map((p, i) => (
                            <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${p.includes('✅') ? 'bg-green-900 text-green-300' : p.includes('🔄') ? 'bg-yellow-900 text-yellow-300' : 'bg-slate-700 text-slate-400'}`}>{p}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {task.flow && task.flow.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {task.flow.slice(-2).map((f, i) => (
                          <span key={i} className="text-xs bg-slate-700 text-slate-400 px-1.5 rounded">{f.to}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {tasksByState(state).length === 0 && (
                  <div className="text-center text-slate-600 py-8 text-sm">暂无任务</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTask(null)}>
          <div className="bg-slate-900 border border-amber-600 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-amber-400 font-mono text-sm">{selectedTask.id}</div>
                <h3 className="text-xl font-bold text-white mt-1">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="flex gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs ${STATE_COLORS[selectedTask.state]?.split(' ')[0]} border`}>
                {STATE_LABELS[selectedTask.state] || selectedTask.state}
              </span>
              {selectedTask.org && <span className="px-3 py-1 rounded-full text-xs bg-slate-700 text-slate-300">{selectedTask.org}</span>}
            </div>
            {selectedTask.summary && (
              <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">完成摘要</div>
                <div className="text-sm text-slate-300">{selectedTask.summary}</div>
              </div>
            )}
            {selectedTask.progress && (
              <div className="mb-4 p-3 bg-slate-800 rounded-lg">
                <div className="text-xs text-slate-500 mb-2">当前动态：{selectedTask.progress.current}</div>
                <div className="flex gap-2 flex-wrap">
                  {(selectedTask.progress.plan || []).map((p, i) => (
                    <span key={i} className={`text-xs px-2 py-1 rounded ${p.includes('✅') ? 'bg-green-900 text-green-300' : p.includes('🔄') ? 'bg-yellow-900 text-yellow-300' : 'bg-slate-700 text-slate-400'}`}>{p}</span>
                  ))}
                </div>
              </div>
            )}
            {selectedTask.flow && selectedTask.flow.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-slate-500 mb-2">流转记录</div>
                <div className="space-y-2">
                  {selectedTask.flow.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">{f.from}</span>
                      <span className="text-amber-600">→</span>
                      <span className="text-slate-300">{f.to}</span>
                      <span className="text-slate-600 flex-1 truncate">· {f.remark}</span>
                      <span className="text-slate-600 text-xs">{f.timestamp?.substring(11, 16)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
