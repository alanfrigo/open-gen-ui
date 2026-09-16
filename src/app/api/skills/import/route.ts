import { requireUser, checkOrigin, apiError, HttpError } from '@/lib/server';
import { z } from 'zod';
export async function POST(req: Request) {
  try {
    await checkOrigin(req);
    await requireUser();
    const { url } = z
      .object({ url: z.string().url().max(500) })
      .parse(await req.json());
    const parsed = new URL(url);
    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname !== 'raw.githubusercontent.com' ||
      !parsed.pathname.endsWith('/SKILL.md')
    )
      throw new HttpError(
        400,
        'Cole a URL raw.githubusercontent.com do arquivo SKILL.md do repositório listado no skills.sh.',
      );
    const response = await fetch(parsed, {
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw new HttpError(400, 'Não foi possível ler essa skill.');
    const reader = response.body!.getReader();
    let content = '';
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      content += decoder.decode(value, { stream: true });
      if (content.length > 50000) {
        await reader.cancel();
        throw new HttpError(413, 'A skill deve ter até 50 KB.');
      }
    }
    return Response.json({
      id: crypto.randomUUID(),
      name:
        content
          .match(/^name:\s*(.+)$/m)?.[1]
          ?.replace(/["']/g, '')
          .slice(0, 100) || 'Skill importada',
      content,
      source: url,
    });
  } catch (e) {
    return apiError(e);
  }
}
