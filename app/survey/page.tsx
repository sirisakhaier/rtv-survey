'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = ['WM', 'RF', 'AC', 'TV'];
const CATEGORY_LABELS: Record<string, string> = {
  WM: '🫧 เครื่องซักผ้า (WM)',
  RF: '🧊 ตู้เย็น (RF)',
  AC: '❄️ แอร์ (AC)',
  TV: '📺 โทรทัศน์ (TV)',
};

interface ProductDetail {
  category: string;
  model: string;
  serial_number: string;
  damage_issue: string;
  product_photos: string[];
  box_package: 'มีกล่อง' | 'ไม่มีกล่อง';
  box_photos: string[];
  service_doc: 'มี' | 'ไม่มี';
  service_doc_photos: string[];
}

interface PhotoUploaderProps {
  label: string;
  photos: string[];
  onAdd: (url: string) => void;
  onRemove: (idx: number) => void;
  surveyId: string;
  type: 'product' | 'box' | 'service';
  max?: number;
}

function PhotoUploader({ label, photos, onAdd, onRemove, surveyId, type, max = 3 }: PhotoUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files.slice(0, max - photos.length)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('survey_id', surveyId || 'temp');
      fd.append('type', type);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = (await res.json()) as any;
        if (data.url) onAdd(data.url);
      } catch { /* ignore */ }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {photos.length < max && (
        <div className="photo-upload-area" onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFile} />
          <span style={{ fontSize: 32 }}>📷</span>
          <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>
            {uploading ? '⏳ กำลังอัปโหลด...' : `แตะเพื่อถ่าย/เลือกรูป (สูงสุด ${max} รูป)`}
          </p>
        </div>
      )}
      {photos.length > 0 && (
        <div className="photo-grid" style={{ marginTop: photos.length < max ? 12 : 0 }}>
          {photos.map((url, i) => (
            <div key={i} className="photo-thumb">
              <img src={url} alt={`photo-${i}`} />
              <button className="remove-btn" onClick={() => onRemove(i)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function emptyDetail(): ProductDetail {
  return { category: '', model: '', serial_number: '', damage_issue: '', product_photos: [], box_package: 'ไม่มีกล่อง', box_photos: [], service_doc: 'ไม่มี', service_doc_photos: [] };
}

function SurveyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const customerId = params.get('customer_id') || '';
  const customerName = params.get('customer_name') || '';
  const storeName = params.get('store_name') || '';
  const storeId = params.get('store_id') || '';
  const respondentName = params.get('name') || '';
  const respondentPhone = params.get('phone') || '';

  const [details, setDetails] = useState<ProductDetail[]>([emptyDetail()]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [models, setModels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const current = details[currentIdx];

  async function loadModels(category: string) {
    if (!category) { setModels([]); return; }
    const res = await fetch(`/api/products?category=${category}`);
    const data = (await res.json()) as any;
    setModels((data.products || []).map((p: { model: string }) => p.model));
  }

  function updateCurrent(field: keyof ProductDetail, value: string | string[]) {
    setDetails(prev => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], [field]: value } as ProductDetail;
      return next;
    });
  }

  function addPhoto(type: 'product_photos' | 'box_photos' | 'service_doc_photos', url: string) {
    updateCurrent(type, [...(current[type] as string[]), url]);
  }

  function removePhoto(type: 'product_photos' | 'box_photos' | 'service_doc_photos', idx: number) {
    updateCurrent(type, (current[type] as string[]).filter((_, i) => i !== idx));
  }

  function addAnotherProduct() {
    if (!current.category || !current.model) { setError('กรุณาเลือกประเภทสินค้าและรุ่นก่อน'); return; }
    setError('');
    setDetails(prev => [...prev, emptyDetail()]);
    setCurrentIdx(details.length);
    setModels([]);
  }

  async function handleSubmit() {
    if (!current.category || !current.model) { setError('กรุณาเลือกประเภทสินค้าและรุ่น'); return; }
    if (!current.damage_issue.trim()) { setError('กรุณาระบุอาการเสีย'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, respondent_name: respondentName, respondent_phone: respondentPhone, details, action: 'submit_complete' }),
      });
      if (res.ok) { setSubmitted(true); } else { setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'); }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #1e3a5f 0%, #2d6a4f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)', marginBottom: 8 }}>ส่งแบบสำรวจสำเร็จ!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>ขอบคุณที่ส่งข้อมูล <strong>{respondentName}</strong></p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>{customerName} - {storeName} | {details.length} รายการ</p>
          <button className="btn btn-primary btn-full" onClick={() => router.push('/')}>กลับหน้าหลัก</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--green) 100%)', padding: '20px 16px', color: 'white' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 14, marginBottom: 8 }}>← กลับ</button>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>แบบสำรวจ RTV</h1>
        <p style={{ opacity: 0.8, fontSize: 14 }}>{customerName} • {storeName} ({storeId})</p>
        <p style={{ opacity: 0.7, fontSize: 13 }}>ผู้ให้ข้อมูล: {respondentName} | {respondentPhone}</p>
      </div>

      {details.length > 1 && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', background: 'white', borderBottom: '1px solid var(--border)' }}>
          {details.map((_, i) => (
            <button key={i} onClick={() => setCurrentIdx(i)} className={`btn btn-sm ${i === currentIdx ? 'btn-primary' : 'btn-secondary'}`}>
              สินค้า {i + 1} {details[i].category ? `(${details[i].category})` : ''}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>สินค้าที่ {currentIdx + 1} จาก {details.length}</h2>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">ประเภทสินค้า <span className="required">*</span></label>
              <select className="form-control" value={current.category} onChange={e => { updateCurrent('category', e.target.value); updateCurrent('model', ''); loadModels(e.target.value); }}>
                <option value="">-- เลือกประเภท --</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">รุ่น <span className="required">*</span></label>
              <select className="form-control" value={current.model} onChange={e => updateCurrent('model', e.target.value)} disabled={!current.category}>
                <option value="">-- เลือกรุ่น --</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ซีเรียลนัมเบอร์</label>
              <input type="text" className="form-control" placeholder="กรอกซีเรียลนัมเบอร์ (ถ้ามี)" value={current.serial_number} onChange={e => updateCurrent('serial_number', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">อาการเสีย <span className="required">*</span></label>
              <textarea className="form-control" placeholder="อธิบายอาการเสียของสินค้า" value={current.damage_issue} onChange={e => updateCurrent('damage_issue', e.target.value)} rows={3} />
            </div>

            <PhotoUploader label="รูปถ่ายสินค้า (สูงสุด 3 รูป)" photos={current.product_photos} onAdd={url => addPhoto('product_photos', url)} onRemove={idx => removePhoto('product_photos', idx)} surveyId="temp" type="product" max={3} />

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

            <div className="form-group">
              <label className="form-label">กล่องสินค้า</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {(['มีกล่อง', 'ไม่มีกล่อง'] as const).map(v => (
                  <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, padding: '12px 16px', border: `2px solid ${current.box_package === v ? 'var(--navy)' : 'var(--border)'}`, borderRadius: 10, background: current.box_package === v ? 'rgba(30,58,95,0.05)' : 'white', transition: 'all 0.2s' }}>
                    <input type="radio" name="box" value={v} checked={current.box_package === v} onChange={() => updateCurrent('box_package', v)} style={{ display: 'none' }} />
                    <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${current.box_package === v ? 'var(--navy)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {current.box_package === v && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--navy)' }} />}
                    </span>
                    <span>{v === 'มีกล่อง' ? '📦 มีกล่อง' : '❌ ไม่มีกล่อง'}</span>
                  </label>
                ))}
              </div>
            </div>

            {current.box_package === 'มีกล่อง' && (
              <PhotoUploader label="รูปถ่ายกล่องสินค้า (สูงสุด 3 รูป)" photos={current.box_photos} onAdd={url => addPhoto('box_photos', url)} onRemove={idx => removePhoto('box_photos', idx)} surveyId="temp" type="box" max={3} />
            )}

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

            <div className="form-group">
              <label className="form-label">ใบรายงานช่าง</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {(['มี', 'ไม่มี'] as const).map(v => (
                  <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, padding: '12px 16px', border: `2px solid ${current.service_doc === v ? 'var(--navy)' : 'var(--border)'}`, borderRadius: 10, background: current.service_doc === v ? 'rgba(30,58,95,0.05)' : 'white', transition: 'all 0.2s' }}>
                    <input type="radio" name="service" value={v} checked={current.service_doc === v} onChange={() => updateCurrent('service_doc', v)} style={{ display: 'none' }} />
                    <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${current.service_doc === v ? 'var(--navy)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {current.service_doc === v && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--navy)' }} />}
                    </span>
                    <span>{v === 'มี' ? '📄 มีใบรายงาน' : '❌ ไม่มี'}</span>
                  </label>
                ))}
              </div>
            </div>

            {current.service_doc === 'มี' && (
              <PhotoUploader label="รูปถ่ายใบรายงานช่าง (สูงสุด 3 รูป)" photos={current.service_doc_photos} onAdd={url => addPhoto('service_doc_photos', url)} onRemove={idx => removePhoto('service_doc_photos', idx)} surveyId="temp" type="service" max={3} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={addAnotherProduct} disabled={submitting}>+ เพิ่มสินค้าอีกรายการ</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '⏳ กำลังส่ง...' : `✅ ส่งแบบสำรวจ (${details.length} รายการ)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}>
      <SurveyForm />
    </Suspense>
  );
}
