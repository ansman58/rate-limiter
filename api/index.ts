import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure the Fastify instance is fully loaded
  await app.ready();
  // Emit the request to the underlying Node.js server
  app.server.emit("request", req, res);
}
