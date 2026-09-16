import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '@/db';
import { asset } from '@/db/schema';
import { HttpError } from './server';
export function storage() {
  if (
    !process.env.S3_BUCKET ||
    !process.env.S3_ACCESS_KEY_ID ||
    !process.env.S3_SECRET_ACCESS_KEY
  )
    throw new HttpError(503, 'Configure o armazenamento S3/R2.');
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'auto',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
}
export async function saveAsset(
  userId: string,
  body: Buffer,
  mime: string,
  name: string,
  projectId?: string,
  prompt?: string,
) {
  const id = crypto.randomUUID();
  const key = `users/${userId}/${id}`;
  await storage().send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: mime,
    }),
  );
  await db
    .insert(asset)
    .values({ id, userId, key, mime, name, projectId, prompt });
  return {
    id,
    name,
    kind: mime.startsWith('video/') ? ('video' as const) : ('image' as const),
    url: `/api/media/${id}`,
    projectId,
    prompt,
  };
}
export async function assetUrl(key: string) {
  return getSignedUrl(
    storage(),
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    { expiresIn: 900 },
  );
}
