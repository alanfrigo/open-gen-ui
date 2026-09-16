import { getAuth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
async function handle(req: Request) {
  if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET)
    return Response.json(
      { message: 'Configure Postgres e Better Auth no servidor.' },
      { status: 503 },
    );
  const handlers = toNextJsHandler(getAuth());
  return req.method === 'GET' ? handlers.GET(req) : handlers.POST(req);
}
export const GET = handle;
export const POST = handle;
