/**
 * Excel Export Utility using SheetJS (xlsx)
 */

import * as XLSX from 'xlsx';
import type { SurveyHeader, SurveyDetail } from './db';

export interface SurveyExportRow {
  survey_id: number;
  customer_name: string;
  store_id: string;
  store_name: string;
  province: string;
  region: string;
  respondent_name: string;
  respondent_phone: string;
  submitted_at: string;
  detail_seq: number;
  category: string;
  model: string;
  serial_number: string;
  damage_issue: string;
  box_package: string;
  service_doc: string;
  product_photos?: string;
  box_photos?: string;
  service_doc_photos?: string;
}

export function generateExcel(
  headers: SurveyHeader[],
  detailsMap: Record<number, SurveyDetail[]>,
  includePhotos: boolean
): Buffer {
  const rows: SurveyExportRow[] = [];

  for (const header of headers) {
    const details = detailsMap[header.id] || [];
    if (details.length === 0) {
      rows.push({
        survey_id: header.id,
        customer_name: header.customer_name || '',
        store_id: header.store_id || '',
        store_name: header.store_name || '',
        province: header.province || '',
        region: header.region || '',
        respondent_name: header.respondent_name,
        respondent_phone: header.respondent_phone,
        submitted_at: header.submitted_at || header.created_at,
        detail_seq: 0,
        category: '', model: '', serial_number: '', damage_issue: '',
        box_package: '', service_doc: '',
        ...(includePhotos ? { product_photos: '', box_photos: '', service_doc_photos: '' } : {}),
      });
    }
    details.forEach((detail, idx) => {
      const row: SurveyExportRow = {
        survey_id: header.id,
        customer_name: header.customer_name || '',
        store_id: header.store_id || '',
        store_name: header.store_name || '',
        province: header.province || '',
        region: header.region || '',
        respondent_name: header.respondent_name,
        respondent_phone: header.respondent_phone,
        submitted_at: header.submitted_at || header.created_at,
        detail_seq: idx + 1,
        category: detail.category,
        model: detail.model,
        serial_number: detail.serial_number,
        damage_issue: detail.damage_issue,
        box_package: detail.box_package,
        service_doc: detail.service_doc,
      };
      if (includePhotos) {
        row.product_photos = JSON.parse(detail.product_photos || '[]').join('\n');
        row.box_photos = JSON.parse(detail.box_photos || '[]').join('\n');
        row.service_doc_photos = JSON.parse(detail.service_doc_photos || '[]').join('\n');
      }
      rows.push(row);
    });
  }

  const columnHeaders: Record<string, string> = {
    survey_id: 'รหัสแบบสำรวจ', customer_name: 'ชื่อห้าง', store_id: 'รหัสสาขา',
    store_name: 'ชื่อสาขา', province: 'จังหวัด', region: 'ภาค',
    respondent_name: 'ชื่อผู้ให้ข้อมูล', respondent_phone: 'เบอร์โทร',
    submitted_at: 'วันเวลาที่ส่ง', detail_seq: 'ลำดับสินค้า',
    category: 'ประเภทสินค้า', model: 'รุ่น', serial_number: 'ซีเรียลนัมเบอร์',
    damage_issue: 'อาการเสีย', box_package: 'มีกล่อง', service_doc: 'มีใบรายงานช่าง',
    product_photos: 'รูปสินค้า (URLs)', box_photos: 'รูปกล่อง (URLs)',
    service_doc_photos: 'รูปใบรายงานช่าง (URLs)',
  };

  const wsData: (string | number)[][] = [];
  const keys = Object.keys(rows[0] || {});
  wsData.push(keys.map(k => columnHeaders[k] || k));
  for (const row of rows) {
    wsData.push(keys.map(k => (row as any)[k] as string | number ?? ''));
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const colWidths = keys.map((key, i) => ({
    wch: Math.max(
      (columnHeaders[key] || key).length * 2,
      ...wsData.slice(1).map(row => String(row[i] || '').length)
    )
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'RTV Survey Data');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
