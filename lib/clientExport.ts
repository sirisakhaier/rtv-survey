import ExcelJS from 'exceljs';

function fixUrl(url: string): string {
  if (!url) return '';
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith('/')) {
    return `${window.location.origin}${cleanUrl}`;
  }
  if (cleanUrl.includes('/api/files/')) {
    const key = cleanUrl.substring(cleanUrl.indexOf('/api/files/'));
    return `${window.location.origin}${key}`;
  }
  return cleanUrl;
}

async function fetchImageAsJpegBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    return new Promise<ArrayBuffer | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 300;
          let w = img.naturalWidth || 300;
          let h = img.naturalHeight || 300;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(blobUrl);
            resolve(null);
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          canvas.toBlob(
            async (jpegBlob) => {
              URL.revokeObjectURL(blobUrl);
              if (!jpegBlob) {
                resolve(null);
                return;
              }
              const buf = await jpegBlob.arrayBuffer();
              resolve(buf);
            },
            'image/jpeg',
            0.85
          );
        } catch (e) {
          console.error('Canvas processing error:', e);
          URL.revokeObjectURL(blobUrl);
          resolve(null);
        }
      };
      img.onerror = (err) => {
        console.error('Image load error for Excel:', url, err);
        URL.revokeObjectURL(blobUrl);
        resolve(null);
      };
      img.src = blobUrl;
    });
  } catch (err) {
    console.error('Failed to fetch image for Excel embedding:', url, err);
    return null;
  }
}

async function fetchImageBuffer(url: string): Promise<{ buffer: ArrayBuffer; extension: 'jpeg' | 'png' } | null> {
  const canvasBuf = await fetchImageAsJpegBuffer(url);
  if (canvasBuf) {
    return { buffer: canvasBuf, extension: 'jpeg' };
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const ext = url.split('.').pop()?.toLowerCase() || 'jpeg';
    const extension = (ext === 'png' ? 'png' : 'jpeg') as 'jpeg' | 'png';
    return { buffer: arrayBuffer, extension };
  } catch {
    return null;
  }
}

export async function exportToExcelWithPhotos(includePhotos: boolean) {
  // 1. Fetch JSON data
  const res = await fetch('/api/export?format=json');
  if (!res.ok) throw new Error('Failed to fetch export data');
  const data = await res.json() as any;
  const { headers, detailsMap } = data;

  // 2. Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('RTV Survey Data');

  // Define columns (photo columns width 16)
  const columns = [
    { header: 'รหัสแบบสำรวจ', key: 'survey_id', width: 15 },
    { header: 'ชื่อห้าง', key: 'customer_name', width: 18 },
    { header: 'รหัสสาขา', key: 'store_id', width: 12 },
    { header: 'ชื่อสาขา', key: 'store_name', width: 18 },
    { header: 'จังหวัด', key: 'province', width: 15 },
    { header: 'ภาค', key: 'region', width: 12 },
    { header: 'ชื่อผู้ให้ข้อมูล', key: 'respondent_name', width: 18 },
    { header: 'เบอร์โทร', key: 'respondent_phone', width: 15 },
    { header: 'วันเวลาที่ส่ง', key: 'submitted_at', width: 22 },
    { header: 'ลำดับสินค้า', key: 'detail_seq', width: 12 },
    { header: 'ประเภทสินค้า', key: 'category', width: 15 },
    { header: 'รุ่น', key: 'model', width: 18 },
    { header: 'ซีเรียลนัมเบอร์', key: 'serial_number', width: 18 },
    { header: 'อาการเสีย', key: 'damage_issue', width: 25 },
    { header: 'มีกล่อง', key: 'box_package', width: 12 },
    { header: 'มีใบรายงานช่าง', key: 'service_doc', width: 15 },
    { header: 'รูปสินค้า 1', key: 'product_photo_1', width: 16 },
    { header: 'รูปสินค้า 2', key: 'product_photo_2', width: 16 },
    { header: 'รูปสินค้า 3', key: 'product_photo_3', width: 16 },
    { header: 'รูปกล่อง 1', key: 'box_photo_1', width: 16 },
    { header: 'รูปกล่อง 2', key: 'box_photo_2', width: 16 },
    { header: 'รูปกล่อง 3', key: 'box_photo_3', width: 16 },
    { header: 'รูปใบรายงานช่าง 1', key: 'service_doc_photo_1', width: 16 },
    { header: 'รูปใบรายงานช่าง 2', key: 'service_doc_photo_2', width: 16 },
    { header: 'รูปใบรายงานช่าง 3', key: 'service_doc_photo_3', width: 16 }
  ];

  worksheet.columns = columns;

  // Format header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF005AAB' } // Haier Corporate Blue
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;

  // Add rows
  let rowIndex = 2;
  const imagePromises: { url: string; col: number; row: number }[] = [];

  for (const header of headers) {
    const details = detailsMap[header.id] || [];
    if (details.length === 0) {
      worksheet.addRow({
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
      });
      
      const currentRow = worksheet.getRow(rowIndex);
      currentRow.alignment = { vertical: 'middle', horizontal: 'center' };
      currentRow.height = 22;
      rowIndex++;
    } else {
      for (let i = 0; i < details.length; i++) {
        const detail = details[i];
        worksheet.addRow({
          survey_id: header.id,
          customer_name: header.customer_name || '',
          store_id: header.store_id || '',
          store_name: header.store_name || '',
          province: header.province || '',
          region: header.region || '',
          respondent_name: header.respondent_name,
          respondent_phone: header.respondent_phone,
          submitted_at: header.submitted_at || header.created_at,
          detail_seq: i + 1,
          category: detail.category,
          model: detail.model,
          serial_number: detail.serial_number,
          damage_issue: detail.damage_issue,
          box_package: detail.box_package,
          service_doc: detail.service_doc,
        });

        const currentRow = worksheet.getRow(rowIndex);
        currentRow.alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Parse photo arrays
        const pPhotos = JSON.parse(detail.product_photos || '[]') as string[];
        const bPhotos = JSON.parse(detail.box_photos || '[]') as string[];
        const sPhotos = JSON.parse(detail.service_doc_photos || '[]') as string[];

        if (includePhotos) {
          currentRow.height = 70; // 70pt height fits 70px square thumbnail

          pPhotos.slice(0, 3).forEach((rawUrl, idx) => {
            const url = fixUrl(rawUrl);
            if (!url) return;
            const col = 17 + idx;
            imagePromises.push({ url, col, row: rowIndex });
          });
          bPhotos.slice(0, 3).forEach((rawUrl, idx) => {
            const url = fixUrl(rawUrl);
            if (!url) return;
            const col = 20 + idx;
            imagePromises.push({ url, col, row: rowIndex });
          });
          sPhotos.slice(0, 3).forEach((rawUrl, idx) => {
            const url = fixUrl(rawUrl);
            if (!url) return;
            const col = 23 + idx;
            imagePromises.push({ url, col, row: rowIndex });
          });
        } else {
          currentRow.height = 22;

          // Write plain URL hyperlinks in cell blocks directly without images
          pPhotos.slice(0, 3).forEach((rawUrl, idx) => {
            const url = fixUrl(rawUrl);
            if (!url) return;
            const cell = worksheet.getCell(rowIndex, 17 + idx);
            cell.value = { text: url, hyperlink: url };
            cell.font = { color: { argb: 'FF0000FF' }, underline: true };
          });
          bPhotos.slice(0, 3).forEach((rawUrl, idx) => {
            const url = fixUrl(rawUrl);
            if (!url) return;
            const cell = worksheet.getCell(rowIndex, 20 + idx);
            cell.value = { text: url, hyperlink: url };
            cell.font = { color: { argb: 'FF0000FF' }, underline: true };
          });
          sPhotos.slice(0, 3).forEach((rawUrl, idx) => {
            const url = fixUrl(rawUrl);
            if (!url) return;
            const cell = worksheet.getCell(rowIndex, 23 + idx);
            cell.value = { text: url, hyperlink: url };
            cell.font = { color: { argb: 'FF0000FF' }, underline: true };
          });
        }

        rowIndex++;
      }
    }
  }

  // 3. Load, convert to standard JPEG, and embed clickable images with exact 70x70 dimensions
  if (includePhotos && imagePromises.length > 0) {
    for (const imgInfo of imagePromises) {
      const imgData = await fetchImageBuffer(imgInfo.url);
      if (!imgData) {
        // Fallback: write text hyperlink if image fails to load
        const cell = worksheet.getCell(imgInfo.row, imgInfo.col);
        cell.value = { text: 'ดูรูปภาพ', hyperlink: imgInfo.url };
        cell.font = { color: { argb: 'FF0000FF' }, underline: true };
        continue;
      }

      const imageId = workbook.addImage({
        buffer: imgData.buffer,
        extension: imgData.extension,
      });

      // Embed image with exact 70x70px size and direct image hyperlink
      worksheet.addImage(imageId, {
        tl: { col: imgInfo.col - 1 + 0.1, row: imgInfo.row - 1 + 0.08 },
        ext: { width: 70, height: 70 },
        hyperlinks: {
          hyperlink: imgInfo.url,
          tooltip: 'เปิดดูรูปภาพขนาดใหญ่',
        },
      } as any);
    }
  }

  // 4. Write and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `RTV_Survey_${date}${includePhotos ? '_with_photos' : ''}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
