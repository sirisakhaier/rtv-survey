/**
 * Cloudflare D1 Database Client
 */

import { getRequestContext } from '@cloudflare/next-on-pages';

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  ADMIN_EMAIL: string;
  FROM_EMAIL: string;
  NEXT_PUBLIC_APP_URL: string;
}

export function getDB(): D1Database {
  const { env } = getRequestContext() as any;
  return env.DB;
}

export function getEnv(): Env {
  const { env } = getRequestContext() as any;
  return env as Env;
}

export interface Customer {
  id: number;
  customer_name: string;
  store_id: string;
  store_name: string;
  province: string;
  region: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  category: 'WM' | 'RF' | 'AC' | 'TV';
  sub_category: string;
  model: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyHeader {
  id: number;
  customer_id: number;
  respondent_name: string;
  respondent_phone: string;
  status: 'draft' | 'submitted';
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  store_id?: string;
  store_name?: string;
  province?: string;
  region?: string;
  detail_count?: number;
}

export interface SurveyDetail {
  id: number;
  header_id: number;
  category: 'WM' | 'RF' | 'AC' | 'TV';
  model: string;
  serial_number: string;
  damage_issue: string;
  product_photos: string;
  box_package: 'มีกล่อง' | 'ไม่มีกล่อง';
  box_photos: string;
  service_doc: 'มี' | 'ไม่มี';
  service_doc_photos: string;
  created_at: string;
  updated_at: string;
}
