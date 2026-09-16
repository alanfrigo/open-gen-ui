import { OpenRouter } from '@openrouter/sdk';
import { HttpError } from './server';
export function router() {
  if (!process.env.OPENROUTER_API_KEY)
    throw new HttpError(
      503,
      'Adicione OPENROUTER_API_KEY no servidor para começar a gerar.',
    );
  return new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    retryConfig: { strategy: 'none' },
    timeoutMs: 240000,
  });
}
