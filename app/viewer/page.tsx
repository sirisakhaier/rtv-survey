'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ViewerPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );
}
