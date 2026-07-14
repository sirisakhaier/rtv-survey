'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalSurveys: number;
  totalProductsReported: number;
  totalStores: number;
  recentSurveys: { id: number; respondent_name: string; submitted_at: string; customer_name: string; store_name: string; detail_count: number; }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then((data: any) => setStats(data)).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'แบบสำรวจทั้งหมด', value: stats?.totalSurveys ?? '-', icon: '📋', color: '#1e3a5f' },
    { label: 'สินค้าที่รายงาน', value: stats?.totalProductsReported ?? '-', icon: '📦', color: '#2d6a4f' },
    { label: 'สาขาในระบบ', value: stats?.totalStores ?? '-', icon: '🏪', color: '#d69e2e' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--navy)' }}>📊 Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>ภาพรวมระบบสำรวจ RTV</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map(card => (
          <div key={card.label} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 32 }}>{card.icon}</span>
              <span style={{ background: card.color, color: 'white', borderRadius: 8, padding: '4px 12px', fontSize: 22, fontWeight: 700 }}>{loading ? '...' : card.value}</span>
            </div>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>แบบสำรวจล่าสุด</h2>
          <a href="/admin/surveys" className="btn btn-sm btn-secondary">ดูทั้งหมด →</a>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
            <table>
              <thead><tr><th>รหัส</th><th>ห้าง / สาขา</th><th>ผู้ให้ข้อมูล</th><th>สินค้า</th><th>วันที่ส่ง</th></tr></thead>
              <tbody>
                {(stats?.recentSurveys || []).length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>ยังไม่มีข้อมูล</td></tr>
                ) : stats?.recentSurveys.map(s => (
                  <tr key={s.id}>
                    <td><span style={{ fontWeight: 700, color: 'var(--navy)' }}>#{s.id}</span></td>
                    <td>{s.customer_name} - {s.store_name}</td>
                    <td>{s.respondent_name}</td>
                    <td><span className="badge badge-submitted">{s.detail_count} รายการ</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.submitted_at ? new Date(s.submitted_at).toLocaleString('th-TH') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <a href="/api/export?include_photos=true" className="btn btn-primary">📥 Export Excel (พร้อมรูป)</a>
        <a href="/api/export?include_photos=false" className="btn btn-secondary">📄 Export Excel (ไม่มีรูป)</a>
      </div>
    </div>
  );
}
