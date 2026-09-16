import { requireUser, apiError, HttpError, checkOrigin } from '@/lib/server';
import { saveAsset } from '@/lib/storage';
export async function POST(req: Request) {
  try {
    await checkOrigin(req);
    const u = await requireUser();
    if (Number(req.headers.get('content-length')) > 21 * 1024 * 1024)
      throw new HttpError(413, 'Limite de 20 MB.');
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size > 20 * 1024 * 1024)
      throw new HttpError(400, 'Selecione um arquivo de até 20 MB.');
    if (
      ![
        'image/png',
        'image/jpeg',
        'image/webp',
        'video/mp4',
        'video/webm',
      ].includes(file.type)
    )
      throw new HttpError(400, 'Use PNG, JPG, WebP, MP4 ou WebM.');
    return Response.json(
      await saveAsset(
        u.id,
        Buffer.from(await file.arrayBuffer()),
        file.type,
        file.name,
        String(form.get('projectId') || '') || undefined,
      ),
    );
  } catch (e) {
    return apiError(e);
  }
}
