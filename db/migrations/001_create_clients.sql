-- clients table: stores rate-limit configuration per client
CREATE TABLE IF NOT EXISTS clients (
  id            SERIAL PRIMARY KEY,
  client_id     VARCHAR(255) UNIQUE NOT NULL,
  algorithm     VARCHAR(50) NOT NULL DEFAULT 'fixed-window',
  max_requests  INTEGER NOT NULL DEFAULT 100,
  window_ms     INTEGER NOT NULL DEFAULT 60000,
  refill_rate   NUMERIC(10,2),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by client_id
CREATE INDEX IF NOT EXISTS idx_clients_client_id ON clients (client_id);
