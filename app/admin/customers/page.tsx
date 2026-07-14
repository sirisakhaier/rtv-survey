'use client';

import { useEffect, useState, useRef } from 'react';

interface Customer {
  id: number; customer_name: string; store_id: string; store_name: string; province: string; region: string;
}

const REGIONS = ['กลาง', 'เหนือ', 'ใต้', 'ตะวันออก', 'ตะวันออกเฉียงเหนือ', 'ตะวันตก'];

function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentToken = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(currentToken.trim());
      lines.push(row);
      row = [];
      currentToken = '';
    } else {
      currentToken += char;
    }
  }
  if (currentToken || row.length > 0) {
    row.push(currentToken.trim());
    lines.push(row);
  }
  return lines.filter(r => r.some(cell => cell !== ''));
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({ customer_name: '', store_id: '', store_name: '', province: '', region: '' });
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    setErrorMsg('');
    fetch('/api/customers?include_stores=true')
      .then(r => r.json())
      .then((data: any) => setCustomers(data.customers || []))
      .catch(() => setErrorMsg('ไม่สามารถดึงข้อมูลร้านค้าได้'))
      .finally(() => setLoading(false));
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

  function downloadSample() {
    const csvContent = "\ufeffcustomer_name,store_id,store_name,province,region\nLotus,LT001,โลตัส รัชดา,กรุงเทพมหานคร,กลาง\nBigC,BC001,บิ๊กซี ลาดพร้าว,กรุงเทพมหานคร,กลาง\nMakro,MK001,แม็คโคร ลาดกระบัง,กรุงเทพมหานคร,กลาง\nHomePro,HP001,โฮมโปร รัตนาธิเบศร์,นนทบุรี,กลาง";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_stores.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length <= 1) {
          setErrorMsg('ไฟล์ CSV ไม่มีข้อมูลนำเข้า');
          setImporting(false);
          return;
        }
        const headers = parsed[0].map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('customer_name');
        const idIdx = headers.indexOf('store_id');
        const storeNameIdx = headers.indexOf('store_name');
        const provIdx = headers.indexOf('province');
        const regIdx = headers.indexOf('region');

        if (nameIdx === -1 || idIdx === -1 || storeNameIdx === -1) {
          setErrorMsg('คอลัมน์ไม่ถูกต้อง (ต้องการ: customer_name, store_id, store_name)');
          setImporting(false);
          return;
        }

        const dataToImport = parsed.slice(1).map(row => ({
          customer_name: row[nameIdx] || '',
          store_id: row[idIdx] || '',
          store_name: row[storeNameIdx] || '',
          province: provIdx !== -1 ? row[provIdx] || '' : '',
          region: regIdx !== -1 ? row[regIdx] || '' : '',
        })).filter(item => item.customer_name && item.store_id && item.store_name);

        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToImport),
        });
        if (res.ok) {
          const resData = await res.json() as any;
          alert(`นำเข้าข้อมูลร้านค้าสำเร็จทั้งหมด ${resData.count} รายการ`);
          load();
        } else {
          const resData = await res.json() as any;
          setErrorMsg(resData.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
      } catch {
        setErrorMsg('เกิดข้อผิดพลาดในการประมวลผลไฟล์ CSV');
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  }

  async function clearAll() {
    if (!confirm('คำเตือน: คุณต้องการลบข้อมูลร้านค้า/สาขาทั้งหมดใช่หรือไม่?\nการกระทำนี้จะลบข้อมูลถาวรและไม่สามารถเรียกคืนได้!')) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/customers?clear_all=true', { method: 'DELETE' });
      if (res.ok) {
        alert('ล้างข้อมูลร้านค้า/สาขาทั้งหมดเรียบร้อยแล้ว');
        load();
      } else {
        const resData = await res.json() as any;
        setErrorMsg(resData.error || 'ไม่สามารถเคลียร์ข้อมูลได้ (เนื่องจากมีแบบสำรวจของพนักงานผูกโยงกับสาขาเหล่านี้อยู่)');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--navy)' }}>🏪 ห้าง / สาขา</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>จัดการข้อมูล Master Data ห้างและสาขา</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-secondary" onClick={downloadSample}>📥 ตัวอย่าง CSV</button>
          <button className="btn btn-sm btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? '⏳ กำลังนำเข้า...' : '📁 นำเข้า CSV'}
          </button>
          <button className="btn btn-sm btn-danger" onClick={clearAll} disabled={loading}>🗑️ ล้างทั้งหมด</button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ เพิ่มสาขา</button>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVUpload} />
      </div>

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {errorMsg}</div>}

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
