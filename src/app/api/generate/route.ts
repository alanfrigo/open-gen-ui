import {
  requireUser,
  apiError,
  checkOrigin,
  limit,
  HttpError,
} from '@/lib/server';
import { router } from '@/lib/openrouter';
import { saveAsset, storage } from '@/lib/storage';
import { generationSchema, context, references } from '@/lib/generation';
import { db } from '@/db';
import { job } from '@/db/schema';
export const maxDuration = 300;
export async function POST(req: Request) {
  try {
    await checkOrigin(req);
    const u = await requireUser();
    const b = generationSchema.parse(await req.json());
    await limit(u.id);
    storage();
    const r = router();
    const refs = await references(u.id, b.references);
    const instructions = await context(u.id, b.assistantId);
    const prompt = instructions
      ? `${instructions}\n\nUser request: ${b.prompt}`
      : b.prompt;
    if (b.kind === 'video') {
      if (refs.length > 1)
        throw new HttpError(
          400,
          'Para vídeo, use uma imagem como primeiro frame.',
        );
      const result = await r.videoGeneration.generate({
        videoGenerationRequest: {
          model: b.model,
          prompt,
          aspectRatio: b.aspectRatio,
          ...(refs.length
            ? {
                frameImages: [
                  {
                    frameType: 'first_frame',
                    type: 'image_url',
                    imageUrl: refs[0].imageUrl,
                  },
                ],
              }
            : {}),
        },
      });
      const id = crypto.randomUUID();
      await db.insert(job).values({
        id,
        userId: u.id,
        providerId: result.id,
        status: result.status,
        prompt: b.prompt,
        projectId: b.projectId,
      });
      return Response.json({ jobId: id, status: result.status });
    }
    const result = await r.images.generate({
      imageGenerationRequest: {
        model: b.model,
        prompt,
        aspectRatio: b.aspectRatio,
        inputReferences: refs,
        stream: false,
      },
    });
    if (!('data' in result))
      throw new HttpError(502, 'Resposta inesperada do provedor.');
    const media = await Promise.all(
      result.data.map(async (image, i) => {
        const mime = image.mediaType || 'image/png';
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime))
          throw new HttpError(502, 'Formato não suportado.');
        return saveAsset(
          u.id,
          Buffer.from(image.b64Json, 'base64'),
          mime,
          `${b.prompt.slice(0, 45)} ${i + 1}`,
          b.projectId,
          b.prompt,
        );
      }),
    );
    return Response.json({ media });
  } catch (e) {
    return apiError(e);
  }
}
