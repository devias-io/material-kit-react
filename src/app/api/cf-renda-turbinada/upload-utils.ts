import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export type FileLike = {
  arrayBuffer: () => Promise<ArrayBuffer>;
  size: number;
  type?: string;
  name?: string;
};

export type ProcessedFile = {
  fileUrl: string;
  fileName: string;
  storage: 'base64' | 'filesystem';
};

export const DEFAULT_ALLOWED_MIME_TYPES = new Set<string>([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const DEFAULT_BASE64_LIMIT_BYTES = 5 * 1024 * 1024; // 5MB

const MIME_EXTENSION_MAP: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

export function isFileLike(value: unknown): value is FileLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FileLike).arrayBuffer === 'function' &&
    typeof (value as FileLike).size === 'number'
  );
}

function sanitizeDisplayName(originalName: unknown, fallback: string): string {
  if (typeof originalName !== 'string') {
    return fallback;
  }

  const trimmed = originalName.trim();

  if (!trimmed) {
    return fallback;
  }

  // Remove characters that could break file systems or URLs while keeping a readable name
  const cleaned = trimmed.replace(/[^\p{L}\p{N}\s._-]/gu, '').replace(/\s+/g, ' ').trim();

  return cleaned.length > 0 ? cleaned : fallback;
}

function resolveExtension(file: FileLike, displayName: string): string {
  const fromName = path.extname(displayName);

  if (fromName) {
    return fromName;
  }

  if (file.type && MIME_EXTENSION_MAP[file.type]) {
    return MIME_EXTENSION_MAP[file.type];
  }

  return '';
}

export async function processUploadedFile(
  file: FileLike,
  {
    uploadFolder,
    base64LimitBytes = DEFAULT_BASE64_LIMIT_BYTES
  }: {
    uploadFolder: string;
    base64LimitBytes?: number;
  }
): Promise<ProcessedFile> {
  const displayName = sanitizeDisplayName(file.name, 'material');

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (file.size <= base64LimitBytes) {
    const mimeType = file.type || 'application/octet-stream';
    const base64 = buffer.toString('base64');
    const fileUrl = `data:${mimeType};base64,${base64}`;

    return {
      fileUrl,
      fileName: displayName,
      storage: 'base64'
    };
  }

  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
  const uploadDir = path.join(uploadsRoot, uploadFolder);

  await mkdir(uploadDir, { recursive: true });

  const extension = resolveExtension(file, displayName);
  const generatedName = `${randomUUID()}${extension}`;
  const filePath = path.join(uploadDir, generatedName);

  await writeFile(filePath, buffer);

  const relativeUrl = path.posix.join('/uploads', uploadFolder.replace(/\\/g, '/'), generatedName);

  return {
    fileUrl: relativeUrl,
    fileName: displayName,
    storage: 'filesystem'
  };
}

export function validateFile(
  file: FileLike,
  {
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
    maxFileSizeBytes = MAX_FILE_SIZE_BYTES
  }: {
    allowedMimeTypes?: Set<string>;
    maxFileSizeBytes?: number;
  }
): string | null {
  if (file.size <= 0) {
    return 'Arquivo vazio';
  }

  if (file.size > maxFileSizeBytes) {
    return `Arquivo maior que ${(maxFileSizeBytes / 1024 / 1024).toFixed(0)}MB`;
  }

  if (file.type && !allowedMimeTypes.has(file.type)) {
    return 'Formato de arquivo não suportado';
  }

  return null;
}
