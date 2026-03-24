import "dotenv/config";
import "fastify"; 
import app from "./fastify";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

async function start(): Promise<void> {

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`🚀 Rate limiter running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
