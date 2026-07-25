/*
# Create high_scores table (single-tenant, no auth)

1. New Tables
- `high_scores`
  - `id` (uuid, primary key)
  - `player_name` (text, not null) — the name the player typed in
  - `game` (text, not null) — slug identifying the game (tic-tac-toe, memory, snake, 2048)
  - `score` (integer, not null) — the achieved score
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `high_scores`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public
  (no sign-in screen; any visitor can submit and view scores).
3. Indexes
- Index on (game, score desc) for fast "top scores per game" queries.
*/

CREATE TABLE IF NOT EXISTS high_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  game text NOT NULL,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_high_scores_game_score
  ON high_scores (game, score DESC);

ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_high_scores" ON high_scores;
CREATE POLICY "anon_select_high_scores" ON high_scores FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_high_scores" ON high_scores;
CREATE POLICY "anon_insert_high_scores" ON high_scores FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_high_scores" ON high_scores;
CREATE POLICY "anon_update_high_scores" ON high_scores FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_high_scores" ON high_scores;
CREATE POLICY "anon_delete_high_scores" ON high_scores FOR DELETE
  TO anon, authenticated USING (true);
