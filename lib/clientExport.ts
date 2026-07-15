import ExcelJS from 'exceljs';

export async function exportToExcelWithPhotos(includePhotos: boolean) {
  // 1. Fetch JSON data
  const res = await fetch('/api/export?format=json');
  if (!res.ok) throw new Error('Failed to fetch export data');
  const data = await res.json() as any;
  const { headers, detailsMap } = data;

  // 2. Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('RTV Survey Data');

  // Define columns
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
  ];

  if (includePhotos) {
    columns.push(
      { header: 'รูปสินค้า 1', key: 'product_photo_1', width: 18 },
      { header: 'รูปสินค้า 2', key: 'product_photo_2', width: 18 },
      { header: 'รูปสินค้า 3', key: 'product_photo_3', width: 18 },
      { header: 'รูปกล่อง 1', key: 'box_photo_1', width: 18 },
      { header: 'รูปกล่อง 2', key: 'box_photo_2', width: 18 },
      { header: 'รูปกล่อง 3', key: 'box_photo_3', width: 18 },
      { header: 'รูปใบรายงานช่าง 1', key: 'service_doc_photo_1', width: 18 },
      { header: 'รูปใบรายงานช่าง 2', key: 'service_doc_photo_2', width: 18 },
      { header: 'รูปใบรายงานช่าง 3', key: 'service_doc_photo_3', width: 18 }
    );
  }

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

        // Set row height if including photos to fit them
        const currentRow = worksheet.getRow(rowIndex);
        currentRow.alignment = { vertical: 'middle', horizontal: 'center' };
        
        if (includePhotos) {
          currentRow.height = 80;

          // Parse photo arrays
          const pPhotos = JSON.parse(detail.product_photos || '[]') as string[];
          const bPhotos = JSON.parse(detail.box_photos || '[]') as string[];
          const sPhotos = JSON.parse(detail.service_doc_photos || '[]') as string[];

          // Columns index mapping:
          // product_photo_1: 17, product_photo_2: 18, product_photo_3: 19
          // box_photo_1: 20, box_photo_2: 21, box_photo_3: 22
          // service_doc_photo_1: 23, service_doc_photo_2: 24, service_doc_photo_3: 25

          pPhotos.slice(0, 3).forEach((url, idx) => {
            imagePromises.push({ url, col: 17 + idx, row: rowIndex });
          });
          bPhotos.slice(0, 3).forEach((url, idx) => {
            imagePromises.push({ url, col: 20 + idx, row: rowIndex });
          });
          sPhotos.slice(0, 3).forEach((url, idx) => {
            imagePromises.push({ url, col: 23 + idx, row: rowIndex });
          });
        } else {
          currentRow.height = 22;
        }

        rowIndex++;
      }
    }
  }

  // 3. Load and embed images
  if (includePhotos && imagePromises.length > 0) {
    for (const imgInfo of imagePromises) {
      try {
        const imgRes = await fetch(imgInfo.url);
        if (!imgRes.ok) continue;
        const arrayBuffer = await imgRes.arrayBuffer();
        
        // Find extension
        const ext = imgInfo.url.split('.').pop()?.toLowerCase() || 'jpg';
        const imageExtension = (ext === 'png' || ext === 'gif' || ext === 'jpeg' ? ext : 'jpeg') as 'png' | 'gif' | 'jpeg';

        const imageId = workbook.addImage({
          buffer: arrayBuffer,
          extension: imageExtension,
        });

        // Add to sheet
        worksheet.addImage(imageId, {
          tl: { col: imgInfo.col - 1, row: imgInfo.row - 1 },
          ext: { width: 80, height: 80 },
          editAs: 'oneCell',
        });
      } catch (err) {
        console.error('Failed to load image for Excel embedding:', imgInfo.url, err);
      }
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
