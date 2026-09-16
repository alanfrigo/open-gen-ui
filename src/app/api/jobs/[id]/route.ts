import { requireUser, apiError, HttpError } from '@/lib/server';
import { router } from '@/lib/openrouter';
import { saveAsset } from '@/lib/storage';
import { db } from '@/db';
import { job, asset } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
export const maxDuration = 300;
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const u = await requireUser();
    const { id } = await params;
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${id}))`);
      const [j] = await tx
        .select()
        .from(job)
        .where(and(eq(job.id, id), eq(job.userId, u.id)));
      if (!j || !j.providerId)
        throw new HttpError(404, 'Geração não encontrada.');
      if (j.assetId) {
        const [a] = await tx
          .select()
          .from(asset)
          .where(eq(asset.id, j.assetId));
        return Response.json({
          status: 'completed',
          media: [
            {
              id: a.id,
              name: a.name,
              kind: 'video',
              url: `/api/media/${a.id}`,
              prompt: j.prompt,
              projectId: j.projectId,
            },
          ],
        });
      }
      const r = router();
      const result = await r.videoGeneration.getGeneration({
        jobId: j.providerId,
      });
      if (result.status === 'completed') {
        const stream = await r.videoGeneration.getVideoContent({
          jobId: j.providerId,
        });
        const buffer = Buffer.from(await new Response(stream).arrayBuffer());
        const media = await saveAsset(
          u.id,
          buffer,
          'video/mp4',
          j.prompt.slice(0, 45),
          j.projectId || undefined,
          j.prompt,
        );
        await tx
          .update(job)
          .set({ status: 'completed', assetId: media.id })
          .where(eq(job.id, id));
        return Response.json({ status: 'completed', media: [media] });
      }
      await tx.update(job).set({ status: result.status }).where(eq(job.id, id));
      return Response.json({ status: result.status, error: result.error });
    });
  } catch (e) {
    return apiError(e);
  }
}
