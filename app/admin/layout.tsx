'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<'admin' | 'viewer' | null>(null);
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) { setChecking(false); return; }
    fetch('/api/auth/check')
      .then(r => r.json())
      .then((data: any) => {
        if (data.authenticated) {
          setAuthenticated(true);
          setRole(data.role || 'admin');
        } else {
          router.replace('/admin/login');
        }
      })
      .catch(() => router.replace('/admin/login'))
      .finally(() => setChecking(false));
  }, [pathname, isLoginPage, router]);

  useEffect(() => {
    if (role === 'viewer' && (pathname === '/admin/customers' || pathname === '/admin/products')) {
      router.replace('/admin');
    }
  }, [role, pathname, router]);

  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.push('/admin/login');
  }

  if (isLoginPage) return <>{children}</>;
  if (checking) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
  if (!authenticated) return null;

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/surveys', label: 'แบบสำรวจ', icon: '📋' },
  ];

  if (role === 'admin') {
    navItems.push(
      { href: '/admin/customers', label: 'ห้าง/สาขา', icon: '🏪' },
      { href: '/admin/products', label: 'สินค้า', icon: '📦' }
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <nav style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--green) 100%)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>📋</span>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>RTV Admin</span>
        </div>
        <button onClick={logout} className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>ออกจากระบบ</button>
      </nav>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        <aside style={{ width: 220, background: 'white', borderRight: '1px solid var(--border)', padding: '20px 0', flexShrink: 0, position: 'sticky', top: 60, height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          {navItems.map(item => (
            <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', textDecoration: 'none', color: pathname === item.href ? 'var(--navy)' : 'var(--text-secondary)', background: pathname === item.href ? 'rgba(30,58,95,0.08)' : 'transparent', borderLeft: pathname === item.href ? '3px solid var(--navy)' : '3px solid transparent', fontWeight: pathname === item.href ? 600 : 400, transition: 'all 0.15s', fontSize: 15 }}>
              <span>{item.icon}</span>{item.label}
            </a>
          ))}
          <div style={{ margin: '20px 16px 0', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <a href="/" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>🔗 ดูหน้าแบบสำรวจ</a>
          </div>
        </aside>
        <main style={{ flex: 1, padding: 24, overflowX: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}
