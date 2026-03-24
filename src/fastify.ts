import fs from "fs";

import path from "path";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { createRedisClient } from "./config/redis";
import { createPool } from "./config/db";
import checkRoutes from "./routes/check";
import adminRoutes from "./routes/admin";

const app = Fastify({
  logger: true,
});


// --- Serve static UI dashboard (Bypass fastify-static stream bug on Vercel) ---
if (process.env.VERCEL) {
  app.get("/", async (request, reply) => {
    const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
    return reply.type("text/html").send(html);
  });
} else {
  app.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
    prefix: "/",
  });
}

// --- Decorate with Redis ---
const redis = createRedisClient();
app.decorate("redis", redis);
app.addHook("onClose", async () => {
  await redis.quit();
});

// --- Decorate with Postgres ---
const pg = createPool();
app.decorate("pg", pg);
app.addHook("onClose", async () => {
  await pg.end();
});

// --- Register routes ---
app.register(checkRoutes);
app.register(adminRoutes);

// --- Health check ---
app.get("/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

export default app;
