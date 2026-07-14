import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RTV Survey System | ระบบสำรวจสินค้าคืน',
  description: 'ระบบจัดการแบบสำรวจ Return to Vendor (RTV) สำหรับพนักงานภาคสนาม',
  keywords: 'RTV, Return to Vendor, แบบสำรวจ, สินค้าเสีย',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        {children}
      </body>
    </html>
  );
}
