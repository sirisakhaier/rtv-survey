'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [adminEmail, setAdminEmail] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load settings');
        return r.json();
      })
      .then((data: any) => {
        setAdminEmail(data.admin_email || '');
        setResendApiKey(data.resend_api_key || '');
      })
      .catch(() => setErrorMsg('ไม่สามารถโหลดข้อมูลตั้งค่าได้'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_email: adminEmail, resend_api_key: resendApiKey }),
      });
      if (res.ok) {
        setMessage('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
      } else {
        const data = await res.json() as any;
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--navy)' }}>⚙️ ตั้งค่าระบบการส่งเมล</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          จัดการอีเมลปลายทางที่จะรับแจ้งเตือนเมื่อมีผู้ส่งแบบสำรวจ RTV และรหัส Resend API Key
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <form onSubmit={handleSave} className="card" style={{ padding: 24 }}>
          {message && <div className="alert alert-success" style={{ marginBottom: 20 }}>✅ {message}</div>}
          {errorMsg && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠️ {errorMsg}</div>}

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              อีเมลปลายทางที่จะรับแจ้งเตือน (Target Email) <span className="required">*</span>
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="เช่น admin@yourcompany.com"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              required
              style={{ padding: '10px 14px' }}
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              ระบบจะส่งอีเมลรายละเอียดและลิงก์ประเมินไปยังอีเมลนี้ทุกครั้งเมื่อมีผู้ส่งข้อมูลแบบสำรวจเสร็จสมบูรณ์
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Resend API Key <span className="required">*</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showApiKey ? 'text' : 'password'}
                className="form-control"
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                value={resendApiKey}
                onChange={e => setResendApiKey(e.target.value)}
                required
                style={{ flex: 1, padding: '10px 14px', fontFamily: 'monospace', fontSize: 14 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowApiKey(!showApiKey)}
                style={{ padding: '0 16px', minWidth: 70 }}
              >
                {showApiKey ? '👁️ ซ่อน' : '👁️ แสดง'}
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              รหัสสำหรับการเชื่อมต่อบริการส่งเมล Resend (ระบบจะใช้รหัสที่คุณแนบให้เป็นค่าตั้งต้น)
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 600 }}
          >
            {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
          </button>
        </form>
      )}
    </div>
  );
}
