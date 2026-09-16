// Run against an isolated, configured instance. Never invokes paid generation.
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { limit, getRedis, HttpError } from '../src/lib/server';
import {
  S3Client,
  CreateBucketCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});
const emails: string[] = [];
let key: string | undefined;
try {
  try {
    await s3.send(new CreateBucketCommand({ Bucket: process.env.S3_BUCKET }));
  } catch (e) {
    if (
      !['BucketAlreadyOwnedByYou', 'BucketAlreadyExists'].includes(
        (e as Error).name,
      )
    )
      throw e;
  }
  const signup = async () => {
    const email = `test-${crypto.randomUUID()}@example.com`;
    const password = crypto.randomUUID();
    emails.push(email);
    const r = await fetch(`${base}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({
        name: 'Integration test',
        email,
        password,
      }),
    });
    assert.equal(r.status, 200, await r.clone().text());
    const cookies = r.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; ');
    assert.ok(cookies);
    const login = await fetch(`${base}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(login.status, 200);
    return login.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; ');
  };
  const a = await signup();
  const b = await signup();
  const headers = { Cookie: a, Origin: base };
  const project = {
    id: crypto.randomUUID(),
    name: 'Private project',
    description: 'test',
  };
  const put = await fetch(`${base}/api/workspace`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projects: [project],
      assistants: [],
      skills: [],
      messages: [],
    }),
  });
  assert.equal(put.status, 200);
  const own = await fetch(`${base}/api/workspace`, { headers }).then((r) =>
    r.json(),
  );
  assert.equal(own.projects[0].name, project.name);
  const other = await fetch(`${base}/api/workspace`, {
    headers: { Cookie: b },
  }).then((r) => r.json());
  assert.equal(other.projects.length, 0);
  const form = new FormData();
  form.append(
    'file',
    new Blob(
      [
        Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf8QAAAAASUVORK5CYII=',
          'base64',
        ),
      ],
      { type: 'image/png' },
    ),
    'test.png',
  );
  form.append('projectId', project.id);
  const upload = await fetch(`${base}/api/upload`, {
    method: 'POST',
    headers,
    body: form,
  });
  assert.equal(upload.status, 200, await upload.clone().text());
  const media = await upload.json();
  const row = await pool.query('select key from asset where id=$1', [media.id]);
  key = row.rows[0].key;
  const get = await fetch(`${base}${media.url}`, {
    headers,
    redirect: 'manual',
  });
  assert.equal(get.status, 302);
  const stored = await fetch(get.headers.get('location')!);
  assert.equal(stored.status, 200);
  assert.equal(stored.headers.get('content-type'), 'image/png');
  const denied = await fetch(`${base}${media.url}`, {
    headers: { Cookie: b },
    redirect: 'manual',
  });
  assert.equal(denied.status, 404);
  const crossOrigin = await fetch(`${base}/api/workspace`, {
    method: 'PUT',
    headers: {
      Cookie: a,
      Origin: 'https://untrusted.example',
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  assert.equal(crossOrigin.status, 403);
  const invalidRef = await fetch(`${base}/api/generate`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'test',
      kind: 'image',
      model: 'example/model',
      aspectRatio: '1:1',
      references: ['http://localhost'],
    }),
  });
  assert.equal(invalidRef.status, 400);
  const rateUser = crypto.randomUUID();
  for (let i = 0; i < 10; i++) await limit(rateUser);
  await assert.rejects(
    () => limit(rateUser),
    (e: unknown) => e instanceof HttpError && e.status === 429,
  );
  await getRedis().quit();
  console.log(
    'PASS: signup, login, Redis rate limits, workspace persistence, tenant isolation, S3 upload/read, private assets, origin validation and reference validation. No paid API requests.',
  );
} finally {
  if (key)
    await s3.send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    );
  for (const email of emails)
    await pool.query('delete from "user" where email=$1', [email]);
  await pool.end();
}
