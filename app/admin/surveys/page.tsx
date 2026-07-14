'use client';

import { useEffect, useState } from 'react';

interface Survey {
  id: number; customer_name: string; store_id: string; store_name: string;
  province: string; region: string; respondent_name: string; respondent_phone: string;
  status: string; submitted_at: string | null; created_at: string; detail_count: number;
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  function load(p = 1) {
    setLoading(true);
    fetch(`/api/surveys?page=${p}&limit=20`)
      .then(r => r.json())
      .then((data: any) => { setSurveys(data.surveys || []); setTotal(data.total || 0); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(page); }, [page]);

  async function deleteSurvey(id: number) {
    if (!confirm(`ยืนยันการลบแบบสำรวจ #${id}?`)) return;
    setDeleting(id);
    await fetch(`/api/surveys/${id}`, { method: 'DELETE' });
    setDeleting(null);
    load(page);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--navy)' }}>📋 แบบสำรวจทั้งหมด</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>ทั้งหมด {total} รายการ</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/api/export?include_photos=true" className="btn btn-primary btn-sm">📥 Export พร้อมรูป</a>
          <a href="/api/export?include_photos=false" className="btn btn-secondary btn-sm">📄 Export ไม่มีรูป</a>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
            <table>
              <thead><tr><th>รหัส</th><th>ห้าง</th><th>สาขา</th><th>จังหวัด</th><th>ผู้ให้ข้อมูล</th><th>เบอร์โทร</th><th>สินค้า</th><th>สถานะ</th><th>วันที่ส่ง</th><th>จัดการ</th></tr></thead>
              <tbody>
                {surveys.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>ไม่มีข้อมูล</td></tr>
                ) : surveys.map(s => (
                  <tr key={s.id}>
                    <td><span style={{ fontWeight: 700, color: 'var(--navy)' }}>#{s.id}</span></td>
                    <td>{s.customer_name}</td>
                    <td>{s.store_name}<br /><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.store_id}</span></td>
                    <td style={{ fontSize: 13 }}>{s.province}</td>
                    <td>{s.respondent_name}</td>
                    <td style={{ fontSize: 13 }}>{s.respondent_phone}</td>
                    <td><span className="badge badge-submitted">{s.detail_count} รายการ</span></td>
                    <td><span className={`badge badge-${s.status}`}>{s.status === 'submitted' ? 'ส่งแล้ว' : 'ฉบับร่าง'}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.submitted_at ? new Date(s.submitted_at).toLocaleString('th-TH') : '-'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => deleteSurvey(s.id)} disabled={deleting === s.id}>{deleting === s.id ? '...' : '🗑️'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← ก่อนหน้า</button>
            <span style={{ padding: '8px 16px', fontSize: 14, color: 'var(--text-secondary)' }}>หน้า {page} / {totalPages}</span>
            <button className="btn btn-sm btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>ถัดไป →</button>
          </div>
        )}
      </div>
    </div>
  );
}
