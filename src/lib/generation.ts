import { z } from 'zod';
import { db } from '@/db';
import { asset, workspace } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { assetUrl } from './storage';
import { HttpError } from './server';
export const generationSchema = z.object({
  prompt: z.string().trim().min(1).max(12000),
  model: z.string().min(1).max(200),
  kind: z.enum(['image', 'video']),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']),
  projectId: z.string().max(100).optional(),
  assistantId: z.string().max(100).optional(),
  references: z.array(z.string().uuid()).max(4).default([]),
});
export async function context(userId: string, assistantId?: string) {
  if (!assistantId) return '';
  const [w] = await db
    .select()
    .from(workspace)
    .where(eq(workspace.userId, userId));
  const a = w?.data.assistants.find((a) => a.id === assistantId);
  if (!a) return '';
  const skills = w.data.skills.filter((s) => a.skills.includes(s.id));
  return [
    a.instructions,
    ...skills.map((s) => `Skill: ${s.name}\n${s.content}`),
  ]
    .join('\n\n')
    .slice(0, 24000);
}
export async function references(userId: string, ids: string[]) {
  return Promise.all(
    ids.map(async (id) => {
      const [a] = await db
        .select()
        .from(asset)
        .where(and(eq(asset.id, id), eq(asset.userId, userId)));
      if (!a || !a.mime.startsWith('image/'))
        throw new HttpError(
          400,
          'Use imagens da sua biblioteca como referência.',
        );
      return {
        type: 'image_url' as const,
        imageUrl: { url: await assetUrl(a.key) },
      };
    }),
  );
}
