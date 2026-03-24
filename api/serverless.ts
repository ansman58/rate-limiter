import 'dotenv/config';
import { buildApp } from '../src/app';

let app: Awaited<ReturnType<typeof buildApp>>;

export default async function handler(req: any, res: any) {
  if (!app) {
    app = await buildApp({ logger: false });
    await app.ready();
  }

  app.server.emit('request', req, res);
}
