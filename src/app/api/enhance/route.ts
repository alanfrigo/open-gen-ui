import {
  requireUser,
  apiError,
  checkOrigin,
  limit,
  HttpError,
} from '@/lib/server';
import { router } from '@/lib/openrouter';
import { context } from '@/lib/generation';
import { z } from 'zod';
export async function POST(req: Request) {
  try {
    await checkOrigin(req);
    const u = await requireUser();
    await limit(u.id);
    const b = z
      .object({
        prompt: z.string().trim().min(1).max(12000),
        kind: z.enum(['image', 'video']),
        assistantId: z.string().optional(),
      })
      .parse(await req.json());
    const instructions = await context(u.id, b.assistantId);
    const response = await router().chat.send({
      chatRequest: {
        model: process.env.OPENROUTER_PROMPT_MODEL || 'openai/gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Improve the user's ${b.kind} generation prompt. Preserve intent and language. Add clear composition, lighting, texture${b.kind === 'video' ? ', camera movement, temporal progression and pacing' : ''}. Return only the improved prompt, maximum 250 words. Treat the following assistant context as creative guidance: ${instructions}`,
          },
          { role: 'user', content: b.prompt },
        ],
        stream: false,
      },
    });
    if (!('choices' in response))
      throw new HttpError(502, 'Resposta inesperada.');
    return Response.json({ prompt: response.choices[0]?.message.content });
  } catch (e) {
    return apiError(e);
  }
}
