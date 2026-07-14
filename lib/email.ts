/**
 * Email Notification Service using Resend
 */

import type { SurveyHeader } from './db';

export async function sendSurveyNotification(
  survey: SurveyHeader & { detail_count: number },
  resendApiKey: string,
  adminEmail: string,
  fromEmail: string,
  appUrl: string
): Promise<void> {
  if (!resendApiKey || resendApiKey === 'your_api_key_here') {
    console.log('[Email] RESEND_API_KEY not configured, skipping email notification');
    return;
  }

  const submittedDate = new Date(survey.submitted_at || survey.created_at);
  const formattedDate = submittedDate.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const emailHtml = `
<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>แบบสำรวจ RTV ใหม่</title></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
<div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1)">
<div style="background:linear-gradient(135deg,#1e3a5f,#2d6a4f);padding:30px;text-align:center">
<h1 style="color:white;margin:0;font-size:24px">📋 แบบสำรวจ RTV ใหม่</h1>
<p style="color:rgba(255,255,255,.8);margin:8px 0 0">มีการส่งแบบสำรวจใหม่เข้ามาในระบบ</p>
</div>
<div style="padding:30px">
<table style="width:100%;border-collapse:collapse">
<tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666;width:40%">🏪 ห้าง / ร้าน</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:600">${survey.customer_name || 'N/A'}</td></tr>
<tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666">📍 สาขา</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:600">${survey.store_name || 'N/A'} (${survey.store_id || ''})</td></tr>
<tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666">👤 ผู้ให้ข้อมูล</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:600">${survey.respondent_name}</td></tr>
<tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666">📱 เบอร์โทร</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:600">${survey.respondent_phone}</td></tr>
<tr><td style="padding:12px;border-bottom:1px solid #eee;color:#666">📦 จำนวนสินค้า</td><td style="padding:12px;border-bottom:1px solid #eee;font-weight:600">${survey.detail_count} รายการ</td></tr>
<tr><td style="padding:12px;color:#666">🕐 เวลาส่ง</td><td style="padding:12px;font-weight:600">${formattedDate}</td></tr>
</table>
<div style="margin-top:30px;text-align:center">
<a href="${appUrl}/admin/surveys" style="display:inline-block;background:linear-gradient(135deg,#1e3a5f,#2d6a4f);color:white;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:600">ดูรายละเอียดในระบบ →</a>
</div>
</div>
<div style="background:#f8f8f8;padding:20px;text-align:center;color:#999;font-size:12px"><p>RTV Survey Management System</p></div>
</div></body></html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromEmail || 'noreply@resend.dev',
        to: [adminEmail],
        subject: `[RTV] แบบสำรวจใหม่ - ${survey.customer_name} ${survey.store_name} (${survey.detail_count} รายการ)`,
        html: emailHtml,
      }),
    });
    if (!response.ok) {
      const error = await response.text();
      console.error('[Email] Failed to send:', error);
    } else {
      console.log('[Email] Notification sent successfully');
    }
  } catch (err) {
    console.error('[Email] Error sending notification:', err);
  }
}
