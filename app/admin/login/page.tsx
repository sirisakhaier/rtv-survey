'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) { setError('กรุณากรอก Username และ Password'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) { router.push('/admin'); router.refresh(); }
      else { const data = (await res.json()) as any; setError(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); }
    } catch { setError('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #005AAB 0%, #002f6c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <div className="card-header" style={{ textAlign: 'center' }}>
          <img src="/haier-logo.png" alt="Haier Logo" style={{ height: 80, margin: '0 auto 8px', display: 'block', borderRadius: 10 }} />
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Haier Electrical Appliances (Thailand) Company Limited
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin Dashboard</h1>
          <p style={{ opacity: 0.8, fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>RTV Survey Management System</p>
          <p style={{ opacity: 0.6, fontSize: 11, marginTop: 2 }}>Sell out team | Haier Thailand</p>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="form-control" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🔑 เข้าสู่ระบบ'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <a href="/" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>← กลับหน้าแบบสำรวจ</a>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#fafafa', color: 'var(--text-muted)', fontSize: 10, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
          Haier Electrical Appliances (Thailand) Company Limited
          <br /><strong>Sell out team</strong>
        </div>
      </div>
    </div>
  );
}
