'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Customer {
  customer_name: string;
}

interface Store {
  id: number;
  store_id: string;
  store_name: string;
  province: string;
  region: string;
}

interface DraftSurvey {
  id: number;
  customer_id: number;
  respondent_name: string;
  respondent_phone: string;
  customer_name: string;
  store_name: string;
  detail_count: number;
  created_at: string;
}

export default function LandingPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);
  const [draftSurvey, setDraftSurvey] = useState<DraftSurvey | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then((data: any) => setCustomers(data.customers || []))
      .catch(() => setError('ไม่สามารถโหลดข้อมูลห้างได้'));
  }, []);

  useEffect(() => {
    if (!selectedCustomer) { setStores([]); return; }
    setLoadingStores(true);
    setSelectedStore(null);
    fetch(`/api/stores?customer_name=${encodeURIComponent(selectedCustomer)}`)
      .then(r => r.json())
      .then((data: any) => setStores(data.stores || []))
      .catch(() => setError('ไม่สามารถโหลดข้อมูลสาขาได้'))
      .finally(() => setLoadingStores(false));
  }, [selectedCustomer]);

  async function checkDraftAndProceed() {
    if (!selectedStore || !name.trim() || !phone.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (!/^[0-9]{10}$/.test(phone.trim())) {
      setError('เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/surveys?check_draft=true&customer_id=${selectedStore.id}`);
      const data = (await res.json()) as any;
      if (data.draft) {
        setDraftSurvey(data.draft);
        setShowDraftModal(true);
      } else {
        startNewSurvey();
      }
    } catch {
      startNewSurvey();
    } finally {
      setLoading(false);
    }
  }

  function startNewSurvey() {
    if (!selectedStore) return;
    const params = new URLSearchParams({
      customer_id: String(selectedStore.id),
      customer_name: selectedCustomer,
      store_name: selectedStore.store_name,
      store_id: selectedStore.store_id,
      name: name.trim(),
      phone: phone.trim(),
    });
    router.push(`/survey?${params.toString()}`);
  }

  function continueDraft() {
    if (!draftSurvey || !selectedStore) return;
    const params = new URLSearchParams({
      survey_id: String(draftSurvey.id),
      customer_id: String(selectedStore.id),
      customer_name: selectedCustomer,
      store_name: selectedStore.store_name,
      store_id: selectedStore.store_id,
      name: name.trim(),
      phone: phone.trim(),
    });
    router.push(`/survey?${params.toString()}`);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #005AAB 0%, #002f6c 50%, #005AAB 100%)' }}>
      <div style={{ textAlign: 'center', padding: '45px 16px 20px' }}>
        <img src="/haier-logo.png" alt="Haier Logo" style={{ height: 110, margin: '0 auto 8px', display: 'block', borderRadius: 12 }} />
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          Haier Electrical Appliances (Thailand) Company Limited
        </div>
        <h1 style={{ color: 'white', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>RTV Survey</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>ระบบสำรวจสินค้าคืน (Return to Vendor)</p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
          Sell out team
        </p>
      </div>

      <div style={{ padding: '0 16px 40px', maxWidth: 480, margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>ข้อมูลผู้ให้ข้อมูล</h2>
            <p style={{ opacity: 0.8, fontSize: 14 }}>กรุณาเลือกห้างและกรอกข้อมูลของคุณ</p>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">ห้าง / ลูกค้า <span className="required">*</span></label>
              <select className="form-control" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
                <option value="">-- เลือกห้าง --</option>
                {customers.map(c => <option key={c.customer_name} value={c.customer_name}>{c.customer_name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">สาขา <span className="required">*</span></label>
              <select className="form-control" value={selectedStore?.id || ''} onChange={e => setSelectedStore(stores.find(s => s.id === Number(e.target.value)) || null)} disabled={!selectedCustomer || loadingStores}>
                <option value="">-- เลือกสาขา --</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.store_name} ({s.store_id}) - {s.province}</option>)}
              </select>
              {loadingStores && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>กำลังโหลด...</p>}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

            <div className="form-group">
              <label className="form-label">ชื่อผู้ให้ข้อมูล <span className="required">*</span></label>
              <input type="text" className="form-control" placeholder="กรอกชื่อ-นามสกุล" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">หมายเลขโทรศัพท์ <span className="required">*</span></label>
              <input type="tel" className="form-control" placeholder="0812345678" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} />
            </div>

            <button className="btn btn-primary btn-full" onClick={checkDraftAndProceed} disabled={loading || !selectedStore || !name.trim() || !phone.trim()}>
              {loading ? '⏳ กำลังตรวจสอบ...' : 'เริ่มกรอกแบบสำรวจ →'}
            </button>
          </div>
          <div style={{ textAlign: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)', background: '#fafafa', color: 'var(--text-muted)', fontSize: 11, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, lineHeight: 1.4 }}>
            Haier Electrical Appliances (Thailand) Company Limited
            <br /><span style={{ fontWeight: 600 }}>Sell out team</span>
          </div>
        </div>
      </div>

      {showDraftModal && draftSurvey && (
        <div className="modal-overlay" onClick={() => setShowDraftModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 48 }}>⚠️</span>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginTop: 12 }}>พบข้อมูลที่ยังไม่สมบูรณ์</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                ห้าง <strong>{draftSurvey.customer_name}</strong> สาขา <strong>{draftSurvey.store_name}</strong>
                <br />มีแบบสำรวจที่บันทึกไว้ ({draftSurvey.detail_count} รายการ)
                <br />ต้องการดำเนินการอย่างไร?
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn btn-primary" onClick={continueDraft}>📝 ดำเนินการต่อจากเดิม</button>
              <button className="btn btn-secondary" onClick={() => { setShowDraftModal(false); startNewSurvey(); }}>🔄 เริ่มแบบสำรวจใหม่</button>
              <button className="btn btn-secondary" onClick={() => setShowDraftModal(false)} style={{ opacity: 0.6 }}>← ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
