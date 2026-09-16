import { headers } from 'next/headers';
import { getAuth } from './auth';
import Redis from 'ioredis';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function requireUser() {
  if (!process.env.DATABASE_URL)
    throw new HttpError(
      503,
      'Configure o Postgres e o Better Auth para conectar sua conta.',
    );
  const s = await getAuth().api.getSession({ headers: await headers() });
  if (!s) throw new HttpError(401, 'Entre na sua conta para continuar.');
  return s.user;
}
export async function checkOrigin(req: Request) {
  const origin = req.headers.get('origin');
  const expected = new URL(process.env.BETTER_AUTH_URL || req.url).origin;
  if (origin && origin !== expected)
    throw new HttpError(403, 'Origem inválida.');
}
let redis: Redis;
export function getRedis() {
  if (!process.env.REDIS_URL)
    throw new HttpError(503, 'Configure o Redis para gerar mídia.');
  return (redis ??= new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
  }));
}
export async function limit(userId: string) {
  const r = getRedis();
  const key = `limit:${userId}:${Math.floor(Date.now() / 60000)}`;
  const n = (await r.eval(
    "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n",
    1,
    key,
  )) as number;
  if (n > 10)
    throw new HttpError(
      429,
      'Limite de 10 pedidos por minuto. Tente novamente em instantes.',
    );
}
export function apiError(e: unknown) {
  if (e instanceof HttpError)
    return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof Error && e.name === 'ZodError')
    return Response.json(
      { error: 'Confira os campos enviados.' },
      { status: 400 },
    );
  console.error(e);
  return Response.json(
    {
      error:
        'Não foi possível concluir. Confira a configuração e tente novamente.',
    },
    { status: 500 },
  );
}
