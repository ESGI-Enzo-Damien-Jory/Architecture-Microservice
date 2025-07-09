-- 1) Enum pour le statut
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'delivered',
      'cancelled'
    );
  END IF;
END
$$;

-- 2) Drop ancien schéma
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- 3) Table orders
CREATE TABLE orders (
  id                 UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID            NOT NULL,
  status             order_status    NOT NULL DEFAULT 'pending',
  notes              TEXT,
  total_price_cents  INT             NOT NULL DEFAULT 0,
  created_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes sur orders
CREATE INDEX idx_orders_user_id  ON orders(user_id);
CREATE INDEX idx_orders_status   ON orders(status);
CREATE INDEX idx_orders_created  ON orders(created_at);

-- 4) Table order_items (sans FK vers product/menu)
CREATE TABLE order_items (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type        TEXT      NOT NULL CHECK (item_type IN ('product','menu')),
  item_id          UUID      NOT NULL,
  quantity         INT       NOT NULL CHECK (quantity > 0),
  unit_price_cents INT       NOT NULL CHECK (unit_price_cents >= 0),
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    item_type = 'product' OR item_type = 'menu'
  )
);

-- Indexes sur order_items
CREATE INDEX idx_items_order_id    ON order_items(order_id);
CREATE INDEX idx_items_item_type   ON order_items(item_type);
CREATE INDEX idx_items_item_id     ON order_items(item_id);

-- 5) Trigger pour updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_orders ON orders;
CREATE TRIGGER trg_touch_orders
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_touch_order_items ON order_items;
CREATE TRIGGER trg_touch_order_items
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();
