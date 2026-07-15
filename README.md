# 📋 RTV Survey Management System

ระบบสำรวจสินค้าคืน (Return to Vendor) สำหรับพนักงานภาคสนาม

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| API | Cloudflare Workers (Edge Runtime) |
| Database | Cloudflare D1 (SQLite) |
| File Storage | Cloudflare R2 (Active) |
| Deployment | Cloudflare Pages (Configured) |
| CI/CD | GitHub Actions |
| Email | Resend |

---

## 📁 Project Structure

```
rtv-survey/
├── app/
│   ├── page.tsx                    # Landing page (public)
│   ├── survey/page.tsx             # Survey form (public)
│   ├── admin/
│   │   ├── layout.tsx              # Admin layout + auth guard
│   │   ├── login/page.tsx          # Admin login
│   │   ├── page.tsx                # Dashboard
│   │   ├── surveys/page.tsx        # Survey list + export
│   │   ├── customers/page.tsx      # Customer/Store CRUD
│   │   └── products/page.tsx       # Product CRUD
│   └── api/
│       ├── customers/route.ts      # Customer API
│       ├── stores/route.ts         # Store API
│       ├── products/route.ts       # Product API
│       ├── surveys/route.ts        # Survey API
│       ├── surveys/[id]/route.ts   # Single survey API
│       ├── upload/route.ts         # R2 upload API
│       ├── files/[...key]/route.ts # File serving API
│       ├── export/route.ts         # Excel export API
│       ├── auth/login/route.ts     # Admin login API
│       ├── auth/check/route.ts     # Auth check API
│       └── stats/route.ts          # Dashboard stats API
├── lib/
│   ├── db.ts                       # D1 database client
│   ├── r2.ts                       # R2 storage client
│   ├── email.ts                    # Email (Resend)
│   ├── auth.ts                     # JWT session auth
│   └── export.ts                   # Excel export (SheetJS)
├── migrations/
│   ├── 001_initial.sql             # Database schema
│   └── seed.sql                    # Seed data
├── wrangler.toml                   # Cloudflare config
├── .env.example                    # Environment variables template
└── .github/workflows/deploy.yml   # GitHub Actions CI/CD
```

---

## 🛠️ Setup Guide (Step by Step)

### Step 1: Clone and Install

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/rtv-survey.git
cd rtv-survey

# Install dependencies
npm install --legacy-peer-deps
```

### Step 2: Create Cloudflare Account

1. ไปที่ [dash.cloudflare.com](https://dash.cloudflare.com) แล้วสมัครบัญชี (ฟรี)
2. จด **Account ID** ไว้ (อยู่ที่ด้านขวาของ Dashboard หลัก)

### Step 3: Create D1 Database

```bash
# ติดตั้ง Wrangler CLI
npm install -g wrangler

# Login Cloudflare
wrangler login

# สร้าง D1 Database
wrangler d1 create rtv-survey-db
```

คุณจะเห็นข้อความแบบนี้:
```
✅ Successfully created DB 'rtv-survey-db'
[[d1_databases]]
binding = "DB"
database_name = "rtv-survey-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  ← คัดลอก ID นี้
```

แก้ไข `wrangler.toml` แทนที่ `YOUR_D1_DATABASE_ID` ด้วย ID ที่ได้:
```toml
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Step 4: Run Database Migrations

```bash
# สร้างตาราง
wrangler d1 execute rtv-survey-db --file=./migrations/001_initial.sql

# เพิ่มข้อมูลตัวอย่าง
wrangler d1 execute rtv-survey-db --file=./migrations/seed.sql
```

### Step 5: Create R2 Bucket

```bash
# สร้าง R2 Bucket สำหรับเก็บรูปภาพ
wrangler r2 bucket create rtv-survey-files
```

### Step 6: Create Resend Account (for Email)

1. ไปที่ [resend.com](https://resend.com) แล้วสมัครบัญชีฟรี
2. ไปที่ **API Keys** → Create API Key
3. จด API Key ไว้

### Step 7: Set Environment Variables

```bash
# ตั้งค่า Admin Password
wrangler secret put ADMIN_PASSWORD
# พิมพ์ password ที่ต้องการ แล้วกด Enter

# ตั้งค่า JWT Secret (ใช้สำหรับ session token)
wrangler secret put JWT_SECRET
# พิมพ์ random string ยาวๆ เช่น: mySecretKey2024!@#$%^&*

# ตั้งค่า Resend API Key
wrangler secret put RESEND_API_KEY
# วาง API key จาก Resend

# ตั้งค่า Admin Email (อีเมลที่จะรับ notification)
wrangler secret put ADMIN_EMAIL
# พิมพ์อีเมล เช่น: admin@yourcompany.com

# ตั้งค่า From Email
wrangler secret put FROM_EMAIL
# พิมพ์ sender email เช่น: noreply@yourcompany.com
```

### Step 8: Deploy to Cloudflare Pages

```bash
# Build และ Deploy
npx @cloudflare/next-on-pages@1

wrangler pages deploy .vercel/output/static --project-name=rtv-survey
```

หลังจาก deploy เสร็จ คุณจะได้ URL เช่น: `https://rtv-survey.pages.dev`

### Step 9: Update App URL

แก้ไข `wrangler.toml`:
```toml
[vars]
NEXT_PUBLIC_APP_URL = "https://rtv-survey.pages.dev"  # เปลี่ยนเป็น URL จริง
```

Deploy อีกครั้ง:
```bash
npx @cloudflare/next-on-pages@1 && wrangler pages deploy .vercel/output/static --project-name=rtv-survey
```

### Step 10: Setup GitHub Actions (Auto Deploy)

1. Push code ขึ้น GitHub
2. ไปที่ **Settings → Secrets and variables → Actions**
3. เพิ่ม Secrets:
   - `CLOUDFLARE_API_TOKEN` - สร้างที่ [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
   - `CLOUDFLARE_ACCOUNT_ID` - Account ID ของคุณ

---

## 🖥️ Local Development

```bash
# สร้างไฟล์ .env.local
cp .env.example .env.local
# แก้ไขค่าใน .env.local

# รัน development server
npm run dev
```

⚠️ **หมายเหตุ**: ในการพัฒนา (local) API routes ที่ใช้ D1/R2 จะยังไม่ทำงาน
เพราะต้องการ Cloudflare bindings ต้องใช้ `wrangler pages dev` แทน:

```bash
npx @cloudflare/next-on-pages@1
wrangler pages dev .vercel/output/static
```

---

## 📊 Admin Dashboard

เข้าถึงได้ที่: `https://your-app.pages.dev/admin` หรือลิงก์ด่วน `/viewer` สำหรับ Viewer

**Default credentials:**
- **ผู้ดูแลระบบ (Admin Role):**
  - Username: `admin` (กำหนดใน wrangler.toml)
  - Password: ค่าที่ตั้งผ่าน `wrangler secret put ADMIN_PASSWORD` (เช่น `admin1234`)
  - *สิทธิ์: จัดการได้ทุกเมนู รวมถึงการตั้งค่าระบบ อีเมล ห้าง/สาขา สินค้า และการเคลียร์ข้อมูล*
- **ผู้เข้าดู (Viewer Role):**
  - Username: `viewer` (กำหนดใน wrangler.toml)
  - Password: `viewer1234` (หรือตั้งผ่าน `wrangler secret put VIEWER_PASSWORD`)
  - *สิทธิ์: ดูแดชบอร์ดสถิติ รายการแบบสำรวจ และดาวน์โหลดไฟล์ Excel เท่านั้น (ไม่สามารถแก้ไขข้อมูลหรือเข้าแท็บห้าง/สินค้าได้)*

### Admin Features:
- 📊 **Dashboard** - ดูสถิติรวมแบบสำรวจ จำนวนสินค้า และสาขาในระบบ
- 📋 **แบบสำรวจ** - รายการแบบสำรวจ และการลบแบบสำรวจที่ไม่ต้องการ
- ⚙️ **ตั้งค่าระบบ** - แก้ไขอีเมลปลายทางผู้รับแจ้งเตือน และรหัส Resend API Key ผ่าน UI โดยตรง (ไม่ต้องแก้ไขโค้ดหรือทำการดีพลอยใหม่)
- 🏪 **ห้าง/สาขา** - จัดการ Master Data สาขา เพิ่ม/แก้ไข/ลบ รวมถึงการดาวน์โหลดแบบฟอร์ม CSV ตัวอย่าง และการกด **นำเข้าไฟล์ CSV แบบเป็นชุด (Bulk Import)** หรือล้างข้อมูลทั้งหมด (Clear All)
- 📦 **สินค้า** - จัดการรุ่นและประเภทสินค้า เพิ่ม/แก้ไข/ลบ และนำเข้าผ่านไฟล์ CSV
- 📥 **Export Excel (ฝังรูปภาพ)** - การดาวน์โหลดรายงาน Excel แบ่งเป็น 2 โหมดการทำงาน:
  - **แบบฝังรูปภาพ (With Pictures)**: ฝังรูปภาพขนาดย่อ (Thumbnail 80x80px) ลงในเซลล์โดยตรงพร้อมผูก Hyperlink ให้คลิกที่รูปเพื่อเปิดดูรูปภาพความละเอียดสูงต้นฉบับบนเบราว์เซอร์
  - **แบบไม่มีรูปภาพ (Without Pictures)**: แสดงคอลัมน์ลิงก์รูปภาพเป็นข้อความ URL แบบมีขีดเส้นใต้สีน้ำเงิน สามารถกดเปิดรูปต้นฉบับได้เช่นกัน

---

## 📱 Survey Flow (Public)

1. **หน้าแรก**: เลือกห้าง → เลือกสาขา → กรอกชื่อ-เบอร์โทร (มีระบบจดจำประวัติล่าสุด ไม่ต้องกรอกซ้ำ)
2. **ตรวจสอบ Draft**: หากมีแบบสำรวจที่เคยพิมพ์ค้างไว้ระบบจะแสดงป๊อปอัปให้เลือกกรอกต่อหรือล้างเริ่มใหม่
3. **กรอกแบบสำรวจ**: เลือกประเภทสินค้า รุ่น ซีเรียลนัมเบอร์ อาการเสีย และถ่ายรูปสินค้า/รูปกล่อง/รูปใบช่างรายงาน
4. **เพิ่ม/ลบรายการสินค้า**: สามารถเพิ่มรายการสินค้ารายงานได้หลายชุด และสามารถลบสินค้าแถวปัจจุบันที่ไม่ต้องการออกได้จากปุ่ม **"ลบรายการสินค้านี้"** สีแดงก่อนกดส่ง
5. **ส่งแบบสำรวจ**: บันทึกข้อมูลขึ้นระบบ และส่งอีเมลสรุปข้อมูลแบบเรียลไทม์ไปยังอีเมลปลายทางที่ผู้ดูแลตั้งค่าไว้

---

## 🗄️ Database Schema

```sql
customers     -- Master: ห้าง/สาขา (customer_name, store_id, store_name, province, region)
products      -- Master: สินค้า (category WM/RF/AC/TV, sub_category, model)
survey_headers -- Transaction header (customer_id, respondent_name, phone, status)
survey_details -- Transaction detail (header_id, category, model, serial, damage, photos)
```

---

## 📧 Email Notification

ระบบจะส่ง email ไปยัง ADMIN_EMAIL หลังจากผู้ใช้ส่งแบบสำรวจ
Email มีข้อมูล: ห้าง, สาขา, ผู้ให้ข้อมูล, จำนวนสินค้า, และลิงก์ไปยัง Admin Dashboard

---

## ❓ Troubleshooting

**Q: Build ล้มเหลว "peer deps" error**
```bash
npm install --legacy-peer-deps
```

**Q: D1 ไม่ทำงาน local**
ต้องใช้ `wrangler pages dev` ไม่ใช่ `npm run dev` สำหรับ D1/R2

**Q: Email ไม่ถูกส่ง**
ตรวจสอบว่า RESEND_API_KEY ถูกต้อง และ domain ได้รับการ verify ใน Resend

**Q: ลืม Admin Password**
```bash
wrangler secret put ADMIN_PASSWORD
# พิมพ์ password ใหม่
```
