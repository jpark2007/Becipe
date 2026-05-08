-- 014_recipe_shares.sql
-- Recipe sharing (DM) tables

-- Shares table
CREATE TABLE IF NOT EXISTS recipe_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  note text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shares_recipient ON recipe_shares (recipient_id, created_at DESC);
CREATE INDEX idx_shares_thread ON recipe_shares (sender_id, recipient_id, created_at DESC);

ALTER TABLE recipe_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert shares they send"
  ON recipe_shares FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can read their own shares"
  ON recipe_shares FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Recipients can mark shares as read"
  ON recipe_shares FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Reactions table
CREATE TABLE IF NOT EXISTS share_reactions (
  share_id uuid NOT NULL REFERENCES recipe_shares(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('fire', 'heart', 'drooling_face', 'cook', 'raising_hands')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (share_id, user_id)
);

ALTER TABLE share_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can insert reactions"
  ON share_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM recipe_shares
      WHERE id = share_id
      AND (sender_id = auth.uid() OR recipient_id = auth.uid())
    )
  );

CREATE POLICY "Participants can read reactions"
  ON share_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipe_shares
      WHERE id = share_id
      AND (sender_id = auth.uid() OR recipient_id = auth.uid())
    )
  );
