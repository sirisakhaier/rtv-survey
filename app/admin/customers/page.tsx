'use client';

import { useEffect, useState } from 'react';

interface Customer {
  id: number; customer_name: string; store_id: string; store_name: string; province: string; region: string;
}

const REGIONS = ['กลาง', 'เหนือ', 'ใต้', 'ตะวันออก', 'ตะวันออกเฉียงเหนือ', 'ตะวันตก'];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({ customer_name: '', store_id: '', store_name: '', province: '', region: '' });

  function load() {
    setLoading(true);
    fetch('/api/customers?include_stores=true').then(r => r.json()).then((data: any) => setCustomers(data.customers || [])).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm({ customer_name: '', store_id: '', store_name: '', province: '', region: '' }); setShowForm(true); }
  function openEdit(c: Customer) { setEditing(c); setForm({ customer_name: c.customer_name, store_id: c.store_id, store_name: c.store_name, province: c.province, region: c.region }); setShowForm(true); }

  async function save() {
    if (!form.customer_name || !form.store_id || !form.store_name) return;
    setSaving(true);
    try {
      if (editing) { await fetch('/api/customers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) }); }
      else { await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); }
      setShowForm(false); load();
    } finally { setSaving(false); }
  }

  async function del(id: number) {
    if (!confirm('ยืนยันการลบ?')) return;
    setDeleting(id);
    await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
    setDeleting(null); load();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--navy)' }}>🏪 ห้าง / สาขา</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>จัดการข้อมูล Master Data ห้างและสาขา</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ เพิ่มสาขา</button>
      </div>
      <div className="card">
        {loading ? <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
            <table>
              <thead><tr><th>ID</th><th>ห้าง</th><th>รหัสสาขา</th><th>ชื่อสาขา</th><th>จังหวัด</th><th>ภาค</th><th>จัดการ</th></tr></thead>
              <tbody>
                {customers.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>ไม่มีข้อมูล</td></tr>
                : customers.map(c => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>#{c.id}</td>
                    <td><span style={{ fontWeight: 600 }}>{c.customer_name}</span></td>
                    <td><code style={{ background: '#f0f4f8', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>{c.store_id}</code></td>
                    <td>{c.store_name}</td><td>{c.province}</td><td>{c.region}</td>
                    <td><div style={{ display: 'flex', gap: 6 }}><button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>✏️</button><button className="btn btn-sm btn-danger" onClick={() => del(c.id)} disabled={deleting === c.id}>{deleting === c.id ? '...' : '🗑️'}</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="card-header"><h3 style={{ fontSize: 18, fontWeight: 700 }}>{editing ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}</h3></div>
            <div className="card-body">
              <div className="form-group"><label className="form-label">ชื่อห้าง <span className="required">*</span></label><input type="text" className="form-control" placeholder="เช่น Lotus" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">รหัสสาขา <span className="required">*</span></label><input type="text" className="form-control" placeholder="เช่น LT001" value={form.store_id} onChange={e => setForm(f => ({ ...f, store_id: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">ชื่อสาขา <span className="required">*</span></label><input type="text" className="form-control" placeholder="เช่น โลตัส รัชดา" value={form.store_name} onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">จังหวัด</label><input type="text" className="form-control" placeholder="เช่น กรุงเทพมหานคร" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">ภาค</label><select className="form-control" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}><option value="">-- เลือกภาค --</option>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <div style={{ display: 'flex', gap: 12 }}><button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? '⏳...' : '💾 บันทึก'}</button><button className="btn btn-secondary" onClick={() => setShowForm(false)}>ยกเลิก</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
