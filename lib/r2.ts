/**
 * Cloudflare R2 Storage Client
 */

import { getRequestContext } from '@cloudflare/next-on-pages';
import type { Env } from './db';

export function getBucket(): R2Bucket {
  const { env } = getRequestContext() as any;
  return env.BUCKET;
}

export async function uploadToR2(
  key: string,
  file: ArrayBuffer,
  contentType: string
): Promise<string> {
  const bucket = getBucket();
  await bucket.put(key, file, { httpMetadata: { contentType } });
  const { env } = getRequestContext() as any;
  const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/files/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  const bucket = getBucket();
  await bucket.delete(key);
}

export async function getFromR2(key: string): Promise<R2ObjectBody | null> {
  const bucket = getBucket();
  return bucket.get(key);
}

export function generateFileKey(
  surveyId: number | string,
  type: 'product' | 'box' | 'service',
  fileName: string
): string {
  const timestamp = Date.now();
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  return `surveys/${surveyId}/${type}/${timestamp}.${ext}`;
}
