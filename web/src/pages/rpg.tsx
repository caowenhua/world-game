'use client';

import { useEffect, useState } from 'react';

export default function RPGPage() {
  const [mounted, setMounted] = useState(false);
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    setMounted(true);
    import('@/components/ImprovedRPG').then(mod => {
      setComponent(() => mod.default);
    });
  }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#888', fontSize: '16px' }}>加载中</span>
      </div>
    );
  }

  if (!Component) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#888', fontSize: '16px' }}>加载中</span>
      </div>
    );
  }

  return <Component />;
}
