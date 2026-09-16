import { router } from '@/lib/openrouter';
import { apiError } from '@/lib/server';
export async function GET() {
  try {
    const r = router();
    const [images, videos] = await Promise.all([
      r.images.listModels(),
      r.videoGeneration.listVideosModels(),
    ]);
    return Response.json([
      ...images.data.map((m) => ({
        id: m.id,
        name: m.name,
        kind: 'image',
        provider: m.id.split('/')[0],
      })),
      ...videos.data.map((m) => ({
        id: m.id,
        name: m.name,
        kind: 'video',
        provider: m.id.split('/')[0],
      })),
    ]);
  } catch (e) {
    return apiError(e);
  }
}
