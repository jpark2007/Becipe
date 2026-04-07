-- Fix feed_items RLS: require authentication for inserts
DROP POLICY IF EXISTS "System inserts feed items" ON feed_items;
CREATE POLICY "Authenticated users insert own feed items"
  ON feed_items FOR INSERT
  WITH CHECK (auth.uid() = actor_id);
