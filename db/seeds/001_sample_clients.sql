-- Sample client data for development and testing

INSERT INTO clients (client_id, algorithm, max_requests, window_ms, refill_rate)
VALUES
  ('client-a', 'fixed-window', 100, 60000, NULL),
  ('client-b', 'sliding-window', 50, 30000, NULL),
  ('client-c', 'token-bucket', 10, 60000, 2.0)
ON CONFLICT (client_id) DO NOTHING;
