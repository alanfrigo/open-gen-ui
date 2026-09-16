import { db } from '@/db';
import { asset } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireUser, apiError, HttpError } from '@/lib/server';
import { assetUrl } from '@/lib/storage';
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const [a] = await db
      .select()
      .from(asset)
      .where(and(eq(asset.id, id), eq(asset.userId, u.id)));
    if (!a) throw new HttpError(404, 'Arquivo não encontrado.');
    return Response.redirect(await assetUrl(a.key));
  } catch (e) {
    return apiError(e);
  }
}
