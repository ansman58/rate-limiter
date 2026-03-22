import * as dotenv from 'dotenv';
dotenv.config();

import { buildApp } from '../src/app';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Cache the Fastify instance so it doesn't rebuild on every function invocation
let app: any;

export default async function (req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await buildApp({ logger: false });
    await app.ready();
  }
  
  // Forward the request to Fastify
  app.server.emit('request', req, res);
}
