import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import 'dotenv/config';

async function runMigrations() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'rate_limiter',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
  });

  try {
    const files = fs.readdirSync(__dirname)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log('Running database migrations...');
    for (const file of files) {
      console.log(`-> ${file}`);
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      await pool.query(sql);
    }
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
