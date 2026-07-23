export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, generateFileKey } from '@/lib/r2';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const surveyId = formData.get('survey_id') as string || 'temp';
    const type = (formData.get('type') as 'product' | 'box' | 'service') || 'product';
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (file.size === 0) return NextResponse.json({ error: 'File is empty or corrupted' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    const buffer = await file.arrayBuffer();
    const key = generateFileKey(surveyId, type, file.name);
    const url = await uploadToR2(key, buffer, file.type);
    return NextResponse.json({ url, key, success: true });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
