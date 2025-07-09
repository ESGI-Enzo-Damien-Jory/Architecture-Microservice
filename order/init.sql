-- Create orders table with proper constraints
CREATE TABLE IF NOT EXISTS orders
(
    id
    VARCHAR
(
    255
) PRIMARY KEY,
    user_id VARCHAR
(
    255
) NOT NULL,
    product VARCHAR
(
    255
) NOT NULL,
    quantity INTEGER NOT NULL CHECK
(
    quantity >
    0
),
    status VARCHAR
(
    50
) DEFAULT 'pending' CHECK
(
    status
    IN
(
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'delivered',
    'cancelled'
)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);

-- Add trigger to automatically update updated_at timestamp
CREATE
OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at
= CURRENT_TIMESTAMP;
RETURN NEW;
END;
$
language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE
    ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
INSERT INTO orders (id, user_id, product, quantity, status)
VALUES ('ord-001', 'user-001', 'Pizza Margherita', 2, 'pending'),
       ('ord-002', 'user-002', 'Burger Classic', 1, 'confirmed'),
       ('ord-003', 'user-001', 'Pasta Carbonara', 1, 'preparing') ON CONFLICT (id) DO NOTHING;