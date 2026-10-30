CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  ghost_player_id UUID,
  secret_word TEXT,
  clue TEXT NOT NULL DEFAULT '',
  round_number INTEGER NOT NULL DEFAULT 1,
  winner_player_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)