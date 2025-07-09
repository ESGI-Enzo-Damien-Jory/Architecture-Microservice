-- delivery/init.sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if it exists
DROP TABLE IF EXISTS deliveries;

-- Create deliveries table with UUID primary key
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    delivery_person_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'available',
    reserved_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_person_id ON deliveries(delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_client_id ON deliveries(client_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_deliveries_updated_at ON deliveries;
CREATE TRIGGER update_deliveries_updated_at
    BEFORE UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some test data (optional, comment out if not needed)
-- INSERT INTO deliveries (order_id, client_id, status) VALUES 
--     ('order-001', 'client-001', 'available'),
--     ('order-002', 'client-002', 'available')
-- ON CONFLICT DO NOTHING;