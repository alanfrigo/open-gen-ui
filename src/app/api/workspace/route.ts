import { db } from '@/db';
import { workspace, asset } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireUser, apiError, checkOrigin, HttpError } from '@/lib/server';
import { initialWorkspace } from '@/lib/types';
import { z } from 'zod';
const schema = z.object({
  projects: z
    .array(
      z.object({
        id: z.string().max(100),
        name: z.string().min(1).max(100),
        description: z.string().max(500),
      }),
    )
    .max(100),
  assistants: z
    .array(
      z.object({
        id: z.string().max(100),
        name: z.string().min(1).max(100),
        description: z.string().max(500),
        instructions: z.string().max(16000),
        skills: z.array(z.string()).max(20),
      }),
    )
    .max(100),
  skills: z
    .array(
      z.object({
        id: z.string().max(100),
        name: z.string().max(100),
        content: z.string().max(50000),
        source: z.string().max(500).optional(),
      }),
    )
    .max(100),
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant']),
        content: z.string().max(20000),
        media: z
          .array(
            z.object({
              id: z.string().uuid(),
              name: z.string().max(500),
              kind: z.enum(['image', 'video']),
              url: z.string().regex(/^\/api\/media\/[a-f0-9-]{36}$/),
              prompt: z.string().max(12000).optional(),
              projectId: z.string().max(100).optional(),
            }),
          )
          .max(10)
          .optional(),
      }),
    )
    .max(500),
});
export async function GET() {
  try {
    const u = await requireUser();
    const [w] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.userId, u.id));
    const media = await db
      .select()
      .from(asset)
      .where(eq(asset.userId, u.id))
      .orderBy(desc(asset.createdAt))
      .limit(200);
    return Response.json({
      ...(w?.data || initialWorkspace),
      media: media.map((a) => ({
        id: a.id,
        name: a.name,
        kind: a.mime.startsWith('video/') ? 'video' : 'image',
        url: `/api/media/${a.id}`,
        projectId: a.projectId,
        prompt: a.prompt,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function PUT(req: Request) {
  try {
    await checkOrigin(req);
    const u = await requireUser();
    const raw = await req.text();
    if (raw.length > 2000000)
      throw new HttpError(413, 'Workspace excede o limite.');
    const data = { ...schema.parse(JSON.parse(raw)), media: [] };
    await db
      .insert(workspace)
      .values({ userId: u.id, data })
      .onConflictDoUpdate({
        target: workspace.userId,
        set: { data, updatedAt: new Date() },
      });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
