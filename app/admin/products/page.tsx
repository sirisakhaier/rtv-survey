'use client';

import { useEffect, useState, useRef } from 'react';

interface Product { id: number; category: string; sub_category: string; model: string; }

const CATEGORIES = ['WM', 'RF', 'AC', 'TV'];
const SUB_CATEGORIES: Record<string, string[]> = {
  WM: ['Front Load', 'Top Load', 'Twin Tub'],
  RF: ['Single Door', '2 Door', 'Side by Side', 'French Door', 'Multi Door'],
  AC: ['Inverter', 'Standard', 'Cassette', 'Ducted'],
  TV: ['OLED', 'QLED', 'LED', 'Mini LED'],
};

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [form, setForm] = useState({ category: '', sub_category: '', model: '' });
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    setErrorMsg('');
    const url = filterCategory ? `/api/products?category=${filterCategory}` : '/api/products';
    fetch(url)
      .then(r => r.json())
      .then((data: any) => setProducts(data.products || []))
      .catch(() => setErrorMsg('ไม่สามารถดึงข้อมูลสินค้าได้'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [filterCategory]);

  function openAdd() { setEditing(null); setForm({ category: '', sub_category: '', model: '' }); setShowForm(true); }
  function openEdit(p: Product) { setEditing(p); setForm({ category: p.category, sub_category: p.sub_category, model: p.model }); setShowForm(true); }

  async function save() {
    if (!form.category || !form.model) return;
    setSaving(true);
    try {
      if (editing) { await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) }); }
      else { await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); }
      setShowForm(false); load();
    } finally { setSaving(false); }
  }

  async function del(id: number) {
    if (!confirm('ยืนยันการลบ?')) return;
    setDeleting(id);
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    setDeleting(null); load();
  }

  function downloadSample() {
    const csvContent = "\ufeffcategory,sub_category,model\nWM,Front Load,WF-XX1234\nRF,2 Door,RF-2D2001\nAC,Inverter,AC-INV001\nTV,OLED,TV-OL001";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_products.csv');
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
        const catIdx = headers.indexOf('category');
        const subCatIdx = headers.indexOf('sub_category');
        const modelIdx = headers.indexOf('model');

        if (catIdx === -1 || modelIdx === -1) {
          setErrorMsg('คอลัมน์ไม่ถูกต้อง (ต้องการอย่างน้อย: category, model)');
          setImporting(false);
          return;
        }

        const dataToImport = parsed.slice(1).map(row => {
          const cat = (row[catIdx] || '').trim().toUpperCase();
          return {
            category: cat,
            sub_category: subCatIdx !== -1 ? row[subCatIdx] || '' : '',
            model: row[modelIdx] || '',
          };
        }).filter(item => {
          return CATEGORIES.includes(item.category) && item.model;
        });

        if (dataToImport.length === 0) {
          setErrorMsg('ไม่มีข้อมูลสินค้าที่ถูกต้องตามเงื่อนไข (ประเภทสินค้าต้องเป็น: WM, RF, AC, TV)');
          setImporting(false);
          return;
        }

        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToImport),
        });
        if (res.ok) {
          const resData = await res.json() as any;
          alert(`นำเข้าข้อมูลสินค้าสำเร็จทั้งหมด ${resData.count} รายการ`);
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
    if (!confirm('คำเตือน: คุณต้องการลบข้อมูลสินค้าทั้งหมดใช่หรือไม่?\nการกระทำนี้จะลบข้อมูลถาวรและไม่สามารถเรียกคืนได้!')) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/products?clear_all=true', { method: 'DELETE' });
      if (res.ok) {
        alert('ล้างข้อมูลสินค้าทั้งหมดเรียบร้อยแล้ว');
        load();
      } else {
        const resData = await res.json() as any;
        setErrorMsg(resData.error || 'ไม่สามารถเคลียร์ข้อมูลได้ (เนื่องจากมีแบบสำรวจของพนักงานระบุข้อมูลสินค้าเหล่านี้อยู่)');
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
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--navy)' }}>📦 Master Data สินค้า</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>จัดการประเภทและรุ่นสินค้า</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-secondary" onClick={downloadSample}>📥 ตัวอย่าง CSV</button>
          <button className="btn btn-sm btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? '⏳ กำลังนำเข้า...' : '📁 นำเข้า CSV'}
          </button>
          <button className="btn btn-sm btn-danger" onClick={clearAll} disabled={loading}>🗑️ ล้างทั้งหมด</button>
          <button className="btn btn-primary" onClick={openAdd}>+ เพิ่มสินค้า</button>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVUpload} />
      </div>

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {errorMsg}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${filterCategory === '' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterCategory('')}>ทั้งหมด</button>
        {CATEGORIES.map(c => <button key={c} className={`btn btn-sm ${filterCategory === c ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterCategory(c)}>{c}</button>)}
      </div>

      <div className="card">
        {loading ? <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
            <table>
              <thead><tr><th>ID</th><th>ประเภท</th><th>หมวดย่อย</th><th>รุ่น</th><th>จัดการ</th></tr></thead>
              <tbody>
                {products.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>ไม่มีข้อมูล</td></tr>
                : products.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>#{p.id}</td>
                    <td><span className={`badge badge-${p.category}`}>{p.category}</span></td>
                    <td style={{ fontSize: 14 }}>{p.sub_category}</td>
                    <td style={{ fontWeight: 600 }}>{p.model}</td>
                    <td><div style={{ display: 'flex', gap: 6 }}><button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}>✏️</button><button className="btn btn-sm btn-danger" onClick={() => del(p.id)} disabled={deleting === p.id}>{deleting === p.id ? '...' : '🗑️'}</button></div></td>
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
            <div className="card-header"><h3 style={{ fontSize: 18, fontWeight: 700 }}>{editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h3></div>
            <div className="card-body">
              <div className="form-group"><label className="form-label">ประเภท <span className="required">*</span></label><select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, sub_category: '' }))}><option value="">-- เลือก --</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">หมวดย่อย</label><select className="form-control" value={form.sub_category} onChange={e => setForm(f => ({ ...f, sub_category: e.target.value }))} disabled={!form.category}><option value="">-- เลือก --</option>{(SUB_CATEGORIES[form.category] || []).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="form-group"><label className="form-label">รุ่น <span className="required">*</span></label><input type="text" className="form-control" placeholder="เช่น WF-XX1234" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 12 }}><button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? '⏳...' : '💾 บันทึก'}</button><button className="btn btn-secondary" onClick={() => setShowForm(false)}>ยกเลิก</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
