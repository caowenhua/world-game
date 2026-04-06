'use client';

import dynamic from 'next/dynamic';

const ImprovedRPG = dynamic(() => import('@/components/ImprovedRPG').then(m => m.default), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-lg">加载中...</div>
    </div>
  ),
});

export default function RPGPage() {
  return <ImprovedRPG />;
}
